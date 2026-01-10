from rest_framework import serializers
from .models import Bid, BidMilestone, BidAttachment, BidAuditLog, BidStatus
from django.contrib.auth import get_user_model

User = get_user_model()


class BidMilestoneSerializer(serializers.ModelSerializer):
    """Serializer for bid milestones"""
    
    class Meta:
        model = BidMilestone
        fields = [
            'id',
            'order',
            'title',
            'description',
            'duration_days',
            'amount',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class BidAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for bid attachments"""
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BidAttachment
        fields = [
            'id',
            'file',
            'file_url',
            'file_name',
            'file_type',
            'description',
            'file_size',
            'created_at',
        ]
        read_only_fields = ['id', 'file_url', 'created_at']
    
    def get_file_url(self, obj):
        """Get the full URL for the file"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class BidAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for bid audit logs"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = BidAuditLog
        fields = [
            'id',
            'action',
            'action_display',
            'user',
            'user_name',
            'timestamp',
            'extra_info',
        ]
        read_only_fields = ['id', 'user_name', 'action_display', 'timestamp']


class ServiceProviderBasicSerializer(serializers.ModelSerializer):
    """Basic user info for service provider in bid listings"""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name']
        read_only_fields = fields


class BidListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for bid listings"""
    service_provider_name = serializers.SerializerMethodField()
    project_title = serializers.CharField(source='project.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Bid
        fields = [
            'id',
            'project',
            'project_title',
            'service_provider',
            'service_provider_name',
            'proposed_amount',
            'proposed_timeline',
            'status',
            'status_display',
            'ai_score',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'project_title',
            'service_provider',
            'service_provider_name',
            'status_display',
            'ai_score',
            'created_at',
            'updated_at',
        ]
    
    def get_service_provider_name(self, obj):
        """Get the service provider's full name"""
        if obj.service_provider:
            return obj.service_provider.full_name or obj.service_provider.email
        return "Unknown"


class BidDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual bid view"""
    service_provider = ServiceProviderBasicSerializer(read_only=True)
    milestone_details = BidMilestoneSerializer(many=True, read_only=True)
    attachments = BidAttachmentSerializer(many=True, read_only=True)
    audit_logs = BidAuditLogSerializer(many=True, read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Bid
        fields = [
            'id',
            'project',
            'project_title',
            'service_provider',
            'cover_letter',
            'proposed_amount',
            'proposed_timeline',
            'status',
            'status_display',
            'ai_score',
            'ai_feedback',
            'milestones',
            'milestone_details',
            'attachments',
            'audit_logs',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'project_title',
            'service_provider',
            'status_display',
            'ai_score',
            'ai_feedback',
            'milestone_details',
            'attachments',
            'audit_logs',
            'created_at',
            'updated_at',
        ]


class BidCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new bids"""
    milestone_details = BidMilestoneSerializer(many=True, required=False)
    
    class Meta:
        model = Bid
        fields = [
            'project',
            'cover_letter',
            'proposed_amount',
            'proposed_timeline',
            'milestones',
            'milestone_details',
        ]
    
    def validate_proposed_amount(self, value):
        """Validate that proposed amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Proposed amount must be greater than 0")
        return value
    
    def validate_proposed_timeline(self, value):
        """Validate that proposed timeline is positive"""
        if value <= 0:
            raise serializers.ValidationError("Proposed timeline must be at least 1 day")
        return value
    
    def validate(self, data):
        """Validate that the provider hasn't already submitted a bid for this project"""
        request = self.context.get('request')
        if request and request.user:
            project = data.get('project')
            # Check if user already has a bid for this project
            existing_bid = Bid.objects.filter(
                project=project,
                service_provider=request.user
            ).exists()
            
            if existing_bid:
                raise serializers.ValidationError(
                    "You have already submitted a bid for this project."
                )
        
        return data
    
    def create(self, validated_data):
        """Create bid with milestones"""
        milestone_data = validated_data.pop('milestone_details', [])
        
        # Set service_provider from request user
        request = self.context.get('request')
        if request and request.user:
            validated_data['service_provider'] = request.user
        
        # Create the bid
        bid = Bid.objects.create(**validated_data)
        
        # Create milestones if provided
        for milestone in milestone_data:
            BidMilestone.objects.create(bid=bid, **milestone)
        
        # Create audit log
        if request and request.user:
            BidAuditLog.objects.create(
                bid=bid,
                user=request.user,
                action='submit',
                extra_info='Bid submitted'
            )
        
        return bid


class BidUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating bids (limited fields)"""
    
    class Meta:
        model = Bid
        fields = [
            'cover_letter',
            'proposed_amount',
            'proposed_timeline',
            'milestones',
        ]
    
    def validate(self, data):
        """Validate that bid can be updated (only if in PENDING status)"""
        bid = self.instance
        if bid and bid.status != 'pending':
            raise serializers.ValidationError(
                "Can only update bids in pending status"
            )
        return data


class BidStatusChangeSerializer(serializers.Serializer):
    """Serializer for changing bid status"""
    status = serializers.ChoiceField(choices=BidStatus.choices)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate_status(self, value):
        """Validate that status transition is allowed"""
        bid = self.context.get('bid')
        if bid:
            allowed = bid.STATUS_TRANSITIONS.get(bid.status, [])
            if value not in allowed:
                raise serializers.ValidationError(
                    f"Cannot change status from {bid.status} to {value}. "
                    f"Allowed transitions: {allowed}"
                )
        return value
