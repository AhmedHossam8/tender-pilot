from common.viewsets import BaseModelViewSet, BaseReadOnlyViewSet
from .models import Document
from .serializers import DocumentSerializer

class DocumentViewSet(BaseModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    filterset_fields = ["tender"]
    ordering_fields = ["created_at"]

class DocumentReadOnlyViewSet(BaseReadOnlyViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer