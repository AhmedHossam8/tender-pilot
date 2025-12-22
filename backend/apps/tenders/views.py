
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Tender
from .serializers import TenderSerializer


class TenderViewSet(viewsets.ModelViewSet):
    """
    Tender CRUD API
    """
    serializer_class = TenderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only active tenders
        return Tender.objects.filter(is_active=True)

    def perform_destroy(self, instance):
        """
        Soft delete instead of DB delete
        """
        instance.is_active = False
        instance.save()
