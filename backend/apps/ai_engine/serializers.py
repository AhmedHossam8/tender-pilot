from rest_framework import serializers

class AIExecuteSerializer(serializers.Serializer):
    task = serializers.ChoiceField(choices=[
        "tender_analysis",
        "compliance_check",
        "proposal_outline",
    ])
    entity_type = serializers.ChoiceField(choices=[
        "tender",
        "document",
        "proposal",
    ])
    entity_id = serializers.UUIDField()
    regenerate = serializers.BooleanField(default=False)
    params = serializers.JSONField(required=False)

class AIResultSerializer(serializers.Serializer):
    task = serializers.CharField()
    entity_id = serializers.UUIDField()
    result = serializers.JSONField()
