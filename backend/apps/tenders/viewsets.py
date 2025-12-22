from common.viewsets import BaseModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Tender, TenderDocument, TenderRequirement
from .serializers import TenderSerializer, TenderDocumentSerializer, TenderRequirementSerializer

class TenderViewSet(BaseModelViewSet):
    queryset = Tender.objects.all()
    serializer_class = TenderSerializer
    filterset_fields = ["status", "deadline"]
    ordering_fields = ["created_at", "deadline"]

    @action(detail=True, methods=["post"])
    def analyze(self, request, pk=None):
        # placeholder for AI execution
        return Response({"status": "AI analysis triggered"})

class TenderDocumentViewSet(BaseModelViewSet):
    queryset = TenderDocument.objects.all()
    serializer_class = TenderDocumentSerializer
    filterset_fields = ["tender"]
    ordering_fields = ["created_at"]

class TenderRequirementViewSet(BaseModelViewSet):
    queryset = TenderRequirement.objects.all()
    serializer_class = TenderRequirementSerializer
    filterset_fields = ["tender"]
    ordering_fields = ["created_at"]
