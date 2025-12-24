from rest_framework import serializers
from .models import Tender, TenderRequirement


class TenderSerializer(serializers.ModelSerializer):
    documents_count = serializers.IntegerField(
        source="documents.count",
        read_only=True
    )
    requirements_count = serializers.IntegerField(
        source="requirements.count",
        read_only=True
    )

    class Meta:
        model = Tender
        fields = [
            "id",
            "title",
            "issuing_entity",
            "deadline",
            "status",
            "documents_count",
            "requirements_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at", "created_by")

    def validate_status(self, value):
        instance = self.instance
        if not instance:
            return value

        if instance.status == "closed" and value != "closed":
            raise serializers.ValidationError("Closed tenders cannot be modified.")

        if instance.status == "draft" and value not in ["draft", "open"]:
            raise serializers.ValidationError("Invalid status transition.")

        if instance.status == "open" and value not in ["open", "closed"]:
            raise serializers.ValidationError("Invalid status transition.")

        return value

class TenderRequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderRequirement
        fields = [
            "id",
            "tender",
            "title",
            "description",
            "is_mandatory",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("id", "created_at", "updated_at")