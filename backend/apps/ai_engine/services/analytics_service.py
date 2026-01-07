"""
AI Analytics Service

Service for tracking, aggregating, and analyzing AI usage metrics.
This service provides insights into:
- Feature usage patterns
- Cost monitoring
- Performance metrics
- Match prediction accuracy
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from django.db.models import Count, Avg, Sum, Q, F
from django.utils import timezone
from decimal import Decimal

from ..models import AIUsageLog, MatchSuccessLog, AIAnalyticsSummary


class AIAnalyticsService:
    """
    Service for AI analytics tracking and reporting.
    
    This service handles:
    1. Logging AI feature usage
    2. Tracking match prediction success
    3. Generating daily summaries
    4. Providing dashboard data
    """
    
    @staticmethod
    def log_usage(
        user=None,
        feature: str = None,
        project_id: int = None,
        bid_id: int = None,
        execution_time: float = 0,
        tokens_used: int = 0,
        cost: Decimal = Decimal('0'),
        cached: bool = False,
        success: bool = True,
        error_message: str = '',
        confidence_score: float = None
    ) -> AIUsageLog:
        """
        Log an AI feature usage event.
        
        Args:
            user: User who triggered the AI operation
            feature: Feature code (match_score, bid_generation, etc.)
            project_id: Related project ID
            bid_id: Related bid ID
            execution_time: Time taken in seconds
            tokens_used: Number of tokens consumed
            cost: Cost of the operation
            cached: Whether result was from cache
            success: Whether operation succeeded
            error_message: Error message if failed
            confidence_score: AI confidence in result (0-1)
            
        Returns:
            AIUsageLog instance
        """
        return AIUsageLog.objects.create(
            user=user,
            feature=feature,
            project_id=project_id,
            bid_id=bid_id,
            execution_time=execution_time,
            tokens_used=tokens_used,
            cost=cost,
            cached=cached,
            success=success,
            error_message=error_message,
            confidence_score=confidence_score
        )
    
    @staticmethod
    def log_match_prediction(
        project_id: int,
        provider_id: int,
        predicted_match_score: int,
        predicted_success: bool
    ) -> MatchSuccessLog:
        """
        Log a match prediction for later accuracy tracking.
        
        Args:
            project_id: Project ID
            provider_id: Provider ID
            predicted_match_score: AI predicted match score (0-100)
            predicted_success: AI predicted whether match would succeed
            
        Returns:
            MatchSuccessLog instance
        """
        return MatchSuccessLog.objects.create(
            project_id=project_id,
            provider_id=provider_id,
            predicted_match_score=predicted_match_score,
            predicted_success=predicted_success
        )
    
    @staticmethod
    def update_match_outcome(
        project_id: int,
        provider_id: int,
        bid_submitted: bool = False,
        bid_accepted: bool = False
    ):
        """
        Update the actual outcome of a match prediction.
        
        Args:
            project_id: Project ID
            provider_id: Provider ID
            bid_submitted: Whether provider submitted a bid
            bid_accepted: Whether bid was accepted
        """
        try:
            match_log = MatchSuccessLog.objects.get(
                project_id=project_id,
                provider_id=provider_id
            )
            
            match_log.bid_submitted = bid_submitted
            match_log.bid_accepted = bid_accepted
            match_log.actual_success = bid_accepted
            match_log.outcome_date = timezone.now()
            match_log.prediction_accuracy = match_log.calculate_accuracy()
            match_log.save()
            
            return match_log
        except MatchSuccessLog.DoesNotExist:
            return None
    
    @staticmethod
    def get_usage_stats(
        start_date: datetime = None,
        end_date: datetime = None,
        user_id: int = None
    ) -> Dict[str, Any]:
        """
        Get aggregated usage statistics.
        
        Args:
            start_date: Start of date range
            end_date: End of date range
            user_id: Filter by specific user
            
        Returns:
            Dictionary with usage statistics
        """
        # Default to last 30 days if no dates provided
        if not end_date:
            end_date = timezone.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Build query
        queryset = AIUsageLog.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Aggregate stats
        total_requests = queryset.count()
        cached_requests = queryset.filter(cached=True).count()
        failed_requests = queryset.filter(success=False).count()
        
        # Feature breakdown
        feature_stats = queryset.values('feature').annotate(
            count=Count('id'),
            avg_time=Avg('execution_time'),
            total_cost=Sum('cost')
        )
        
        # Cost and performance
        aggregates = queryset.aggregate(
            total_tokens=Sum('tokens_used'),
            total_cost=Sum('cost'),
            avg_execution_time=Avg('execution_time'),
            avg_confidence=Avg('confidence_score')
        )
        
        return {
            'total_requests': total_requests,
            'cached_requests': cached_requests,
            'failed_requests': failed_requests,
            'successful_requests': total_requests - failed_requests,
            'cache_hit_rate': (cached_requests / total_requests * 100) if total_requests > 0 else 0,
            'success_rate': ((total_requests - failed_requests) / total_requests * 100) if total_requests > 0 else 0,
            'feature_breakdown': list(feature_stats),
            'total_tokens_used': aggregates['total_tokens'] or 0,
            'total_cost': float(aggregates['total_cost'] or 0),
            'avg_execution_time': aggregates['avg_execution_time'] or 0,
            'avg_confidence': aggregates['avg_confidence'] or 0,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            }
        }
    
    @staticmethod
    def get_match_accuracy_stats() -> Dict[str, Any]:
        """
        Get match prediction accuracy statistics.
        
        Returns:
            Dictionary with accuracy metrics
        """
        # Get all completed predictions (where outcome is known)
        completed = MatchSuccessLog.objects.filter(
            actual_success__isnull=False
        )
        
        total = completed.count()
        if total == 0:
            return {
                'total_predictions': 0,
                'accuracy_rate': 0,
                'precision': 0,
                'recall': 0
            }
        
        # Calculate accuracy metrics
        correct_predictions = completed.filter(
            predicted_success=F('actual_success')
        ).count()
        
        # True positives: predicted success and was successful
        true_positives = completed.filter(
            predicted_success=True,
            actual_success=True
        ).count()
        
        # False positives: predicted success but failed
        false_positives = completed.filter(
            predicted_success=True,
            actual_success=False
        ).count()
        
        # False negatives: predicted failure but succeeded
        false_negatives = completed.filter(
            predicted_success=False,
            actual_success=True
        ).count()
        
        # Calculate metrics
        accuracy = (correct_predictions / total * 100) if total > 0 else 0
        
        # Precision: Of all predicted successes, how many were actually successful?
        precision = (true_positives / (true_positives + false_positives) * 100) if (true_positives + false_positives) > 0 else 0
        
        # Recall: Of all actual successes, how many did we predict?
        recall = (true_positives / (true_positives + false_negatives) * 100) if (true_positives + false_negatives) > 0 else 0
        
        return {
            'total_predictions': total,
            'correct_predictions': correct_predictions,
            'accuracy_rate': accuracy,
            'precision': precision,
            'recall': recall,
            'true_positives': true_positives,
            'false_positives': false_positives,
            'false_negatives': false_negatives
        }
    
    @staticmethod
    def generate_daily_summary(date: datetime = None) -> AIAnalyticsSummary:
        """
        Generate or update daily summary for analytics.
        
        Args:
            date: Date to generate summary for (defaults to today)
            
        Returns:
            AIAnalyticsSummary instance
        """
        if not date:
            date = timezone.now().date()
        elif isinstance(date, datetime):
            date = date.date()
        
        # Get logs for this date
        logs = AIUsageLog.objects.filter(
            created_at__date=date
        )
        
        # Aggregate stats
        total_requests = logs.count()
        cached_requests = logs.filter(cached=True).count()
        failed_requests = logs.filter(success=False).count()
        
        # Feature breakdown
        match_score_requests = logs.filter(feature='match_score').count()
        bid_generation_requests = logs.filter(feature='bid_generation').count()
        price_suggestion_requests = logs.filter(feature='price_suggestion').count()
        quality_score_requests = logs.filter(feature='quality_score').count()
        
        # Performance metrics
        aggregates = logs.aggregate(
            avg_time=Avg('execution_time'),
            total_tokens=Sum('tokens_used'),
            total_cost=Sum('cost')
        )
        
        # Match accuracy for this date
        match_logs = MatchSuccessLog.objects.filter(
            prediction_date__date=date,
            actual_success__isnull=False
        )
        
        if match_logs.exists():
            match_accuracy = match_logs.aggregate(
                avg_accuracy=Avg('prediction_accuracy')
            )['avg_accuracy']
        else:
            match_accuracy = None
        
        # Create or update summary
        summary, created = AIAnalyticsSummary.objects.update_or_create(
            date=date,
            defaults={
                'total_requests': total_requests,
                'cached_requests': cached_requests,
                'failed_requests': failed_requests,
                'match_score_requests': match_score_requests,
                'bid_generation_requests': bid_generation_requests,
                'price_suggestion_requests': price_suggestion_requests,
                'quality_score_requests': quality_score_requests,
                'avg_execution_time': aggregates['avg_time'] or 0,
                'total_tokens_used': aggregates['total_tokens'] or 0,
                'total_cost': aggregates['total_cost'] or 0,
                'match_prediction_accuracy': match_accuracy
            }
        )
        
        return summary
    
    @staticmethod
    def get_cost_trend(days: int = 30) -> List[Dict[str, Any]]:
        """
        Get cost trend over specified number of days.
        
        Args:
            days: Number of days to include
            
        Returns:
            List of daily cost data
        """
        start_date = timezone.now().date() - timedelta(days=days)
        
        summaries = AIAnalyticsSummary.objects.filter(
            date__gte=start_date
        ).order_by('date')
        
        return [
            {
                'date': summary.date.isoformat(),
                'total_cost': float(summary.total_cost),
                'total_requests': summary.total_requests,
                'cache_hit_rate': summary.cache_hit_rate,
                'success_rate': summary.success_rate
            }
            for summary in summaries
        ]
    
    @staticmethod
    def get_feature_usage_breakdown(days: int = 30) -> Dict[str, Any]:
        """
        Get breakdown of feature usage over specified period.
        
        Args:
            days: Number of days to include
            
        Returns:
            Dictionary with feature usage data
        """
        start_date = timezone.now() - timedelta(days=days)
        
        # Get feature usage counts
        feature_stats = AIUsageLog.objects.filter(
            created_at__gte=start_date
        ).values('feature').annotate(
            count=Count('id'),
            total_cost=Sum('cost'),
            avg_execution_time=Avg('execution_time')
        ).order_by('-count')
        
        total_requests = sum(stat['count'] for stat in feature_stats)
        
        # Calculate percentages
        for stat in feature_stats:
            stat['percentage'] = (stat['count'] / total_requests * 100) if total_requests > 0 else 0
            stat['total_cost'] = float(stat['total_cost'] or 0)
        
        return {
            'total_requests': total_requests,
            'features': list(feature_stats),
            'period_days': days
        }
