from common.serializers import BaseModelSerializer
from .models import Proposal

class ProposalSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = Proposal
        fields = "__all__"

class ProposalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ("tender",)
