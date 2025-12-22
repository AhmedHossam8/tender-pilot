from common.serializers import BaseModelSerializer
from .models import Document

class DocumentSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = Document
        fields = "__all__"

class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    tender_id = serializers.UUIDField()
