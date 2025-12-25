from rest_framework import serializers
from .models import Proposal, ProposalSection, ProposalDocument

class ProposalSectionSerializer(serializers.ModelSerializer):
    proposal_id = serializers.IntegerField(source='proposal.id', read_only=True)
    
    class Meta:
        model = ProposalSection
        fields = [
            'id',
            'proposal_id',
            'name',
            'content',
            'ai_generated',
        ]
        read_only_fields = ['id', 'proposal_id', 'name']

class ProposalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProposalDocument
        fields = ['id', 'file', 'type', 'created_at']

class ProposalSerializer(serializers.ModelSerializer):
    sections = ProposalSectionSerializer(many=True, read_only=True)
    documents = ProposalDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Proposal
        fields = ['id', 'tender', 'created_by', 'title', 'status', 'created_at', 'updated_at', 'sections', 'documents']
