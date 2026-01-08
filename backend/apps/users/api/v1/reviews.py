"""
Review API Views
Endpoints for creating, listing, and managing reviews
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Avg, Count, Q
from drf_spectacular.utils import extend_schema, OpenApiParameter

from apps.users.models import Review, ReviewResponse
from apps.users.serializers import (
    ReviewSerializer,
    ReviewResponseSerializer,
    ReviewSummarySerializer
)
from apps.ai_engine.services.review_analyzer import AIReviewAnalyzer


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Review management
    
    list: Get all reviews (public only by default)
    retrieve: Get a specific review
    create: Create a new review (requires authentication)
    update: Update own review
    destroy: Delete own review
    """
    queryset = Review.objects.select_related(
        'reviewer', 'reviewer__profile',
        'reviewee', 'reviewee__profile',
        'project', 'booking'
    ).prefetch_related('response')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Filter reviews based on query parameters"""
        queryset = super().get_queryset()
        
        # Only show public reviews to non-owners
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            user_id = self.request.user.id if self.request.user.is_authenticated else None
            queryset = queryset.filter(
                Q(is_public=True) |
                Q(reviewer_id=user_id) |
                Q(reviewee_id=user_id)
            )
        
        # Filter by reviewee
        reviewee_id = self.request.query_params.get('reviewee')
        if reviewee_id:
            queryset = queryset.filter(reviewee_id=reviewee_id)
        
        # Filter by reviewer
        reviewer_id = self.request.query_params.get('reviewer')
        if reviewer_id:
            queryset = queryset.filter(reviewer_id=reviewer_id)
        
        # Filter by project
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by booking
        booking_id = self.request.query_params.get('booking')
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        """Set reviewer and run AI analysis on review creation"""
        # Get review data
        rating = serializer.validated_data['rating']
        comment = serializer.validated_data['comment']
        
        # Run AI sentiment analysis
        analyzer = AIReviewAnalyzer()
        analysis = analyzer.analyze_review(comment, rating)
        
        # Save review with AI analysis results
        serializer.save(
            reviewer=self.request.user,
            ai_sentiment=analysis['sentiment_score'],
            ai_sentiment_label=analysis['sentiment_label'],
            is_flagged=analysis['is_flagged']
        )
    
    @extend_schema(
        summary="Get review summary for a user",
        parameters=[
            OpenApiParameter(
                name='user_id',
                description='ID of the user to get review summary for',
                required=True,
                type=int
            )
        ],
        responses={200: ReviewSummarySerializer}
    )
    @action(detail=False, methods=['get'], url_path='summary')
    def get_summary(self, request):
        """Get aggregated review statistics for a user"""
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate statistics
        average_rating = Review.get_user_average_rating(user_id)
        total_reviews = Review.get_user_review_count(user_id)
        rating_distribution = Review.get_rating_distribution(user_id)
        
        # Get recent reviews
        recent_reviews = Review.objects.filter(
            reviewee_id=user_id,
            is_public=True
        ).select_related(
            'reviewer', 'reviewer__profile'
        ).prefetch_related('response')[:5]
        
        data = {
            'average_rating': round(average_rating, 2),
            'total_reviews': total_reviews,
            'rating_distribution': rating_distribution,
            'recent_reviews': ReviewSerializer(recent_reviews, many=True).data
        }
        
        serializer = ReviewSummarySerializer(data)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Respond to a review",
        request=ReviewResponseSerializer,
        responses={201: ReviewResponseSerializer}
    )
    @action(detail=True, methods=['post'], url_path='respond')
    def respond(self, request, pk=None):
        """Allow reviewee to respond to a review"""
        review = self.get_object()
        
        # Only reviewee can respond
        if review.reviewee != request.user:
            return Response(
                {'error': 'Only the reviewee can respond to this review'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if response already exists
        if hasattr(review, 'response'):
            return Response(
                {'error': 'Review already has a response'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ReviewResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            review=review,
            responder=request.user
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @extend_schema(
        summary="Get AI-suggested response to a review",
        responses={200: {'type': 'object', 'properties': {'suggested_response': {'type': 'string'}}}}
    )
    @action(detail=True, methods=['get'], url_path='suggest-response')
    def suggest_response(self, request, pk=None):
        """Generate AI-suggested response to a review"""
        review = self.get_object()
        
        # Only reviewee can get suggestion
        if review.reviewee != request.user:
            return Response(
                {'error': 'Only the reviewee can get response suggestions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        analyzer = AIReviewAnalyzer()
        suggestion = analyzer.suggest_response(review.comment, review.rating)
        
        return Response({'suggested_response': suggestion})
    
    @extend_schema(
        summary="Flag a review for moderation"
    )
    @action(detail=True, methods=['post'], url_path='flag')
    def flag(self, request, pk=None):
        """Flag a review for moderation"""
        review = self.get_object()
        review.is_flagged = True
        review.save(update_fields=['is_flagged'])
        
        return Response({'status': 'Review flagged for moderation'})
