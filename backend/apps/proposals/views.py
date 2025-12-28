from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, ValidationError
from django.core.exceptions import ObjectDoesNotExist
from .models import Proposal, ProposalSection, ProposalDocument
from apps.tenders.models import Tender
from .services.context_builder import build_proposal_context
from .services.writer import generate_proposal_sections, generate_proposal_review, generate_proposal_checklist
from .services.document_generator import generate_proposal_document
from common.viewsets import BaseModelViewSet
from .serializers import ProposalSerializer
from rest_framework.permissions import IsAuthenticated
from common.throttles import ProposalReadTrhottle, ProposalWriteThrottle
from .services.ai_request_handler import AIRequestHandler
import logging, json

logger = logging.getLogger(__name__)
ai_handler = AIRequestHandler()


class ProposalViewSet(BaseModelViewSet):
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tender", "status"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        user = self.request.user
        queryset = Proposal.objects.select_related('tender', 'created_by').prefetch_related('sections', 'documents')

        if user.role == user.Role.ADMIN:
            return queryset
        if user.role == user.Role.REVIEWER:
            return queryset.filter(status=Proposal.Status.IN_REVIEW)
        return queryset.filter(created_by=user)

    @action(detail=False, methods=["post"], url_path="generate-from-tender/(?P<tender_id>[^/.]+)", throttle_classes=[ProposalWriteThrottle])
    def generate_from_tender(self, request, tender_id=None):
        if not tender_id:
            raise ValidationError({"tender_id": "Tender ID is required"})
        try:
            tender = Tender.objects.select_related('created_by').get(id=tender_id)
        except (ObjectDoesNotExist, ValueError):
            raise NotFound({"detail": f"Tender with id {tender_id} not found"})

        existing = Proposal.objects.filter(tender=tender, created_by=request.user, status=Proposal.Status.DRAFT).first()
        if existing:
            return Response({"detail": "Draft proposal already exists", "proposal_id": existing.id}, status=200)

        proposal = Proposal.objects.create(tender=tender, created_by=request.user, title=f"Technical Proposal – {tender.title}")

        try:
            context = build_proposal_context(tender)
        except Exception as e:
            logger.error(f"Error building proposal context: {e}", exc_info=True)
            proposal.delete()
            raise ValidationError({"detail": str(e), "hint": "Ensure the tender has an AI-processed document first."})

        try:
            key_requirements = context.get("requirements", [])
            rag_results = ai_handler.execute({"task": "proposal-rag", "key_requirements": key_requirements})
            ai_sections = ai_handler.execute({"task": "proposal-section-generation", "context": context, "rag_results": rag_results.get("retrieved_sections", {})})

            if not isinstance(ai_sections, dict):
                raise ValidationError({"detail": "Invalid response from AI service"})

            for name, content in ai_sections.items():
                ProposalSection.objects.create(proposal=proposal, name=name, content=str(content) if content else "")

            return Response({"proposal_id": proposal.id, "sections_created": len(ai_sections)}, status=201)

        except Exception as e:
            logger.error(f"Unexpected error in generate_from_tender: {e}", exc_info=True)
            proposal.delete()
            raise ValidationError({"detail": f"An unexpected error occurred: {str(e)}"})

    # ---------- Status Actions ----------

    @action(detail=True, methods=["post"], throttle_classes=[ProposalWriteThrottle])
    def submit_for_review(self, request, pk=None):
        proposal = self.get_object()
        if request.user.role != request.user.Role.WRITER or proposal.created_by != request.user:
            raise ValidationError("Only proposal writers can submit their own proposals")
        proposal.change_status(Proposal.Status.IN_REVIEW, user=request.user, action="submit_for_review")
        return Response({"status": proposal.status, "proposal_id": proposal.id})

    @action(detail=True, methods=["post"], throttle_classes=[ProposalWriteThrottle])
    def approve(self, request, pk=None):
        proposal = self.get_object()
        if request.user.role != request.user.Role.REVIEWER:
            raise ValidationError("Only reviewers can approve proposals")
        proposal.change_status(Proposal.Status.APPROVED, user=request.user, action="approve")
        return Response({"status": proposal.status, "proposal_id": proposal.id})

    @action(detail=True, methods=["post"], throttle_classes=[ProposalWriteThrottle])
    def reject(self, request, pk=None):
        proposal = self.get_object()
        if request.user.role != request.user.Role.REVIEWER:
            raise ValidationError("Only reviewers can reject proposals")
        proposal.change_status(Proposal.Status.REJECTED, user=request.user, action="reject")
        return Response({"status": proposal.status, "proposal_id": proposal.id})

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        proposal = self.get_object()
        if request.user.role not in [request.user.Role.PROPOSAL_MANAGER, request.user.Role.ADMIN]:
            raise ValidationError("Only proposal managers can submit proposals")
        proposal.change_status(Proposal.Status.SUBMITTED, user=request.user, action="submit")
        return Response({"status": proposal.status, "proposal_id": proposal.id})

    # ---------- Section Regeneration ----------

    @action(detail=True, methods=["post"], url_path="sections/(?P<section_id>[^/.]+)/regenerate", throttle_classes=[ProposalWriteThrottle])
    def regenerate_section(self, request, pk=None, section_id=None):
        proposal = self.get_object()
        if proposal.status not in [Proposal.Status.DRAFT, Proposal.Status.IN_REVIEW]:
            raise ValidationError("Cannot regenerate sections after approval")

        try:
            section = ProposalSection.objects.get(id=section_id, proposal=proposal)
        except ProposalSection.DoesNotExist:
            raise NotFound({"detail": f"Section with id {section_id} not found"})

        try:
            context = build_proposal_context(proposal.tender)
            ai_sections = generate_proposal_sections(context)
            if section.name in ai_sections:
                section.content = str(ai_sections[section.name]) if ai_sections[section.name] else ""
                section.ai_generated = True
                section.save()
            else:
                raise ValidationError(f"Section '{section.name}' not found in AI response")
            return Response({"status": "Section regenerated", "section_id": section.id, "section_name": section.name})
        except Exception as e:
            logger.error(f"Error regenerating section: {e}", exc_info=True)
            raise ValidationError({"detail": str(e)})

    # ---------- Document & Feedback ----------

    @action(detail=True, methods=["post"], url_path="generate-document", throttle_classes=[ProposalWriteThrottle])
    def generate_document(self, request, pk=None):
        proposal = self.get_object()
        if proposal.status not in [Proposal.Status.APPROVED, Proposal.Status.SUBMITTED]:
            raise ValidationError("Proposal must be approved before document generation")

        try:
            document_file = generate_proposal_document(proposal)
            proposal_doc = ProposalDocument.objects.create(proposal=proposal, file=document_file, type='docx')
            return Response({"status": "Document generated", "document_id": proposal_doc.id, "file_url": proposal_doc.file.url if proposal_doc.file else None}, status=201)
        except Exception as e:
            logger.error(f"Error generating document: {e}", exc_info=True)
            raise ValidationError({"detail": str(e)})

    @action(detail=True, methods=["post"], throttle_classes=[ProposalWriteThrottle])
    def generate_feedback(self, request, pk=None):
        proposal = self.get_object()
        context = build_proposal_context(proposal.tender)
        sections = {s.name: s.content for s in proposal.sections.all()}
        proposal.ai_feedback = generate_proposal_review(context, sections)
        proposal.save()
        return Response({"status": "AI feedback generated", "ai_feedback": proposal.ai_feedback})

    @action(detail=True, methods=["post"], url_path="generate-checklist", throttle_classes=[ProposalWriteThrottle])
    def generate_checklist(self, request, pk=None):
        proposal = self.get_object()
        context = build_proposal_context(proposal.tender)
        sections = {s.name: s.content for s in proposal.sections.all()}
        checklist_data = generate_proposal_checklist(context, sections)
        return Response({"checklist": checklist_data})

    @action(detail=True, methods=["get"], throttle_classes=[ProposalReadTrhottle])
    def preview(self, request, pk=None):
        proposal = self.get_object()
        return Response({
            "id": proposal.id,
            "title": proposal.title,
            "status": proposal.status,
            "ai_feedback": getattr(proposal, 'ai_feedback', None),
            "sections": [{"id": s.id, "name": s.name, "content": s.content, "ai_generated": s.ai_generated} for s in proposal.sections.all()]
        })
