from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from .models import Project, ProjectRequirement
from .serializers import (
    ProjectSerializer,
    ProjectRequirementSerializer,
    ProjectCreateSerializer,
)
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from .permissions import IsProjectOwnerOrReadOnly
from apps.ai_engine.services.analysis_service import ProjectAnalysisService
from apps.ai_engine.services.matching_service import AIMatchingService
from apps.ai_engine.permissions import CanUseAI
from apps.ai_engine.decorators import ai_rate_limit
import logging

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

    permission_classes = [IsProjectOwnerOrReadOnly]
    filterset_class = ProjectFilter
    ordering_fields = ["created_at", "budget"]
    search_fields = ["title", "description"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == 'list':
            # For list view, only show user's own projects
            return queryset.filter(created_by=self.request.user)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return ProjectCreateSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status == "closed":
            raise serializers.ValidationError("Closed projects cannot be modified.")
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.status = "deleted"
        instance.save()

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
        """
        Generate AI analysis for a project.

        POST /api/v1/projects/{id}/ai-analysis/

        Request Body:
        {
            "force_refresh": false,
            "analysis_depth": "standard",  // quick|standard|detailed
            "include_documents": true
        }

        Response:
        {
            "request_id": "uuid",
            "analysis": {
                "summary": "...",
                "key_requirements": [...],
                "estimated_complexity": "medium",
                "recommended_actions": [...]
            },
            "tokens_used": 1234,
            "cost": 0.0037,
            "cached": false
        }
        """
        project = self.get_object()

        # Extract parameters
        force_refresh = request.data.get('force_refresh', False)
        analysis_depth = request.data.get('analysis_depth', 'standard')

        try:
            # Use the AI Analysis Service
            service = ProjectAnalysisService()
            result = service.analyze_project(
                project_id=str(project.id),
                user=request.user,
                force_refresh=force_refresh,
                analysis_depth=analysis_depth
            )

            # Update project with AI summary
            if 'analysis' in result and 'summary' in result['analysis']:
                project.ai_summary = result['analysis']['summary']
                project.save(update_fields=['ai_summary'])

            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.error(f"Project analysis validation error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Project analysis failed: {e}", exc_info=True)
            return Response(
                {'error': 'AI analysis failed. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'], permission_classes=[CanUseAI], url_path='match-providers')
    def match_providers(self, request, pk=None):
        project = self.get_object()
        limit = int(request.query_params.get('limit', 10))
        use_cache = request.query_params.get('use_cache', 'true').lower() == 'true'
        only_applicants = request.query_params.get('only_applicants', 'true').lower() == 'true'

        try:
            matching_service = AIMatchingService()

            provider_ids = None
            if only_applicants:
                # Only match providers who applied
                provider_ids = project.bids.all().values_list('service_provider_id', flat=True)

            matches = matching_service.match_providers_to_project(
                project=project,
                limit=limit,
                use_cache=use_cache,
                provider_ids=provider_ids  # <-- filtered providers
            )

            return Response({
                'project_id': str(project.id),
                'project_title': project.title,
                'matches_count': len(matches),
                'matches': matches
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Provider matching failed: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to match providers. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action( detail=True, methods=['get'], url_path='ai-insights')
    def ai_insights(self, request, pk=None):
        """
        Get AI-powered insights about the project.

        GET /api/v1/projects/{id}/ai-insights/

        Returns cached AI analysis data if available.
        """
        project = self.get_object()

        # Check for existing AI analysis
        from apps.ai_engine.models import AIRequest, AIResponse, AIRequestStatus

        latest_request = (
            AIRequest.objects
            .filter(
                content_type='project',
                object_id=str(project.id),
                status=AIRequestStatus.COMPLETED,
                prompt_name='project_analysis'
            )
            .select_related('response')
            .order_by('-created_at')
            .first()
        )

        if not latest_request:
            return Response({
                'has_analysis': False,
                'message': 'No AI analysis available yet. Run analysis first.'
            }, status=status.HTTP_200_OK)

        try:
            import json
            analysis = json.loads(latest_request.response.content)

            return Response({
                'has_analysis': True,
                'analyzed_at': latest_request.created_at,
                'analysis': analysis,
                'tokens_used': latest_request.response.total_tokens,
                'confidence_score': latest_request.response.confidence_score
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Failed to retrieve AI insights: {e}")
            return Response({
                'has_analysis': True,
                'error': 'Failed to parse AI analysis'
            }, status=status.HTTP_200_OK)


    @action(detail=True, methods=['get'], url_path='requirements-summary')
    def requirements_summary(self, request, pk=None):
        """
        Get AI-generated summary of project requirements.

        GET /api/v1/projects/{id}/requirements-summary/

        Useful for quick overview of what the project needs.
        """
        project = self.get_object()

        # Get latest AI analysis
        from apps.ai_engine.models import AIRequest, AIRequestStatus
        import json

        latest_request = (
            AIRequest.objects
            .filter(
                content_type='project',
                object_id=str(project.id),
                status=AIRequestStatus.COMPLETED,
                prompt_name='project_analysis'
            )
            .select_related('response')
            .order_by('-created_at')
            .first()
        )

        if not latest_request:
            # Generate basic summary from project data
            requirements = project.requirements.all()
            return Response({
                'has_ai_summary': False,
                'requirements_count': requirements.count(),
                'requirements': [
                    {'id': r.id, 'description': r.description}
                    for r in requirements
                ]
            })

        try:
            analysis = json.loads(latest_request.response.content)
            key_requirements = analysis.get('key_requirements', [])

            return Response({
                'has_ai_summary': True,
                'summary': analysis.get('summary', ''),
                'key_requirements': key_requirements,
                'complexity': analysis.get('estimated_complexity', 'unknown'),
                'analyzed_at': latest_request.created_at
            })

        except Exception as e:
            logger.error(f"Failed to get requirements summary: {e}")
            return Response(
                {'error': 'Failed to retrieve requirements summary'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=False, methods=['get'], url_path='ai-recommendations')
    def ai_recommendations(self, request):
        """
        Get AI-powered project recommendations for the current user.

        GET /api/v1/projects/ai-recommendations/

        Suggests projects that match user's skills and interests.
        """
        # This would require user profile with skills
        # For now, return projects with high match scores

        user = request.user

        # Get user's projects to understand preferences
        user_projects = Project.objects.filter(created_by=user)

        # Get open projects excluding user's own
        open_projects = (
            Project.objects
            .filter(status='open')
            .exclude(created_by=user)
            .select_related('category')
            .prefetch_related('skills')
            .order_by('-created_at')[:20]
        )

        # TODO: Use AI to rank these based on user profile
        # For now, return simple list

        from apps.projects.serializers import ProjectSerializer
        serializer = ProjectSerializer(open_projects, many=True)

        return Response({
            'recommendations': serializer.data,
            'count': len(serializer.data),
            'note': 'AI-powered ranking coming soon'
        })

# ------------------------
# Project Requirements
# ------------------------
class ProjectRequirementViewSet(viewsets.ModelViewSet):
    queryset = ProjectRequirement.objects.all()
    serializer_class = ProjectRequirementSerializer
    filterset_fields = ["project"]
    ordering_fields = ["id", "project"]