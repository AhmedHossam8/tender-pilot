from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from django.core.exceptions import ObjectDoesNotExist
from .models import Proposal, ProposalSection, ProposalDocument, ProposalAuditLog
from apps.tenders.models import Tender
from .services.context_builder import build_proposal_context
from .services.writer import generate_proposal_sections, generate_proposal_review, generate_proposal_checklist
from .services.document_generator import generate_proposal_document
from common.viewsets import BaseModelViewSet
from .serializers import ProposalSerializer
from rest_framework.permissions import IsAuthenticated
import logging
import json
from .services.ai_request_handler import AIRequestHandler
from common.throttles import ProposalReadTrhottle , ProposalWriteThrottle

logger = logging.getLogger(__name__)
ai_handler = AIRequestHandler()

class ProposalViewSet(BaseModelViewSet):
    def get_queryset(self):
        user = self.request.user

        if user.role == user.Role.ADMIN:
            return Proposal.objects.all()

        if user.role == user.Role.REVIEWER:
            return Proposal.objects.filter(status="in_review")

        return Proposal.objects.filter(created_by=user)
    
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tender", "status"]
    ordering_fields = ["created_at"]

    @action(detail=False,
            methods=["post"],
            url_path="generate-from-tender/(?P<tender_id>[^/.]+)",
            throttle_classes =[ProposalWriteThrottle])
    def generate_from_tender(self, request, tender_id=None):
        ai_handler = AIRequestHandler()
        try:
            # Validate tender_id
            if not tender_id:
                raise ValidationError({"tender_id": "Tender ID is required"})
            
            # Get tender
            try:
                tender = Tender.objects.get(id=tender_id)
            except (ObjectDoesNotExist, ValueError):
                raise NotFound({"detail": f"Tender with id {tender_id} not found"})
            
            # Check existing draft
            existing = Proposal.objects.filter(
                tender=tender,
                created_by=request.user,
                status="draft"
            ).first()
            if existing:
                return Response({
                    "detail": "Draft proposal already exists",
                    "proposal_id": existing.id
                }, status=status.HTTP_200_OK)
    
            # Create new proposal
            proposal = Proposal.objects.create(
                tender=tender,
                created_by=request.user,
                title=f"Technical Proposal – {tender.title}"
            )
            
            # Build context from tender
            try:
                context = build_proposal_context(tender)
            except Exception as e:
                logger.error(f"Error building proposal context: {e}", exc_info=True)
                proposal.delete()
                raise ValidationError({
                    "detail": str(e),
                    "hint": "Ensure the tender has an AI-processed document first."
                })
    
            # --- RAG integration ---
            key_requirements = context.get("requirements", [])
            rag_results = ai_handler.execute({
                "task": "proposal-rag",
                "key_requirements": key_requirements
            })
            logger.debug("RAG retrieved sections: %s", json.dumps(rag_results.get("retrieved_sections", {})))
    
            # Generate proposal sections using AI + RAG
            ai_sections = ai_handler.execute({
                "task": "proposal-section-generation",
                "context": context,
                "rag_results": rag_results.get("retrieved_sections", {})
            })
    
            if not isinstance(ai_sections, dict):
                raise ValidationError({"detail": "Invalid response from AI service"})
            
            # Create proposal sections
            for name, content in ai_sections.items():
                ProposalSection.objects.create(
                    proposal=proposal,
                    name=name,
                    content=str(content) if content else "",
                )
    
            return Response(
                {"proposal_id": proposal.id, "sections_created": len(ai_sections)},
                status=status.HTTP_201_CREATED
            )
        
        except (NotFound, ValidationError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error in generate_from_tender: {e}", exc_info=True)
            # Clean up partially created proposal
            if 'proposal' in locals():
                proposal.delete()
            raise ValidationError({"detail": f"An unexpected error occurred: {str(e)}"})

    @action(detail=True,
            methods=["post"], 
            throttle_classes=[ProposalWriteThrottle])
    def submit_for_review(self, request, pk=None):
        """Proposal writer moves draft → in_review"""
        proposal = self.get_object()
        if request.user.role != request.user.Role.WRITER or request.user != proposal.created_by:
            raise ValidationError({"detail": "Only proposal writers can submit proposals for review"})

        if proposal.status != 'draft':
            raise ValidationError({"detail": "Only draft proposals can be submitted for review"})

        proposal.status = 'in_review'
        proposal.save()

        ProposalAuditLog.objects.create(
            proposal=proposal,
            user=request.user,
            action="submit_for_review"
        )

        return Response({"status": "Proposal submitted for review", "proposal_id": proposal.id}, status=status.HTTP_200_OK)

    @action(detail=True,
            methods=["post"],
            throttle_classes = [ProposalWriteThrottle])
    def approve(self, request, pk=None):
        """Reviewer approves proposal (in_review → approved)"""
        proposal = self.get_object()
        if request.user.role != request.user.Role.REVIEWER:
            raise ValidationError({"detail": "Only reviewers can approve proposals"})
        if proposal.status != 'in_review':
            raise ValidationError({"detail": "Proposal must be in review state to approve"})
        
        proposal.status = 'approved'
        proposal.save()
        
        ProposalAuditLog.objects.create(
        proposal=proposal,
        user=request.user,
        action="approve"
        )
        
        return Response({"status": "Proposal approved", "proposal_id": proposal.id}, status=status.HTTP_200_OK)

    @action(detail=True,
            methods=["post"],
            throttle_classes=[ProposalWriteThrottle])
    def reject(self, request, pk=None):
        """Reviewer reject proposal (in_review → draft)"""
        proposal = self.get_object()
        if request.user.role != request.user.Role.REVIEWER:
            raise ValidationError({"detail": "Only reviewers can approve proposals"})
        if proposal.status != 'in_review':
            raise ValidationError({"detail": "Proposal must be in review state to approve"})
        
        proposal.status = 'draft'
        proposal.save()
        
        ProposalAuditLog.objects.create(
            proposal=proposal,
            user=request.user,
            action="reject"
        )
        
        return Response({"status": "Proposal rejected", "proposal_id": proposal.id}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """Proposal manager submits proposal (approved → submitted)"""
        proposal = self.get_object()
        if request.user.role not in [request.user.Role.PROPOSAL_MANAGER, request.user.Role.ADMIN]:
            raise ValidationError({"detail": "Only proposal managers can submit proposals"})
        if proposal.status != 'approved':
            raise ValidationError({"detail": "Proposal must be approved before final submission"})
        
        proposal.status = 'submitted'
        proposal.save()

        ProposalAuditLog.objects.create(
        proposal=proposal,
        user=request.user,
        action="submit"
        )
        
        return Response({"status": "Proposal submitted", "proposal_id": proposal.id}, status=status.HTTP_200_OK)

    @action(detail=True,
            methods=["post"],
            url_path="sections/(?P<section_id>[^/.]+)/regenerate",
            throttle_classes=[ProposalWriteThrottle])
    def regenerate_section(self, request, pk=None, section_id=None):
        """Regenerate a specific section using AI"""
        proposal = self.get_object()
        
        if proposal.status not in ["draft", "in_review"]:
            raise ValidationError({
                "detail": "Cannot regenerate sections after approval"
            })
        
        try:
            section = ProposalSection.objects.get(id=section_id, proposal=proposal)
        except ProposalSection.DoesNotExist:
            raise NotFound({"detail": f"Section with id {section_id} not found"})
        
        try:
            # Build context from tender
            context = build_proposal_context(proposal.tender)
            
            # Generate sections (we'll get all sections, but only update the requested one)
            ai_sections = generate_proposal_sections(context)
            
            # Update the specific section if it exists in AI response
            if section.name in ai_sections:
                section.content = str(ai_sections[section.name]) if ai_sections[section.name] else ""
                section.ai_generated = True
                section.save()
                
                ProposalAuditLog.objects.create(
                    proposal=proposal,
                    user=request.user,
                    action="regenerate_section",
                    section_name=section.name
                )
                
                return Response({
                    "status": "Section regenerated",
                    "section_id": section.id,
                    "section_name": section.name
                }, status=status.HTTP_200_OK)
            else:
                raise ValidationError({
                    "detail": f"Section '{section.name}' not found in AI response"
                })
                
        except ValueError as e:
            logger.error(f"Error regenerating section: {e}", exc_info=True)
            raise ValidationError({"detail": str(e)})
        except Exception as e:
            logger.error(f"Unexpected error regenerating section: {e}", exc_info=True)
            raise ValidationError({"detail": f"Failed to regenerate section: {str(e)}"})

    @action(detail=True, methods=["post"],
             url_path="generate-document",
             throttle_classes=[ProposalWriteThrottle])
    def generate_document(self, request, pk=None):
        """Generate DOCX document from proposal"""
        proposal = self.get_object()
        
        if proposal.status not in ["approved", "submitted"]:
            raise ValidationError({
                "detail": "Proposal must be approved before document generation"
            })
        
        try:
            document_file = generate_proposal_document(proposal)
            
            # Create ProposalDocument record
            proposal_doc = ProposalDocument.objects.create(
                proposal=proposal,
                file=document_file,
                type='docx'
            )
            
            ProposalAuditLog.objects.create(
                proposal=proposal,
                user=request.user,
                action="generate_document"
            )
            
            return Response({
                "status": "Document generated",
                "document_id": proposal_doc.id,
                "file_url": proposal_doc.file.url if proposal_doc.file else None
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error generating document: {e}", exc_info=True)
            raise ValidationError({"detail": f"Failed to generate document: {str(e)}"})
    
    @action(detail=True,
            methods=["post"],
            throttle_classes=[ProposalWriteThrottle])
    def generate_feedback(self, request, pk=None):
        proposal = self.get_object()
        context = build_proposal_context(proposal.tender)
        sections = {s.name: s.content for s in proposal.sections.all()}
        proposal.ai_feedback = generate_proposal_review(context, sections)
        proposal.save()
        return Response({"status": "AI feedback generated", "ai_feedback": proposal.ai_feedback}, status=status.HTTP_200_OK)
    
    @action(detail=True,
            methods=["post"],
            url_path="generate-checklist",
            throttle_classes=[ProposalWriteThrottle])
    def generate_checklist(self, request, pk=None):
        proposal = self.get_object()
        context = build_proposal_context(proposal.tender)
        sections = {s.name: s.content for s in proposal.sections.all()}

        checklist_data = generate_proposal_checklist(context, sections)
        return Response({"checklist": checklist_data})
    
    @action(detail=True,
            methods=["get"],
            throttle_classes=[ProposalReadTrhottle])
    def preview(self, request, pk=None):
        proposal = self.get_object()

        return Response({
            "id": proposal.id,
            "title": proposal.title,
            "status": proposal.status,
            "ai_feedback": proposal.ai_feedback,
            "sections": [
                {
                    "id": s.id,
                    "name": s.name,
                    "content": s.content,
                    "ai_generated": s.ai_generated
                }
                for s in proposal.sections.all()
            ]
        })