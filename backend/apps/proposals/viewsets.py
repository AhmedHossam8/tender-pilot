from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from django.shortcuts import get_object_or_404
from .models import ProposalSection
from .services.context_builder import build_proposal_context
from .services.writer import generate_proposal_sections
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
