from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from common.viewsets import BaseModelViewSet
from .models import Tender, TenderRequirement
from apps.documents.models import TenderDocument
from .serializers import TenderSerializer, TenderRequirementSerializer
from apps.documents.serializers import TenderDocumentSerializer
from django.db.models import Q
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django_filters import rest_framework as filters

class TenderFilter(filters.FilterSet):
    status = filters.CharFilter(field_name="status", lookup_expr="iexact")
    deadline_before = filters.DateTimeFilter(field_name="deadline", lookup_expr="lte")
    deadline_after = filters.DateTimeFilter(field_name="deadline", lookup_expr="gte")

    class Meta:
        model = Tender
        fields = ["status", "deadline_before", "deadline_after"]

class TenderViewSet(BaseModelViewSet):
    """
    Tender CRUD + AI readiness
    """
    queryset = Tender.objects.filter(is_active=True).select_related('created_by').prefetch_related('tags', 'tender_documents_tenders')
    serializer_class = TenderSerializer
    filterset_class = TenderFilter
    ordering_fields = ["created_at", "deadline"]
    search_fields = ['title', 'issuing_entity', 'tender_documents_tenders__extracted_text']
    
    def get_queryset(self):
        queryset = super().get_queryset()

        # Full-text search
        search_query = self.request.query_params.get("search")
        if search_query:
            vector = (
                SearchVector("title", weight="A")
                + SearchVector("issuing_entity", weight="A")
                + SearchVector("tender_documents_tenders__extracted_text", weight="B")
            )
            query = SearchQuery(search_query)
            queryset = (
                queryset
                .annotate(rank=SearchRank(vector, query))
                .filter(rank__gte=0.1)
                .order_by("-rank")
            )

        # Tag filter
        tag_name = self.request.query_params.get("tag")
        if tag_name:
            queryset = queryset.filter(
                tags__tag__name__iexact=tag_name
            ).distinct()
    
        return queryset.distinct()


    def perform_update(self, serializer):
        """
        Enforce tender lifecycle
        """
        instance = self.get_object()
        if instance.status == "closed":
            raise serializers.ValidationError("Closed tenders cannot be modified.")
        serializer.save()

    def perform_destroy(self, instance):
        """
        Soft delete
        """
        instance.is_active = False
        instance.save()

    @action(detail=True, methods=["post"])
    def analyze(self, request, pk=None):
        """
        AI analysis readiness endpoint
        """
        tender = self.get_object()

        if tender.status != "open":
            return Response(
                {"error": "Tender must be open for analysis"},
                status=400
            )

        if not TenderDocument.objects.filter(tender=tender, ai_processed=True).exists():
            return Response(
                {"error": "No AI-processed documents available"},
                status=400
            )

        return Response({"status": "READY_FOR_AI", "tender_id": tender.id})

    @action(detail=True, methods=["post"])
    def bulk_requirements(self, request, pk=None):
        """
        Bulk create requirements (AI-prepared)
        """
        tender = self.get_object()
        serializer = TenderRequirementSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(tender=tender)
        return Response(serializer.data)


class TenderDocumentViewSet(BaseModelViewSet):
    """
    Document CRUD
    """
    queryset = TenderDocument.objects.all()
    serializer_class = TenderDocumentSerializer
    filterset_fields = ["tender"]
    ordering_fields = ["created_at"]


class TenderRequirementViewSet(BaseModelViewSet):
    """
    Tender requirements CRUD
    """
    queryset = TenderRequirement.objects.all()
    serializer_class = TenderRequirementSerializer
    filterset_fields = ["tender"]
    ordering_fields = ["created_at"]
