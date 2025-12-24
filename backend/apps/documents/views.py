from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from common.viewsets import BaseModelViewSet
from .models import TenderDocument
from .serializers import TenderDocumentSerializer, DocumentUploadSerializer
from apps.tenders.models import Tender
from .permissions import DocumentPermission
from datetime import datetime

class TenderDocumentViewSet(BaseModelViewSet):
    queryset = TenderDocument.objects.filter(is_active=True)
    serializer_class = TenderDocumentSerializer
    filterset_fields = ["tender"]
    ordering_fields = ["created_at"]
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [DocumentPermission]

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=["post"])
    def upload(self, request):
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            tender = Tender.objects.get(id=serializer.validated_data["tender_id"])
        except Tender.DoesNotExist:
            return Response({"error": "Tender not found"}, status=status.HTTP_404_NOT_FOUND)

        file = serializer.validated_data["file"]

        # Validate file
        max_size = 10 * 1024 * 1024
        allowed_types = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]

        if file.size > max_size:
            return Response({"error": "File too large (max 10MB)"}, status=status.HTTP_400_BAD_REQUEST)
        if file.content_type not in allowed_types:
            return Response({"error": f"Unsupported file type: {file.content_type}"}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent duplicate filenames for the same tender
        if TenderDocument.objects.filter(tender=tender, file__icontains=file.name, is_active=True).exists():
            return Response({"error": "File with this name already exists for this tender"}, status=status.HTTP_400_BAD_REQUEST)

        # Create document
        doc = TenderDocument.objects.create(tender=tender, file=file)

        # AI preprocessing placeholder
        self.process_document(doc.id)

        return Response({
            "id": doc.id,
            "file_url": doc.file.url,
            "status": "uploaded"
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="nested")
    def list_by_tender(self, request, pk=None):
        try:
            tender = Tender.objects.get(id=pk)
        except Tender.DoesNotExist:
            return Response({"error": "Tender not found"}, status=status.HTTP_404_NOT_FOUND)

        documents = TenderDocument.objects.filter(tender=tender, is_active=True)
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)

    def process_document(self, doc_id):
        """
        Placeholder for AI preprocessing.
        Actual AI handled in ai_engine app.
        """
        doc = TenderDocument.objects.get(id=doc_id)
        doc.extracted_text = f"Dummy extracted text for {doc.file.name}"
        doc.ai_summary = f"Dummy summary for {doc.file.name}"
        doc.ai_processed = True
        doc.ai_processed_at = datetime.now()
        doc.save()
