from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from django.shortcuts import get_object_or_404
from .models import ProposalSection
from .services.context_builder import build_proposal_context
from .services.writer import generate_proposal_sections, generate_proposal_review
from common.viewsets import BaseModelViewSet
from .serializers import ProposalSectionSerializer
from rest_framework.permissions import IsAuthenticated
import logging

logger = logging.getLogger(__name__)

class ProposalSectionViewSet(BaseModelViewSet):
    """
    ViewSet for managing proposal sections.
    """
    queryset = ProposalSection.objects.all()
    serializer_class = ProposalSectionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["proposal", "ai_generated"]
    ordering_fields = ["id", "name"]
    
    def get_queryset(self):
        """Filter sections by proposal if proposal_id is provided"""
        queryset = super().get_queryset()
        proposal_id = self.request.query_params.get('proposal_id')
        if proposal_id:
            queryset = queryset.filter(proposal_id=proposal_id)
        return queryset
    
    @action(detail=True, methods=["post"], url_path="regenerate")
    def regenerate(self, request, pk=None):
        """Regenerate this section using AI"""
        section = self.get_object()
        proposal = section.proposal
        
        try:
            # Build context from tender
            context = build_proposal_context(proposal.tender)
            
            # Generate sections
            ai_sections = generate_proposal_sections(context)
            
            # Update the section if it exists in AI response
            if section.name in ai_sections:
                section.content = str(ai_sections[section.name]) if ai_sections[section.name] else ""
                section.ai_generated = True
                section.save()
                
                serializer = self.get_serializer(section)
                return Response({
                    "status": "Section regenerated",
                    "section": serializer.data
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
    
    @action(detail=True, methods=["patch"])
    def update_content(self, request, pk=None):
        """Update only the content of a section"""
        section = self.get_object()
        
        content = request.data.get('content')
        if content is None:
            raise ValidationError({"content": "Content field is required"})
        
        section.content = str(content)
        section.ai_generated = False  # Mark as manually edited
        section.save()
        
        serializer = self.get_serializer(section)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def ai_feedback(self, request, pk=None):
        """Get AI-assisted feedback for a single proposal section (reviewer only)"""
        section = self.get_object()
        proposal = section.proposal

        # Only reviewers can access AI feedback
        user = request.user
        role = getattr(user, "role", None)
        reviewer_role = getattr(getattr(user, "Role", None), "REVIEWER", None)
        if role != reviewer_role:
            raise ValidationError("Only reviewers can access AI feedback")

        if proposal.status != "in_review":
            return Response(
                {"detail": "AI feedback is only available while proposal is in review"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Build context from tender
            context = build_proposal_context(proposal.tender)
            # Review only this section in context of the full tender
            feedback = generate_proposal_review(context, {section.name: section.content})
        except Exception as e:
            logger.error(
                "Error generating AI feedback for section %s: %s",
                section.id,
                e,
                exc_info=True,
            )
            raise ValidationError({"detail": "Failed to generate AI feedback"})

        # Convert structured feedback into a readable string for the UI
        if isinstance(feedback, dict):
            overall = feedback.get("overall_rating") or "N/A"
            strengths = feedback.get("strengths") or []
            weaknesses = feedback.get("weaknesses") or []
            missing_elements = feedback.get("missing_elements") or []
            recommendations = feedback.get("recommendations") or []

            parts = [f"Overall rating: {overall}."]
            if strengths:
                parts.append("Strengths: " + "; ".join(str(s) for s in strengths))
            if weaknesses:
                parts.append("Weaknesses: " + "; ".join(str(w) for w in weaknesses))
            if missing_elements:
                parts.append("Missing elements: " + "; ".join(str(m) for m in missing_elements))
            if recommendations:
                parts.append("Recommendations: " + "; ".join(str(r) for r in recommendations))

            feedback_text = " ".join(parts)
        else:
            feedback_text = str(feedback) if feedback is not None else "No AI suggestions available yet."

        return Response(
            {
                "section_id": section.id,
                "proposal_id": proposal.id,
                "ai_feedback": feedback_text,
            },
            status=status.HTTP_200_OK,
        )
