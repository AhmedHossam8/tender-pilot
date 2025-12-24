from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from common.viewsets import BaseModelViewSet
from .models import TenderDocument
from .serializers import TenderDocumentSerializer, DocumentUploadSerializer
from apps.tenders.models import Tender
from .permissions import DocumentPermission
from django.utils import timezone
import json
import logging

logger = logging.getLogger(__name__)

class TenderDocumentViewSet(BaseModelViewSet):
    queryset = TenderDocument.objects.filter(is_active=True)
    serializer_class = TenderDocumentSerializer
    filterset_fields = ["tender"]
    ordering_fields = ["created_at"]
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [DocumentPermission]

    def perform_destroy(self, instance):
        """Soft delete the document"""
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=["post"])
    def upload(self, request):
        """Upload a tender document and trigger AI preprocessing"""
        ai_result = None
        try:
            serializer = DocumentUploadSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # Get the tender
            tender_id = serializer.validated_data.get("tender_id")
            try:
                tender = Tender.objects.get(id=tender_id)
            except Tender.DoesNotExist:
                return Response({"error": "Tender not found"}, status=status.HTTP_404_NOT_FOUND)

            file = serializer.validated_data.get("file")

            # Validate file size and type
            max_size = 10 * 1024 * 1024  # 10MB
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

            # Determine document type
            if file.content_type == "application/pdf":
                doc_type = "pdf"
            elif file.content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
                doc_type = "word"
            elif file.content_type in ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]:
                doc_type = "excel"
            else:
                doc_type = "other"

            # Create the document record
            doc = TenderDocument.objects.create(
                tender=tender,
                file=file,
                document_type=doc_type
            )

            # Extract text
            doc.extracted_text = doc.extract_text()
            doc.save()

            # AI preprocessing
            try:
                from apps.ai_engine.handlers import AIRequestHandler
                ai_handler = AIRequestHandler()
                ai_result = ai_handler.execute({
                    "task": "tender-preprocessing",
                    "document_id": doc.id
                })

            except Exception as e:
                logger.error(f"AI preprocessing failed for document {doc.id}: {str(e)}", exc_info=True)
                from apps.ai_engine.services.fallback import GracefulDegradation
                ai_result = GracefulDegradation.get_degraded_response("tender_analysis")

            # Save AI results persistently - store as JSON in ai_summary field
            doc.ai_summary = json.dumps(ai_result)
            doc.ai_processed = True
            doc.ai_processed_at = timezone.now()
            doc.save()

            return Response({
                "id": doc.id,
                "file_url": doc.file.url,
                "status": "uploaded",
                "ai_result": ai_result
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=["get"], url_path="nested")
    def list_by_tender(self, request, pk=None):
        """List all documents for a specific tender"""
        try:
            tender = Tender.objects.get(id=pk)
        except Tender.DoesNotExist:
            return Response({"error": "Tender not found"}, status=status.HTTP_404_NOT_FOUND)

        documents = TenderDocument.objects.filter(tender=tender, is_active=True)
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="ai-result")
    def get_ai_result(self, request, pk=None):
        """Retrieve stored AI analysis for a document"""
        try:
            doc = TenderDocument.objects.get(id=pk, is_active=True)
        except TenderDocument.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            ai_data = json.loads(doc.ai_summary or "{}")
        except json.JSONDecodeError:
            ai_data = {}

        # Extract summary, requirements, and recommended actions safely
        summary = ""
        key_requirements = []
        recommended_actions = []

        if isinstance(ai_data, dict):
            # Check if it's combined result structure
            if "summary" in ai_data:
                summary = ai_data["summary"].get("summary", "") if isinstance(ai_data["summary"], dict) else str(ai_data["summary"])
            if "requirements" in ai_data:
                key_requirements = ai_data["requirements"].get("requirements", []) if isinstance(ai_data["requirements"], dict) else []
            if "analysis" in ai_data:
                recommended_actions = ai_data["analysis"].get("recommended_actions", []) if isinstance(ai_data["analysis"], dict) else []

        return Response({
            "summary": summary,
            "key_requirements": key_requirements,
            "recommended_actions": recommended_actions
        })
