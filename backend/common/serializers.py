from rest_framework import serializers

class BaseModelSerializer(serializers.ModelSerializer):
    """
    Base serializer for all models.
    Handles audit fields & common config.
    """

    class Meta:
        abstract = True
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )

    def validate(self, attrs):
        # Global validation hook (extend later if needed)
        return super().validate(attrs)
