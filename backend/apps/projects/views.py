from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
import logging

from .models import Project, ProjectRequirement
from apps.bids.models import Bid
from .serializers import (
    ProjectSerializer,
    ProjectRequirementSerializer,
    ProjectCreateSerializer,
)
from .permissions import IsProjectOwnerOrAssignedProvider, IsProjectOwnerOrReadOnly
from apps.ai_engine.services.analysis_service import ProjectAnalysisService
from apps.ai_engine.services.matching_service import AIMatchingService
from apps.ai_engine.permissions import CanUseAI
from apps.messaging.models import Conversation
from apps.messaging.serializers import ConversationSerializer

logger = logging.getLogger(__name__)


# ------------------------
# Filters
# ------------------------
class ProjectFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="iexact")
    category = filters.NumberFilter(field_name="category_id")
    budget_min = filters.NumberFilter(field_name="budget", lookup_expr="gte")
    budget_max = filters.NumberFilter(field_name="budget", lookup_expr="lte")
    skills = filters.ModelMultipleChoiceFilter(
        field_name="skills",
        queryset=Project._meta.get_field("skills").related_model.objects.all(),
    )

    class Meta:
        model = Project
        fields = ["status", "category", "budget_min", "budget_max", "skills"]


# ------------------------
# Project ViewSet
# ------------------------
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = (
        Project.objects
        .select_related("category", "created_by")
        .prefetch_related("skills", "requirements", "attachments")
        .exclude(status="deleted")
    )

    permission_classes = [IsProjectOwnerOrAssignedProvider]
    filterset_class = ProjectFilter
    ordering_fields = ["created_at", "budget"]
    search_fields = ["title", "description"]
    
    def get_permissions(self):
        """
        Override permissions for specific actions.
        """
        # Allow any authenticated user to generate cover letters (will be validated in the action)
        if self.action == 'generate_cover_letter':
            from rest_framework.permissions import IsAuthenticated
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset().exclude(status="deleted")

        if self.action == 'list':
            # Everyone sees open or public projects
            return queryset.filter(
                models.Q(status='open') | models.Q(visibility='public')
            )

        if self.action in ['retrieve', 'update', 'partial_update']:
            # Owner, open projects, or assigned providers
            return queryset.filter(
                models.Q(created_by=user) |
                models.Q(status='open') |
                models.Q(status='completed') |
                models.Q(bids__service_provider=user, bids__status='accepted', status='in_progress')
            ).distinct()

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return ProjectCreateSerializer
        return ProjectSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve project with automatic AI analysis refresh if stale"""
        instance = self.get_object()
        
        # Auto-refresh analysis if stale (background task, doesn't block response)
        from apps.ai_engine.services.integration_service import AIIntegrationService
        try:
            AIIntegrationService.refresh_project_analysis_if_stale(
                project=instance,
                user=request.user
            )
        except Exception as e:
            logger.warning(f"Auto-refresh analysis for project {instance.id} failed: {e}")
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status == "closed":
            raise serializers.ValidationError("Closed projects cannot be modified.")
        serializer.save()

    def perform_destroy(self, instance):
        instance.status = "deleted"
        instance.save()

    # ------------------------
    # Helper
    # ------------------------
    def create_conversation_for_project(self, project, provider):
        conversation, created = Conversation.objects.get_or_create(project=project)
        conversation.participants.add(project.created_by, provider)
        return conversation

    # ------------------------
    # Custom actions
    # ------------------------
    @action(detail=True, methods=["post"])
    def bulk_requirements(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectRequirementSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def analyze(self, request, pk=None):
        project = self.get_object()
        if project.status != "open":
            return Response({"error": "Project must be open for analysis"}, status=400)
        return Response({"status": "READY_FOR_AI", "project_id": project.id})

    @action(detail=True, methods=['post'], permission_classes=[CanUseAI], url_path='ai-analysis')
    # @ai_rate_limit(rate='10/h')
    def ai_analysis(self, request, pk=None):
        project = self.get_object()
        force_refresh = request.data.get('force_refresh', False)
        analysis_depth = request.data.get('analysis_depth', 'standard')

        try:
            service = ProjectAnalysisService()
            result = service.analyze_project(
                project_id=str(project.id),
                user=request.user,
                force_refresh=force_refresh,
                analysis_depth=analysis_depth
            )

            if 'analysis' in result and 'summary' in result['analysis']:
                project.ai_summary = result['analysis']['summary']
                project.save(update_fields=['ai_summary'])

            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.error(f"Project analysis validation error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Check if it's a rate limit error
            if 'rate limit' in str(e).lower() or 'quota' in str(e).lower() or '429' in str(e):
                logger.warning(f"AI API rate limit hit for project {project.id}")
                
                # Return fallback analysis
                fallback_result = {
                    'analysis': {
                        'summary': f"This project '{project.title}' is seeking {', '.join(project.skills.values_list('name', flat=True)) if project.skills.exists() else 'technical skills'} for a budget of ${project.budget}. AI analysis is temporarily limited due to high usage, but this appears to be a {analysis_depth} complexity project.",
                        'complexity': 'medium',
                        'estimated_duration': '2-4 weeks',
                        'key_requirements': ['Project scope clarification needed', 'Budget appropriate for scope'],
                        'risk_factors': ['Limited AI analysis available'],
                    },
                    'metadata': {
                        'fallback_mode': True,
                        'reason': 'AI service rate limited'
                    }
                }
                
                # Still save a basic summary
                project.ai_summary = fallback_result['analysis']['summary']
                project.save(update_fields=['ai_summary'])
                
                return Response(fallback_result, status=status.HTTP_200_OK)
            else:
                logger.error(f"Project analysis failed: {e}", exc_info=True)
                return Response({'error': 'AI analysis failed. Please try again later.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], permission_classes=[CanUseAI], url_path='match-providers')
    def match_providers(self, request, pk=None):
        project = self.get_object()
        limit = int(request.query_params.get('limit', 5))  # Default to 5
        offset = int(request.query_params.get('offset', 0))
        use_cache = request.query_params.get('use_cache', 'true').lower() == 'true'
        only_applicants = request.query_params.get('only_applicants', 'true').lower() == 'true'

        try:
            matching_service = AIMatchingService()
            provider_ids = None
            if only_applicants:
                provider_ids = project.bids.all().values_list('service_provider_id', flat=True)

            matches = matching_service.match_providers_to_project(
                project=project,
                limit=limit + offset,  # Get more than needed for pagination
                use_cache=use_cache,
                provider_ids=provider_ids
            )
            
            # Handle AI unavailable case
            if not matches and not use_cache:
                return Response({
                    'error': 'AI_UNAVAILABLE',
                    'message': 'Unable to provide accurate matches at this time. Our AI matching system is currently unavailable. Please try again later.',
                    'project_id': str(project.id),
                    'project_title': project.title,
                    'matches_count': 0,
                    'matches': [],
                    'has_more': False
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Apply pagination
            paginated_matches = matches[offset:offset + limit]
            has_more = len(matches) > offset + limit

            return Response({
                'project_id': str(project.id),
                'project_title': project.title,
                'matches_count': len(paginated_matches),
                'total_matches': len(matches),
                'matches': paginated_matches,
                'has_more': has_more,
                'offset': offset,
                'limit': limit
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Provider matching failed: {e}", exc_info=True)
            return Response({'error': 'Failed to match providers. Please try again later.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def apply(self, request, pk=None):
        project = self.get_object()
        provider = request.user

        if project.status != "open":
            return Response({"error": "Cannot apply to a project that is not open."}, status=400)

        if project.bids.filter(service_provider=provider).exists():
            return Response({"error": "You have already applied for this project."}, status=400)

        bid = project.bids.create(service_provider=provider)
        return Response({"status": "applied", "bid_id": bid.id}, status=201)

    @action(detail=True, methods=['post'])
    def choose_provider(self, request, pk=None):
        project = self.get_object()

        if project.created_by != request.user:
            return Response({"error": "Only the owner can choose a provider."}, status=403)

        provider_id = request.data.get("provider_id")
        try:
            bid = project.bids.get(service_provider_id=provider_id)
        except Bid.DoesNotExist:
            return Response({"error": "This provider has not applied."}, status=404)

        project.status = "in_progress"
        project.save()
        bid.status = 'accepted'
        bid.save()
        project.bids.exclude(id=bid.id).update(status='rejected')

        # Create conversation
        self.create_conversation_for_project(project, bid.service_provider)

        return Response({"status": "provider_chosen", "provider_id": provider_id}, status=200)
    
    # ------------------------
    # Conversation action
    # ------------------------
    @action(detail=True, methods=["post"], url_path="start-conversation")
    def start_conversation(self, request, pk=None):
        """
        Start a conversation between project owner and provider for this project.
        If a conversation already exists, return it.
        """
        project = self.get_object()
        user = request.user

        # Determine the participant: if user is owner, provider must be sent in body
        if project.created_by == user:
            provider_id = request.data.get("provider_id")
            if not provider_id:
                return Response({"error": "Provider ID is required."}, status=400)
            try:
                provider = project.bids.get(status="accepted", service_provider_id=provider_id).service_provider
            except Bid.DoesNotExist:
                return Response({"error": "Provider not found or not accepted for this project."}, status=404)
        else:
            # user is provider
            provider = user
            if project.created_by != project.created_by:
                owner = project.created_by

        # Check if conversation exists
        conversation = Conversation.objects.filter(project=project).first()
        if conversation:
            serializer = ConversationSerializer(conversation, context={'request': request})
            return Response(serializer.data)

        # Create new conversation
        conversation = Conversation.objects.create(project=project)
        conversation.participants.add(project.created_by, provider)
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=201)
    
    @action(detail=True, methods=['post'], url_path='generate-cover-letter')
    def generate_cover_letter(self, request, pk=None):
        """
        Generate AI-suggested cover letter for bidding on this project.
        
        POST /api/v1/projects/{project_id}/generate-cover-letter/
        
        Returns AI-generated cover letter suggestion that providers can use.
        """
        from apps.ai_engine.services.integration_service import AIIntegrationService
        
        # Ensure user is a provider
        if request.user.user_type not in ['provider', 'both']:
            return Response(
                {"error": "Only service providers can generate cover letters."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        project = self.get_object()
        
        # Don't allow generating cover letter for own project
        if project.created_by == request.user:
            return Response(
                {"error": "You cannot bid on your own project."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate cover letter
        cover_letter = AIIntegrationService.generate_cover_letter_suggestion(
            project=project,
            provider=request.user
        )
        
        if cover_letter:
            return Response({
                'cover_letter': cover_letter,
                'project_title': project.title,
                'note': 'This is an AI-generated suggestion. Please review and customize before submitting.'
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Failed to generate cover letter. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ------------------------
# Project Requirements
# ------------------------
class ProjectRequirementViewSet(viewsets.ModelViewSet):
    queryset = ProjectRequirement.objects.all()
    serializer_class = ProjectRequirementSerializer
    filterset_fields = ["project"]
    ordering_fields = ["id", "project"]
