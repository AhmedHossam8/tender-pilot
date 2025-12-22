from common.viewsets import BaseModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Proposal
from .serializers import ProposalSerializer

class ProposalViewSet(BaseModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    filterset_fields = ["tender", "status"]
    ordering_fields = ["created_at"]

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        # logic to mark proposal as submitted
        return Response({"status": "Proposal submitted"})

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        # logic to approve proposal
        return Response({"status": "Proposal approved"})
