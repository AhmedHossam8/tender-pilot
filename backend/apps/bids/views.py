from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from .models import Bid, BidMilestone, BidAttachment
from .serializers import (
    BidListSerializer,
    BidDetailSerializer,
    BidCreateSerializer,
    BidUpdateSerializer,
    BidStatusChangeSerializer,
    BidMilestoneSerializer,
    BidAttachmentSerializer,
)


class BidViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bids in the ServiceHub marketplace.
    
    Provides endpoints for:
    - Listing bids (sent by provider or received by client)
    - Creating new bids
    - Retrieving bid details
    - Updating bids (only in pending status)
    - Changing bid status (shortlist, accept, reject, withdraw)
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter bids based on user role:
        - Service providers see their submitted bids
        - Clients see bids on their projects
        """
        user = self.request.user
        
        # Get filter parameters
        filter_type = self.request.query_params.get('type', 'all')
        status_filter = self.request.query_params.get('status')
        project_id = self.request.query_params.get('project')
        
        # Base queryset
        queryset = Bid.objects.select_related(
            'project',
            'service_provider'
        ).prefetch_related(
            'milestone_details',
            'attachments',
            'audit_logs'
        )
        
        # Apply role-based filtering
        if filter_type == 'sent':
            # Bids submitted by this user (as service provider)
            queryset = queryset.filter(service_provider=user)
        elif filter_type == 'received':
            # Bids on projects created by this user (as client)
            queryset = queryset.filter(project__created_by=user)
        else:
            # All bids user has access to
            queryset = queryset.filter(
                Q(service_provider=user) | Q(project__created_by=user)
            )
        
        # Apply additional filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return BidListSerializer
        elif self.action == 'create':
            return BidCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return BidUpdateSerializer
        else:
            return BidDetailSerializer
    
    def perform_create(self, serializer):
        """Create a new bid"""
        serializer.save()
    
    def perform_update(self, serializer):
        """Update an existing bid"""
        serializer.save()
    
    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        """
        Change the status of a bid.
        
        Expected payload:
        {
            "status": "shortlisted" | "accepted" | "rejected" | "withdrawn",
            "reason": "Optional reason for the status change"
        }
        """
        bid = self.get_object()
        serializer = BidStatusChangeSerializer(
            data=request.data,
            context={'bid': bid}
        )
        
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            reason = serializer.validated_data.get('reason', '')
            
            try:
                old_status, new_status = bid.change_status(
                    new_status=new_status,
                    user=request.user,
                    action=new_status,
                    extra_info=reason
                )
                
                # Return updated bid
                response_serializer = BidDetailSerializer(bid)
                return Response({
                    'message': f'Bid status changed from {old_status} to {new_status}',
                    'bid': response_serializer.data
                })
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """Withdraw a bid (service provider only)"""
        bid = self.get_object()
        
        # Check if user is the service provider
        if bid.service_provider != request.user:
            return Response(
                {'error': 'Only the service provider can withdraw their bid'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            bid.change_status(
                new_status='withdrawn',
                user=request.user,
                action='withdraw',
                extra_info=request.data.get('reason', '')
            )
            
            response_serializer = BidDetailSerializer(bid)
            return Response({
                'message': 'Bid withdrawn successfully',
                'bid': response_serializer.data
            })
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get statistics for a specific bid"""
        bid = self.get_object()
        
        stats = {
            'total_milestones': bid.milestone_details.count(),
            'total_attachments': bid.attachments.count(),
            'audit_log_count': bid.audit_logs.count(),
            'days_since_submission': (
                (timezone.now() - bid.created_at).days
                if bid.created_at
                else 0
            ),
        }
        
        return Response(stats)


class BidMilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for managing bid milestones"""
    serializer_class = BidMilestoneSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only show milestones for bids the user has access to"""
        user = self.request.user
        return BidMilestone.objects.filter(
            Q(bid__service_provider=user) | Q(bid__project__created_by=user)
        ).select_related('bid')


class BidAttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing bid attachments"""
    serializer_class = BidAttachmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only show attachments for bids the user has access to"""
        user = self.request.user
        return BidAttachment.objects.filter(
            Q(bid__service_provider=user) | Q(bid__project__created_by=user)
        ).select_related('bid')
    
    def perform_create(self, serializer):
        """Create attachment and log the action"""
        attachment = serializer.save()
        
        # Create audit log
        from .models import BidAuditLog
        BidAuditLog.objects.create(
            bid=attachment.bid,
            user=self.request.user,
            action='add_attachment',
            extra_info=f'Added attachment: {attachment.file_name}'
        )
