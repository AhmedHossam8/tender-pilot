from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from django.core.exceptions import ObjectDoesNotExist
from .models import Proposal, ProposalSection, ProposalDocument
from apps.tenders.models import Tender
from .services.context_builder import build_proposal_context
from .services.writer import generate_proposal_sections
from .services.document_generator import generate_proposal_document
from common.viewsets import BaseModelViewSet
from .serializers import ProposalSerializer
from rest_framework.permissions import IsAuthenticated
import logging

logger = logging.getLogger(__name__)

class ProposalViewSet(BaseModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["tender", "status"]
    ordering_fields = ["created_at"]

    @action(detail=False, methods=["post"], url_path="generate-from-tender/(?P<tender_id>[^/.]+)")
    def generate_from_tender(self, request, tender_id=None):
        try:
            # Validate tender_id
            if not tender_id:
                raise ValidationError({"tender_id": "Tender ID is required"})
            
            # Get tender
            try:
                tender = Tender.objects.get(id=tender_id)
            except (ObjectDoesNotExist, ValueError) as e:
                raise NotFound({"detail": f"Tender with id {tender_id} not found"})
            
            # Create proposal
            try:
                proposal = Proposal.objects.create(
                    tender=tender,
                    created_by=request.user,
                    title=f"Technical Proposal – {tender.title}"
                )
            except Exception as e:
                logger.error(f"Error creating proposal: {e}", exc_info=True)
                raise ValidationError({"detail": f"Failed to create proposal: {str(e)}"})
            
            # Build context from AI-extracted document
            try:
                context = build_proposal_context(tender)
            except ValueError as e:
                logger.error(f"Error building proposal context: {e}", exc_info=True)
                # Delete the proposal if context building fails
                proposal.delete()
                raise ValidationError({
                    "detail": str(e),
                    "hint": "Make sure the tender has an AI-processed document. You may need to analyze the tender first."
                })
            except Exception as e:
                logger.error(f"Unexpected error building context: {e}", exc_info=True)
                proposal.delete()
                raise ValidationError({"detail": f"Failed to build proposal context: {str(e)}"})
            
            # Generate sections
            try:
                ai_sections = generate_proposal_sections(context)
                
                # Validate that ai_sections is a dictionary
                if not isinstance(ai_sections, dict):
                    logger.error(f"AI sections is not a dictionary: {type(ai_sections)}")
                    raise ValidationError({"detail": "Invalid response from AI service"})
                
            except ValueError as e:
                logger.error(f"Error generating proposal sections: {e}", exc_info=True)
                proposal.delete()
                raise ValidationError({"detail": f"Failed to generate proposal sections: {str(e)}"})
            except Exception as e:
                logger.error(f"Unexpected error generating sections: {e}", exc_info=True)
                proposal.delete()
                raise ValidationError({"detail": f"Failed to generate proposal sections: {str(e)}"})
            
            # Create proposal sections
            try:
                for name, content in ai_sections.items():
                    ProposalSection.objects.create(
                        proposal=proposal,
                        name=name,
                        content=str(content) if content else "",
                        ai_generated=True
                    )
            except Exception as e:
                logger.error(f"Error creating proposal sections: {e}", exc_info=True)
                # Don't delete proposal, but log the error
                raise ValidationError({"detail": f"Failed to create proposal sections: {str(e)}"})
            
            return Response(
                {"proposal_id": proposal.id, "sections_created": len(ai_sections)},
                status=status.HTTP_201_CREATED
            )
            
        except (NotFound, ValidationError):
            # Re-raise DRF exceptions
            raise
        except Exception as e:
            logger.error(f"Unexpected error in generate_from_tender: {e}", exc_info=True)
            raise ValidationError({"detail": f"An unexpected error occurred: {str(e)}"})

    @action(detail=True, methods=["post"])
    def submit_for_review(self, request, pk=None):
        """Proposal writer moves draft → in_review"""
        proposal = self.get_object()
        if not request.user.has_role('proposal_writer'):
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

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """Reviewer approves proposal (in_review → approved)"""
        proposal = self.get_object()
        if not request.user.has_role('reviewer'):
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

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        """Proposal manager submits proposal (approved → submitted)"""
        proposal = self.get_object()
        if not request.user.has_role('proposal_manager') and not request.user.has_role('admin'):
            raise ValidationError({"detail": "Only proposal managers can submit proposals"})
        if proposal.status != 'approved':
            raise ValidationError({"detail": "Proposal must be approved before final submission"})
        
        proposal.status = 'submitted'
        proposal.save()
        
        proposal_AuditLog.objects.create(
        proposal=proposal,
        user=request.user,
        action="submit"
        )
        
        return Response({"status": "Proposal submitted", "proposal_id": proposal.id}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="sections/(?P<section_id>[^/.]+)/regenerate")
    def regenerate_section(self, request, pk=None, section_id=None):
        """Regenerate a specific section using AI"""
        proposal = self.get_object()
        
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
                
                proposal_AuditLog.objects.create(
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

    @action(detail=True, methods=["post"], url_path="generate-document")
    def generate_document(self, request, pk=None):
        """Generate DOCX document from proposal"""
        proposal = self.get_object()
        
        try:
            document_file = generate_proposal_document(proposal)
            
            # Create ProposalDocument record
            proposal_doc = ProposalDocument.objects.create(
                proposal=proposal,
                file=document_file,
                type='docx'
            )
            
            proposal_AuditLog.objects.create(
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