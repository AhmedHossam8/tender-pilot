from common.serializers import BaseModelSerializer
from .models import Tender, TenderDocument, TenderRequirement
from rest_framework import serializers


class TenderSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = Tender
        fields = "__all__"

class TenderUserAssignSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenderUser
        fields = ("id", "user", "role")


class TenderDocumentSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = TenderDocument
        fields = "__all__"


class TenderRequirementSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = TenderRequirement
        fields = "__all__"
