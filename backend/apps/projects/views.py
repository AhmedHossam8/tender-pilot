from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from common.viewsets import BaseModelViewSet
from .models import Project, ProjectRequirement
from apps.documents.models import ProjectDocument
from .serializers import ProjectSerializer, ProjectRequirementSerializer
from apps.documents.serializers import ProjectDocumentSerializer
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django_filters import rest_framework as filters
from .permissions import IsProjectOwnerOrReadOnly
from apps.core.models import Category, Skill
from apps.core.serializers import CategorySerializer, SkillSerializer

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
        queryset=Project.skills.related_model.objects.all(),
        conjoined=False,
    )

    class Meta:
        model = Project
        fields = ["status", "category", "budget_min", "budget_max", "skills"]

# ------------------------
# Project ViewSet
# ------------------------
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().select_related('created_by').prefetch_related('skills', 'requirements', 'attachments')
    serializer_class = ProjectSerializer
    filterset_class = ProjectFilter
    ordering_fields = ["created_at", "budget"]
    search_fields = ["title", "description"]
    permission_classes = [IsProjectOwnerOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset().exclude(status="deleted")

        # Full-text search
        search_query = self.request.query_params.get("search")
        if search_query:
            vector = SearchVector("title", weight="A") + SearchVector("description", weight="B")
            query = SearchQuery(search_query)
            queryset = queryset.annotate(rank=SearchRank(vector, query)).filter(rank__gte=0.1).order_by("-rank")

        # Optional tag filter (if you use tags)
        tag_name = self.request.query_params.get("tag")
        if tag_name and hasattr(Project, 'tags'):
            queryset = queryset.filter(tags__tag__name__iexact=tag_name).distinct()

        return queryset.distinct()

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.status == "closed":
            raise serializers.ValidationError("Closed projects cannot be modified.")
        serializer.save()

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
        if not ProjectDocument.objects.filter(project=project, ai_processed=True).exists():
            return Response({"error": "No AI-processed documents available"}, status=400)
        return Response({"status": "READY_FOR_AI", "project_id": project.id})

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

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    ordering_fields = ["name"]

class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    ordering_fields = ["name"]
    