from rest_framework import viewsets, status, views
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
from .services.comparison_service import BidComparisonService


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
        
        When a bid is accepted, all other bids for the same project are automatically rejected.
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
                
                # If accepting a bid, automatically reject all other bids for this project
                if new_status == 'accepted':
                    other_bids = Bid.objects.filter(
                        project=bid.project
                    ).exclude(id=bid.id).exclude(status__in=['rejected', 'withdrawn'])
                    
                    for other_bid in other_bids:
                        try:
                            other_bid.change_status(
                                new_status='rejected',
                                user=request.user,
                                action='auto_reject',
                                extra_info='Automatically rejected because another bid was accepted'
                            )
                        except ValueError:
                            # Skip if transition not allowed
                            pass
                
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


class BidComparisonView(views.APIView):
    """
    API view for comparing multiple bids.
    
    POST /api/v1/bids/compare/
    Body: { "bid_ids": [1, 2, 3] }
    
    Returns comparison data with AI insights and recommendations.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        bid_ids = request.data.get('bid_ids', [])
        
        if not bid_ids or not isinstance(bid_ids, list):
            return Response(
                {"error": "bid_ids must be a non-empty list"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(bid_ids) < 2:
            return Response(
                {"error": "At least 2 bids are required for comparison"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(bid_ids) > 10:
            return Response(
                {"error": "Maximum 10 bids can be compared at once"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify user has access to these bids
        user_bids = Bid.objects.filter(
            id__in=bid_ids,
            project__created_by=request.user
        ).values_list('id', flat=True)
        
        if len(user_bids) != len(bid_ids):
            return Response(
                {"error": "You don't have access to one or more of these bids"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Perform comparison
        comparison_result = BidComparisonService.compare_bids(bid_ids)
        
        return Response(comparison_result, status=status.HTTP_200_OK)


class ProjectBidsInsightsView(views.APIView):
    """
    Get insights for all bids on a project.
    
    GET /api/v1/projects/{project_id}/bids/insights/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        # Verify user owns the project
        from apps.projects.models import Project
        try:
            project = Project.objects.get(id=project_id, created_by=request.user)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        insights = BidComparisonService.get_bid_comparison_insights(project_id)
        
        return Response(insights, status=status.HTTP_200_OK)
