"""
AI Analytics API Views

Provides endpoints for accessing AI usage analytics, metrics, and insights.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from ..services.analytics_service import AIAnalyticsService
from ..serializers import (
    AIAnalyticsStatsSerializer,
    MatchAccuracyStatsSerializer,
    AIAnalyticsSummarySerializer,
    FeatureUsageBreakdownSerializer
)


class AIUsageStatsView(APIView):
    """
    Get aggregated AI usage statistics.
    
    Query Parameters:
        - start_date: Start date (ISO format)
        - end_date: End date (ISO format)
        - days: Number of days to include (alternative to date range)
    
    GET /api/v1/ai/analytics/usage/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Parse query parameters
        days = request.query_params.get('days', 30)
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Calculate date range
        end_date = timezone.now()
        if end_date_str:
            try:
                end_date = timezone.datetime.fromisoformat(end_date_str)
            except ValueError:
                pass
        
        start_date = end_date - timedelta(days=int(days))
        if start_date_str:
            try:
                start_date = timezone.datetime.fromisoformat(start_date_str)
            except ValueError:
                pass
        
        # Get stats
        stats = AIAnalyticsService.get_usage_stats(
            start_date=start_date,
            end_date=end_date
        )
        
        serializer = AIAnalyticsStatsSerializer(data=stats)
        serializer.is_valid()
        
        return Response(serializer.data)


class MatchAccuracyView(APIView):
    """
    Get AI match prediction accuracy statistics.
    
    GET /api/v1/ai/analytics/match-accuracy/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        stats = AIAnalyticsService.get_match_accuracy_stats()
        serializer = MatchAccuracyStatsSerializer(data=stats)
        serializer.is_valid()
        
        return Response(serializer.data)


class DailySummaryView(APIView):
    """
    Get daily summaries for a date range.
    
    Query Parameters:
        - days: Number of days to include (default: 30)
    
    GET /api/v1/ai/analytics/daily-summary/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        from ..models import AIAnalyticsSummary
        summaries = AIAnalyticsSummary.objects.filter(
            date__gte=start_date
        ).order_by('date')
        
        serializer = AIAnalyticsSummarySerializer(summaries, many=True)
        
        return Response(serializer.data)


class CostTrendView(APIView):
    """
    Get cost trend data.
    
    Query Parameters:
        - days: Number of days to include (default: 30)
    
    GET /api/v1/ai/analytics/cost-trend/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        trend_data = AIAnalyticsService.get_cost_trend(days=days)
        
        return Response(trend_data)


class FeatureUsageView(APIView):
    """
    Get feature usage breakdown.
    
    Query Parameters:
        - days: Number of days to include (default: 30)
    
    GET /api/v1/ai/analytics/feature-usage/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        breakdown = AIAnalyticsService.get_feature_usage_breakdown(days=days)
        
        serializer = FeatureUsageBreakdownSerializer(data=breakdown)
        serializer.is_valid()
        
        return Response(serializer.data)


class GenerateDailySummaryView(APIView):
    """
    Generate daily summary for a specific date.
    Admin only endpoint for manual summary generation.
    
    POST /api/v1/ai/analytics/generate-summary/
    Body: { "date": "2026-01-07" }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        date_str = request.data.get('date')
        if date_str:
            try:
                date = timezone.datetime.fromisoformat(date_str).date()
            except ValueError:
                return Response(
                    {"error": "Invalid date format. Use ISO format (YYYY-MM-DD)"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            date = timezone.now().date()
        
        summary = AIAnalyticsService.generate_daily_summary(date)
        serializer = AIAnalyticsSummarySerializer(summary)
        
        return Response({
            "message": "Daily summary generated successfully",
            "summary": serializer.data
        }, status=status.HTTP_201_CREATED)
