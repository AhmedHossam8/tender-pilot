"""
AI Bid Optimization API Views

Provides REST API endpoints for bid-related AI operations.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist

from apps.ai_engine.services.bid_optimizer import BidOptimizerService
from apps.ai_engine.services.smart_recommendations import SmartRecommendationsService
from apps.bids.models import Bid
from apps.projects.models import Project

logger = logging.getLogger(__name__)


class AnalyzeBidStrengthView(APIView):
    """
    Analyze bid strength and competitiveness.
    
    POST /api/v1/ai/bids/<bid_id>/analyze-strength/
    
    Returns comprehensive bid analysis including:
    - Overall strength score
    - Dimension scores (pricing, timeline, content, competitive)
    - Win probability
    - Detailed suggestions for improvement
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, bid_id):
        try:
            # Get bid
            bid = Bid.objects.select_related('project', 'service_provider').get(id=bid_id)
            
            # Permission check - only bid owner or project owner
            if bid.service_provider != request.user and bid.project.created_by != request.user:
                return Response(
                    {'error': 'You do not have permission to analyze this bid'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Analyze bid strength
            optimizer = BidOptimizerService()
            analysis = optimizer.analyze_bid_strength(bid)
            
            if not analysis:
                return Response(
                    {'error': 'Failed to analyze bid strength'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(analysis, status=status.HTTP_200_OK)
            
        except Bid.DoesNotExist:
            return Response(
                {'error': 'Bid not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error analyzing bid strength: {e}", exc_info=True)
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RealtimeBidSuggestionsView(APIView):
    """
    Get real-time suggestions for bid being created.
    
    POST /api/v1/ai/bids/realtime-suggestions/
    
    Request body:
    {
        "project_id": 123,
        "proposed_amount": 5000,
        "proposed_timeline": 30,
        "cover_letter": "..."
    }
    
    Returns immediate feedback and suggestions.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Validate request data
            project_id = request.data.get('project_id')
            proposed_amount = request.data.get('proposed_amount')
            proposed_timeline = request.data.get('proposed_timeline')
            cover_letter = request.data.get('cover_letter', '')
            
            if not project_id:
                return Response(
                    {'error': 'project_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get project
            project = Project.objects.get(id=project_id)
            
            # Create temporary bid data
            bid_data = {
                'proposed_amount': float(proposed_amount) if proposed_amount else 0,
                'proposed_timeline': int(proposed_timeline) if proposed_timeline else 0,
                'cover_letter': cover_letter,
                'service_provider_id': request.user.id
            }
            
            # Get real-time suggestions
            optimizer = BidOptimizerService()
            suggestions = optimizer.get_realtime_suggestions(bid_data, project)
            
            if not suggestions:
                return Response(
                    {'error': 'Failed to generate suggestions'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(suggestions, status=status.HTTP_200_OK)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error generating realtime suggestions: {e}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class OptimizeBidPricingView(APIView):
    """
    Get AI-powered pricing optimization suggestions.
    
    POST /api/v1/ai/bids/<bid_id>/optimize-pricing/
    
    Returns strategic pricing recommendations based on:
    - Market data
    - Project budget
    - Competitor bids
    - Historical win rates
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, bid_id):
        try:
            bid = Bid.objects.select_related('project', 'service_provider').get(id=bid_id)
            
            # Permission check
            if bid.service_provider != request.user:
                return Response(
                    {'error': 'You do not have permission to optimize this bid'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            optimizer = BidOptimizerService()
            pricing_advice = optimizer.optimize_pricing(bid)
            
            if not pricing_advice:
                return Response(
                    {'error': 'Failed to generate pricing optimization'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(pricing_advice, status=status.HTTP_200_OK)
            
        except Bid.DoesNotExist:
            return Response(
                {'error': 'Bid not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error optimizing pricing: {e}", exc_info=True)
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PredictBidSuccessView(APIView):
    """
    Predict probability of bid success.
    
    POST /api/v1/ai/bids/<bid_id>/predict-success/
    
    Returns:
    - Win probability (0-100%)
    - Key factors affecting success
    - Confidence level
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, bid_id):
        try:
            bid = Bid.objects.select_related('project', 'service_provider').get(id=bid_id)
            
            # Permission check
            if bid.service_provider != request.user and bid.project.created_by != request.user:
                return Response(
                    {'error': 'You do not have permission to view this prediction'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            optimizer = BidOptimizerService()
            prediction = optimizer.predict_success_probability(bid)
            
            if not prediction:
                return Response(
                    {'error': 'Failed to generate prediction'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(prediction, status=status.HTTP_200_OK)
            
        except Bid.DoesNotExist:
            return Response(
                {'error': 'Bid not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error predicting success: {e}", exc_info=True)
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PersonalizedRecommendationsView(APIView):
    """
    Get personalized project recommendations for provider.
    
    GET /api/v1/ai/recommendations/for-me/
    
    Query params:
    - limit: Number of recommendations (default: 10)
    - min_score: Minimum match score (default: 60)
    
    Returns projects matching provider's skills and preferences.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            limit = int(request.query_params.get('limit', 10))
            min_score = int(request.query_params.get('min_score', 60))
            
            # Get recommendations
            recommender = SmartRecommendationsService()
            recommendations = recommender.get_recommendations_for_provider(
                provider=request.user,
                limit=limit,
                min_match_score=min_score
            )
            
            return Response({
                'count': len(recommendations),
                'recommendations': recommendations
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to generate recommendations'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TrendingOpportunitiesView(APIView):
    """
    Get trending project opportunities.
    
    GET /api/v1/ai/recommendations/trending/
    
    Returns projects that are:
    - Recently posted
    - High engagement
    - Good match for user's skills
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            limit = int(request.query_params.get('limit', 10))
            
            recommender = SmartRecommendationsService()
            trending = recommender.get_trending_opportunities(
                user=request.user,
                limit=limit
            )
            
            return Response({
                'count': len(trending),
                'opportunities': trending
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting trending opportunities: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to get trending opportunities'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ClientProjectOptimizationView(APIView):
    """
    Get optimization suggestions for project owners.
    
    GET /api/v1/ai/recommendations/optimize-project/<project_id>/
    
    Returns suggestions on how to improve project to attract better bids.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            
            # Permission check - only project owner
            if project.created_by != request.user:
                return Response(
                    {'error': 'You do not have permission to optimize this project'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            recommender = SmartRecommendationsService()
            # Use the optimize_project_for_engagement method
            optimization = recommender.optimize_project_for_engagement(project)
            
            if not optimization:
                return Response(
                    {'error': 'Failed to generate optimization suggestions'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(optimization, status=status.HTTP_200_OK)
            
        except Project.DoesNotExist:
            return Response(
                {'error': 'Project not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error getting project optimization: {e}", exc_info=True)
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
