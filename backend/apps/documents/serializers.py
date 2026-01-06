from rest_framework import serializers
from .models import ProjectDocument

class ProjectDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectDocument
        fields = "__all__"
        read_only_fields = ("id", "ai_processed", "ai_processed_at", "created_at", "updated_at", "created_by")

class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    project_id = serializers.IntegerField()
