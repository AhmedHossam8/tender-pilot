from rest_framework import serializers
from .models import TenderDocument

class TenderDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderDocument
        fields = "__all__"
        read_only_fields = ("id", "ai_processed", "ai_processed_at", "created_at", "updated_at")

class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    tender_id = serializers.UUIDField()
