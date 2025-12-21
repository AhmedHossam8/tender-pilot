"""
AI Usage Tracking

Provides functionality for tracking AI token usage, costs,
and generating usage reports.
"""

import logging
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.conf import settings

from ..models import AIUsage, AIRequest, AIResponse

logger = logging.getLogger(__name__)


# Default model pricing (USD per 1K tokens)
DEFAULT_MODEL_PRICING = {
    # OpenAI models
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "gpt-3.5-turbo-16k": {"input": 0.003, "output": 0.004},
    # Anthropic models
    "claude-3-opus": {"input": 0.015, "output": 0.075},
    "claude-3-sonnet": {"input": 0.003, "output": 0.015},
    "claude-3-haiku": {"input": 0.00025, "output": 0.00125},
}


class AIUsageTracker:
    """
    Tracks and reports AI usage for billing and monitoring.
    
    Features:
    - Log individual AI requests
    - Calculate costs based on model pricing
    - Generate usage reports by user, time period, model
    - Enforce usage limits
    """
    
    def __init__(self):
        # Load pricing from settings or use defaults
        self.pricing = getattr(
            settings,
            'AI_MODEL_PRICING',
            DEFAULT_MODEL_PRICING
        )
    
    def log_usage(
        self,
        user,
        request: AIRequest,
        input_tokens: int,
        output_tokens: int,
        provider: str,
        model: str,
    ) -> AIUsage:
        """
        Log AI usage for a request.
        
        Args:
            user: The user making the request
            request: The AIRequest object
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            provider: AI provider name
            model: Model name
            
        Returns:
            Created AIUsage record
        """
        # Calculate cost
        cost = self.calculate_cost(input_tokens, output_tokens, model)
        
        # Create usage record
        usage = AIUsage.objects.create(
            user=user,
            request=request,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            estimated_cost=Decimal(str(cost)),
            provider=provider,
            model=model,
            date=timezone.now().date(),
        )
        
        logger.info(
            f"Logged AI usage: user={user.id if user else 'anonymous'}, "
            f"tokens={input_tokens + output_tokens}, cost=${cost:.6f}"
        )
        
        return usage
    
    def calculate_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        model: str
    ) -> float:
        """
        Calculate the cost for token usage.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model name
            
        Returns:
            Cost in USD
        """
        pricing = self.pricing.get(model, {"input": 0.0, "output": 0.0})
        
        input_cost = (input_tokens / 1000) * pricing["input"]
        output_cost = (output_tokens / 1000) * pricing["output"]
        
        return round(input_cost + output_cost, 6)
    
    def get_user_usage(
        self,
        user,
        period: str = 'day',
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """
        Get usage statistics for a user.
        
        Args:
            user: The user to get stats for
            period: 'day', 'week', 'month', 'year', or 'custom'
            start_date: Start date for custom period
            end_date: End date for custom period
            
        Returns:
            Dictionary with usage statistics
        """
        # Calculate date range
        today = timezone.now().date()
        
        if period == 'day':
            start = today
            end = today
        elif period == 'week':
            start = today - timedelta(days=7)
            end = today
        elif period == 'month':
            start = today - timedelta(days=30)
            end = today
        elif period == 'year':
            start = today - timedelta(days=365)
            end = today
        elif period == 'custom' and start_date and end_date:
            start = start_date
            end = end_date
        else:
            start = today
            end = today
        
        # Query usage
        queryset = AIUsage.objects.filter(
            user=user,
            date__gte=start,
            date__lte=end,
        )
        
        # Aggregate stats
        stats = queryset.aggregate(
            total_requests=Count('id'),
            total_input_tokens=Sum('input_tokens'),
            total_output_tokens=Sum('output_tokens'),
            total_tokens=Sum('total_tokens'),
            total_cost=Sum('estimated_cost'),
        )
        
        # Add breakdown by model
        by_model = queryset.values('model').annotate(
            requests=Count('id'),
            tokens=Sum('total_tokens'),
            cost=Sum('estimated_cost'),
        )
        
        # Add daily breakdown
        daily = queryset.annotate(
            day=TruncDate('timestamp')
        ).values('day').annotate(
            requests=Count('id'),
            tokens=Sum('total_tokens'),
            cost=Sum('estimated_cost'),
        ).order_by('day')
        
        return {
            'period': {
                'start': start.isoformat(),
                'end': end.isoformat(),
            },
            'totals': {
                'requests': stats['total_requests'] or 0,
                'input_tokens': stats['total_input_tokens'] or 0,
                'output_tokens': stats['total_output_tokens'] or 0,
                'total_tokens': stats['total_tokens'] or 0,
                'cost': float(stats['total_cost'] or 0),
            },
            'by_model': list(by_model),
            'daily': list(daily),
        }
    
    def get_total_cost(
        self,
        period: str = 'month',
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """
        Get total cost across all users.
        
        Args:
            period: Time period
            start_date: Start date for custom period
            end_date: End date for custom period
            
        Returns:
            Dictionary with cost information
        """
        today = timezone.now().date()
        
        if period == 'day':
            start = today
            end = today
        elif period == 'week':
            start = today - timedelta(days=7)
            end = today
        elif period == 'month':
            start = today - timedelta(days=30)
            end = today
        elif period == 'custom' and start_date and end_date:
            start = start_date
            end = end_date
        else:
            start = today - timedelta(days=30)
            end = today
        
        queryset = AIUsage.objects.filter(
            date__gte=start,
            date__lte=end,
        )
        
        stats = queryset.aggregate(
            total_requests=Count('id'),
            total_tokens=Sum('total_tokens'),
            total_cost=Sum('estimated_cost'),
        )
        
        # Cost by provider
        by_provider = queryset.values('provider').annotate(
            requests=Count('id'),
            tokens=Sum('total_tokens'),
            cost=Sum('estimated_cost'),
        )
        
        # Cost by model
        by_model = queryset.values('model').annotate(
            requests=Count('id'),
            tokens=Sum('total_tokens'),
            cost=Sum('estimated_cost'),
        ).order_by('-cost')
        
        # Top users by cost
        top_users = queryset.values('user__id', 'user__email').annotate(
            requests=Count('id'),
            tokens=Sum('total_tokens'),
            cost=Sum('estimated_cost'),
        ).order_by('-cost')[:10]
        
        return {
            'period': {
                'start': start.isoformat(),
                'end': end.isoformat(),
            },
            'totals': {
                'requests': stats['total_requests'] or 0,
                'tokens': stats['total_tokens'] or 0,
                'cost': float(stats['total_cost'] or 0),
            },
            'by_provider': list(by_provider),
            'by_model': list(by_model),
            'top_users': list(top_users),
        }
    
    def check_user_limits(
        self,
        user,
        period: str = 'day',
    ) -> Dict[str, Any]:
        """
        Check if user has exceeded their limits.
        
        Args:
            user: The user to check
            period: Time period for limit check
            
        Returns:
            Dictionary with limit status
        """
        # Get limits from settings
        limits = getattr(settings, 'AI_RATE_LIMITS', {
            'requests_per_hour': 50,
            'tokens_per_day': 100000,
            'cost_per_day': 10.0,
        })
        
        usage = self.get_user_usage(user, period)
        
        # Check limits
        requests_limit = limits.get('requests_per_hour', float('inf'))
        tokens_limit = limits.get('tokens_per_day', float('inf'))
        cost_limit = limits.get('cost_per_day', float('inf'))
        
        requests_used = usage['totals']['requests']
        tokens_used = usage['totals']['total_tokens']
        cost_used = usage['totals']['cost']
        
        return {
            'requests': {
                'used': requests_used,
                'limit': requests_limit,
                'exceeded': requests_used >= requests_limit,
                'remaining': max(0, requests_limit - requests_used),
            },
            'tokens': {
                'used': tokens_used,
                'limit': tokens_limit,
                'exceeded': tokens_used >= tokens_limit,
                'remaining': max(0, tokens_limit - tokens_used),
            },
            'cost': {
                'used': cost_used,
                'limit': cost_limit,
                'exceeded': cost_used >= cost_limit,
                'remaining': max(0, cost_limit - cost_used),
            },
            'any_limit_exceeded': (
                requests_used >= requests_limit or
                tokens_used >= tokens_limit or
                cost_used >= cost_limit
            ),
        }


# Create a default tracker instance
usage_tracker = AIUsageTracker()
