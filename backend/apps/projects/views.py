from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from common.viewsets import BaseModelViewSet
from .models import Project, ProjectRequirement
from apps.documents.models import ProjectDocument
from .serializers import ProjectSerializer, ProjectRequirementSerializer
from apps.documents.serializers import ProjectDocumentSerializer
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django_filters import rest_framework as filters

# ------------------------
# Filters
# ------------------------
class ProjectFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="iexact")
    deadline_before = filters.DateTimeFilter(field_name="deadline", lookup_expr="lte")
    deadline_after = filters.DateTimeFilter(field_name="deadline", lookup_expr="gte")

    class Meta:
        model = Project
        fields = ["status", "deadline_before", "deadline_after"]

# ------------------------
# Project ViewSet
# ------------------------
class ProjectViewSet(BaseModelViewSet):
    """
    Project CRUD + AI readiness
    """
    queryset = Project.objects.all().select_related('created_by').prefetch_related('skills', 'requirements', 'attachments')
    serializer_class = ProjectSerializer
    filterset_class = ProjectFilter
    ordering_fields = ["created_at", "deadline"]
    search_fields = ['title', 'description']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Full-text search
        search_query = self.request.query_params.get("search")
        if search_query:
            vector = SearchVector("title", weight="A") + SearchVector("description", weight="B")
            query = SearchQuery(search_query)
            queryset = queryset.annotate(rank=SearchRank(vector, query)).filter(rank__gte=0.1).order_by("-rank")

        # Tag filter (if you have a tag system)
        tag_name = self.request.query_params.get("tag")
        if tag_name:
            queryset = queryset.filter(tags__tag__name__iexact=tag_name).distinct()

        return queryset.distinct()

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status == "closed":
            raise serializers.ValidationError("Closed projects cannot be modified.")
        serializer.save()

    def perform_destroy(self, instance):
        """
        Soft delete
        """
        instance.status = "deleted"
        instance.save()

    @action(detail=True, methods=["post"])
    def analyze(self, request, pk=None):
        """
        AI analysis readiness endpoint
        """
        project = self.get_object()
        if project.status != "open":
            return Response({"error": "Project must be open for analysis"}, status=400)

        if not ProjectDocument.objects.filter(project=project, ai_processed=True).exists():
            return Response({"error": "No AI-processed documents available"}, status=400)

        return Response({"status": "READY_FOR_AI", "project_id": project.id})

    @action(detail=True, methods=["post"])
    def bulk_requirements(self, request, pk=None):
        """
        Bulk create project requirements
        """
        project = self.get_object()
        serializer = ProjectRequirementSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
        return Response(serializer.data)

# ------------------------
# Project Documents
# ------------------------
class ProjectDocumentViewSet(BaseModelViewSet):
    queryset = ProjectDocument.objects.all()
    serializer_class = ProjectDocumentSerializer
    filterset_fields = ["project"]
    ordering_fields = ["created_at"]

# ------------------------
# Project Requirements
# ------------------------
class ProjectRequirementViewSet(BaseModelViewSet):
    queryset = ProjectRequirement.objects.all()
    serializer_class = ProjectRequirementSerializer
    filterset_fields = ["project"]
    ordering_fields = ["id", "project"]
