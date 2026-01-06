import logging
import json

from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.viewsets import BaseModelViewSet
from common.throttles import ProposalReadTrhottle, ProposalWriteThrottle

from apps.projects.models import Project
from .models import Proposal, ProposalSection, ProposalDocument, Status
from .serializers import ProposalSerializer
from .services.context_builder import build_proposal_context
from .services.writer import (
    generate_proposal_sections,
    generate_proposal_review,
    generate_proposal_checklist,
)
from .services.document_generator import generate_proposal_document
from .services.ai_request_handler import AIRequestHandler


logger = logging.getLogger(__name__)
ai_handler = AIRequestHandler()


class ProposalViewSet(BaseModelViewSet):
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["project", "status"]
    ordering_fields = ["created_at"]

    # -------------------------
    # Queryset & Permissions
    # -------------------------
    def get_queryset(self):
        user = self.request.user
    
        queryset = (
            Proposal.objects
            .select_related("project", "created_by")
            .prefetch_related("sections", "documents")
        )
    
        role = getattr(user, "role", None)
    
        if role == user.Role.ADMIN:
            return queryset
    
        if role == user.Role.REVIEWER:
            return queryset.filter(status=Status.IN_REVIEW)
        
        if role == user.Role.PROPOSAL_MANAGER:
            return queryset.filter(status__in=[Status.APPROVED, Status.SUBMITTED])
    
        return queryset.filter(created_by=user)


    # -------------------------
    # Proposal Creation
    # -------------------------
    @action(
        detail=False,
        methods=["post"],
        url_path="generate-from-project/(?P<project_id>[^/.]+)",
        throttle_classes=[ProposalWriteThrottle],
    )
    def generate_from_project(self, request, project_id=None):
        if not project_id:
            raise ValidationError({"project_id": "Project ID is required"})

        try:
            project = Project.objects.select_related("created_by").get(id=project_id)
        except (ObjectDoesNotExist, ValueError):
            raise NotFound({"detail": f"Project with id {project_id} not found"})

        existing = Proposal.objects.filter(
            project=project,
            created_by=request.user,
            status=Proposal.Status.DRAFT,
        ).first()

        if existing:
            return Response(
                {
                    "detail": "Draft proposal already exists",
                    "proposal_id": existing.id,
                },
                status=200,
            )

        proposal = Proposal.objects.create(
            project=project,
            created_by=request.user,
            title=f"Technical Proposal – {project.title}",
        )

        try:
            context = build_proposal_context(project)
        except Exception as e:
            logger.error("Context build failed", exc_info=True)
            proposal.delete()
            raise ValidationError(
                {
                    "detail": str(e),
                    "hint": "Ensure the project has an AI-processed document first.",
                }
            )

        try:
            key_requirements = context.get("requirements", [])
            rag_results = ai_handler.execute(
                {"task": "proposal-rag", "key_requirements": key_requirements}
            )

            ai_sections = ai_handler.execute(
                {
                    "task": "proposal-section-generation",
                    "context": context,
                    "rag_results": rag_results.get("retrieved_sections", {}),
                }
            )

            if not isinstance(ai_sections, dict):
                raise ValidationError("Invalid AI response")

            for name, content in ai_sections.items():
                ProposalSection.objects.create(
                    proposal=proposal,
                    name=name,
                    content=str(content) if content else "",
                )

            return Response(
                {
                    "proposal_id": proposal.id,
                    "sections_created": len(ai_sections),
                },
                status=201,
            )

        except Exception as e:
            logger.error("Proposal generation failed", exc_info=True)
            proposal.delete()
            raise ValidationError({"detail": str(e)})

    # -------------------------
    # Status Actions
    # -------------------------
    @action(detail=True, methods=["post"], throttle_classes=[ProposalWriteThrottle])
    def submit_for_review(self, request, pk=None):
        proposal = self.get_object()

        if request.user.role != request.user.Role.WRITER:
            raise ValidationError("Only writers can submit proposals")

        if proposal.created_by != request.user:
            raise ValidationError("You can only submit your own proposal")

        proposal.change_status(
            Status.IN_REVIEW,
            user=request.user,
            action="submit_for_review",
        )

        return Response(
            {"status": proposal.status, "proposal_id": proposal.id}
        )

    @action(detail=True, methods=["post"], throttle_classes=[ProposalWriteThrottle])
    def approve(self, request, pk=None):
        proposal = self.get_object()

        if request.user.role != request.user.Role.REVIEWER:
            raise ValidationError("Only reviewers can approve proposals")

        proposal.change_status(
            Status.APPROVED,
            user=request.user,
            action="approve",
        )

        return Response(
            {"status": proposal.status, "proposal_id": proposal.id}
        )

    @action(detail=True, methods=["post"], throttle_classes=[ProposalWriteThrottle])
    def reject(self, request, pk=None):
        proposal = self.get_object()

        if request.user.role != request.user.Role.REVIEWER:
            raise ValidationError("Only reviewers can reject proposals")

        proposal.change_status(
            Status.REJECTED,
            user=request.user,
            action="reject",
        )

        return Response(
            {"status": proposal.status, "proposal_id": proposal.id}
        )

    @action(detail=True, methods=["post"], throttle_classes=[ProposalWriteThrottle])
    def submit(self, request, pk=None):
        proposal = self.get_object()

        if request.user.role not in [
            request.user.Role.PROPOSAL_MANAGER,
            request.user.Role.ADMIN,
        ]:
            raise ValidationError("Only proposal managers can submit proposals")

        proposal.change_status(
            Status.SUBMITTED,
            user=request.user,
            action="submit",
        )

        return Response(
            {"status": proposal.status, "proposal_id": proposal.id}
        )

    # -------------------------
    # Section Regeneration
    # -------------------------
    @action(
        detail=True,
        methods=["post"],
        url_path="sections/(?P<section_id>[^/.]+)/regenerate",
        throttle_classes=[ProposalWriteThrottle],
    )
    def regenerate_section(self, request, pk=None, section_id=None):
        proposal = self.get_object()

        if proposal.status not in [
            Status.DRAFT,
            Status.IN_REVIEW,
        ]:
            raise ValidationError("Cannot regenerate sections at this stage")

        try:
            section = ProposalSection.objects.get(
                id=section_id, proposal=proposal
            )
        except ProposalSection.DoesNotExist:
            raise NotFound({"detail": f"Section {section_id} not found"})

        try:
            context = build_proposal_context(proposal.project)
            ai_sections = generate_proposal_sections(context)

            if section.name not in ai_sections:
                raise ValidationError(f"Section '{section.name}' not found")

            section.content = str(ai_sections[section.name]) or ""
            section.ai_generated = True
            section.save()

            return Response(
                {
                    "status": "Section regenerated",
                    "section_id": section.id,
                }
            )

        except Exception as e:
            logger.error("Section regeneration failed", exc_info=True)
            raise ValidationError({"detail": str(e)})

    # -------------------------
    # Document & AI Feedback
    # -------------------------
    @action(
        detail=True,
        methods=["post"],
        url_path="generate-document",
        throttle_classes=[ProposalWriteThrottle],
    )
    def generate_document(self, request, pk=None):
        proposal = self.get_object()

        if proposal.status not in [
            Status.APPROVED,
            Status.SUBMITTED,
        ]:
            raise ValidationError("Proposal must be approved first")

        try:
            document_file = generate_proposal_document(proposal)
            doc = ProposalDocument.objects.create(
                proposal=proposal,
                file=document_file,
                type="docx",
            )

            return Response(
                {
                    "status": "Document generated",
                    "document_id": doc.id,
                    "file_url": doc.file.url if doc.file else None,
                },
                status=201,
            )

        except Exception as e:
            logger.error("Document generation failed", exc_info=True)
            raise ValidationError({"detail": str(e)})

    @action(detail=True, methods=["post"], throttle_classes=[ProposalWriteThrottle])
    def generate_feedback(self, request, pk=None):
        proposal = self.get_object()

        context = build_proposal_context(proposal.project)
        sections = {s.name: s.content for s in proposal.sections.all()}

        proposal.ai_feedback = generate_proposal_review(context, sections)
        proposal.save()

        return Response(
            {"status": "AI feedback generated", "ai_feedback": proposal.ai_feedback}
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="generate-checklist",
        throttle_classes=[ProposalWriteThrottle],
    )
    def generate_checklist(self, request, pk=None):
        proposal = self.get_object()

        context = build_proposal_context(proposal.project)
        sections = {s.name: s.content for s in proposal.sections.all()}

        checklist = generate_proposal_checklist(context, sections)
        return Response({"checklist": checklist})

    # -------------------------
    # Preview
    # -------------------------
    @action(detail=True, methods=["get"], throttle_classes=[ProposalReadTrhottle])
    def preview(self, request, pk=None):
        proposal = self.get_object()

        return Response(
            {
                "id": proposal.id,
                "title": proposal.title,
                "status": proposal.status,
                "ai_feedback": proposal.ai_feedback,
                "sections": [
                    {
                        "id": s.id,
                        "name": s.name,
                        "content": s.content,
                        "ai_generated": s.ai_generated,
                    }
                    for s in proposal.sections.all()
                ],
            }
        )
