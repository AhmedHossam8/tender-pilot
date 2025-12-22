from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.permissions import IsAuthenticated

class BaseModelViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    filterset_fields = []
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class BaseReadOnlyViewSet(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]