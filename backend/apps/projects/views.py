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
from .permissions import IsProjectOwnerOrReadOnly


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

# ------------------------
# Project Requirements
# ------------------------
class ProjectRequirementViewSet(viewsets.ModelViewSet):
    queryset = ProjectRequirement.objects.all()
    serializer_class = ProjectRequirementSerializer
    filterset_fields = ["project"]
    ordering_fields = ["id", "project"]