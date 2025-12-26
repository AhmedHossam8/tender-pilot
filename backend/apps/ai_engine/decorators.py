"""
AI Engine Rate Limiting

Provides rate limiting functionality to control AI usage and prevent abuse.

Features:
1. Per-user rate limits
2. Per-endpoint limits
3. Token budget enforcement
4. Custom error responses

Installation:
    pip install django-ratelimit

Usage:
    from .decorators import ai_rate_limit
    
    class MyView(APIView):
        @ai_rate_limit(rate='10/h')
        def post(self, request):
            ...

Configuration:
    Set limits in settings.py:
    AI_RATE_LIMITS = {
        'requests_per_hour': 10,
        'requests_per_day': 50,
        'tokens_per_day': 100000,
    }
"""

import logging
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

logger = logging.getLogger(__name__)


def ai_rate_limit(rate='10/h', key='user', method='POST', group=None):
    """
    Rate limit decorator for AI endpoints.
    
    This decorator uses django-ratelimit under the hood but provides
    AI-specific error messages and logging.
    
    Args:
        rate: Rate limit string (e.g., '10/h', '50/d', '100/m')
            - '10/h' = 10 requests per hour
            - '50/d' = 50 requests per day
            - '100/m' = 100 requests per minute
        key: What to key on ('user', 'ip', 'user_or_ip')
        method: HTTP methods to limit ('POST', 'GET', 'ALL')
    
    Example:
        @ai_rate_limit(rate='10/h')  # 10 requests per hour per user
        def post(self, request, tender_id):
            ...
    
    Returns:
        Decorated function that enforces rate limit
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(self, request, *args, **kwargs):
            # Try to import django-ratelimit
            try:
                from django_ratelimit.decorators import ratelimit
                from django_ratelimit.exceptions import Ratelimited
            except ImportError:
                # If not installed, log warning and continue without rate limiting
                logger.warning(
                    "django-ratelimit not installed. Rate limiting disabled. "
                    "Install with: pip install django-ratelimit"
                )
                return view_func(self, request, *args, **kwargs)
            
            # Apply rate limit
            @ratelimit(key=key, rate=rate, method=method)
            def inner(request):
                return view_func(self, request, *args, **kwargs)
            
            try:
                return inner(request)
            except Ratelimited:
                # Extract rate info for error message
                logger.warning(
                    f"Rate limit exceeded: user={request.user.id if request.user.is_authenticated else 'anonymous'}, "
                    f"rate={rate}, endpoint={request.path}"
                )
                
                # Parse rate to get retry_after
                retry_after = _parse_retry_after(rate)
                
                return Response(
                    {
                        'error': 'Rate limit exceeded',
                        'code': 'rate_limit_exceeded',
                        'message': f'You have exceeded the rate limit of {rate}',
                        'limit': rate,
                        'retry_after': retry_after,
                        'suggestion': 'Please wait before making more requests'
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                    headers={'Retry-After': str(retry_after)}
                )
        
        return wrapped_view
    return decorator


def _parse_retry_after(rate: str) -> int:
    """
    Parse rate string to determine retry_after seconds.
    
    Args:
        rate: Rate string like '10/h', '50/d'
    
    Returns:
        Seconds to wait before retrying
    """
    try:
        count, period = rate.split('/')
        period_map = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400,
        }
        return period_map.get(period, 3600)  # Default to 1 hour
    except:
        return 3600  # Default to 1 hour


class TokenBudgetEnforcer:
    """
    Enforces daily/monthly token budget limits per user.
    
    This is separate from request-based rate limiting and focuses
    on controlling costs by limiting total tokens consumed.
    
    Usage:
        enforcer = TokenBudgetEnforcer()
        enforcer.check_budget(user, estimated_tokens=5000)
        # Raises exception if over budget
    """
    
    def __init__(self):
        self.limits = getattr(settings, 'AI_RATE_LIMITS', {})
    
    def check_budget(self, user, estimated_tokens: int) -> bool:
        """
        Check if user has sufficient token budget.
        
        Args:
            user: User making request
            estimated_tokens: Estimated tokens for this request
            
        Returns:
            True if within budget
            
        Raises:
            BudgetExceededError: If over budget
        """
        # Get user's tier
        tier = self._get_user_tier(user)
        
        # Get tier limits
        daily_limit = self.limits.get(tier, {}).get('tokens_per_day')
        
        if daily_limit is None:
            # No limit for this tier
            return True
        
        # Check current usage
        from ..tracking.usage import AIUsageTracker
        tracker = AIUsageTracker()
        
        usage = tracker.get_user_usage(user, period='day')
        current_tokens = usage['total_tokens']
        
        if current_tokens + estimated_tokens > daily_limit:
            remaining = max(0, daily_limit - current_tokens)
            raise BudgetExceededError(
                f"Daily token budget exceeded. "
                f"Limit: {daily_limit}, Used: {current_tokens}, "
                f"Remaining: {remaining}"
            )
        
        return True
    
    def check_token_budget(self, request):
        """
        Check if user has remaining token budget.
        
        Returns:
            (allowed: bool, remaining: int)
        """
        if not request.user.is_authenticated:
            return False, 0
        
        # Get user's limits from permission system
        from .permissions import get_user_ai_limits
        limits = get_user_ai_limits(request.user)
        tokens_per_day = limits.get('tokens_per_day', 50000)
        
        # Get usage tracker
        from .tracking.usage import AIUsageTracker
        tracker = AIUsageTracker()
        
        # Get today's usage
        from datetime import date
        usage = tracker.get_user_usage(
            request.user,
            period='day',
            start_date=date.today()
        )
        
        tokens_used_today = usage.get('total_tokens', 0)
        remaining = tokens_per_day - tokens_used_today
        
        return remaining > 0, remaining
    
    def _get_user_tier(self, user) -> str:
        """
        Determine user's subscription tier.
        
        Returns user role as tier until subscription system is ready.
        """
        # Use role as tier until subscription system is ready
        if hasattr(user, 'role'):
            return str(user.role).upper()
        return 'REVIEWER'  # Default tier


class BudgetExceededError(Exception):
    """Raised when user exceeds token budget."""
    pass


# Default rate limit configurations
DEFAULT_RATE_LIMITS = {
    'free_tier': {
        'requests_per_hour': 5,
        'requests_per_day': 20,
        'tokens_per_day': 50000,
    },
    'pro_tier': {
        'requests_per_hour': 50,
        'requests_per_day': 500,
        'tokens_per_day': 1000000,
    },
    'enterprise_tier': {
        'requests_per_hour': None,  # Unlimited
        'requests_per_day': None,
        'tokens_per_day': None,
    }
}


def get_rate_limit_for_user(user) -> str:
    """
    Get appropriate rate limit string for user based on their tier.
    
    Args:
        user: User object
        
    Returns:
        Rate limit string (e.g., '10/h')
    """
    limits = getattr(settings, 'AI_RATE_LIMITS', DEFAULT_RATE_LIMITS)
    
    # Determine tier (use role until subscription system is ready)
    if hasattr(user, 'role'):
        tier = str(user.role).upper()
    elif hasattr(user, 'subscription'):
        tier = user.subscription.tier
    else:
        tier = 'REVIEWER'
    
    # Get requests per hour for this tier
    tier_limits = limits.get(tier, {})
    requests_per_hour = tier_limits.get('requests_per_hour', 10)
    
    if requests_per_hour is None:
        return '10000/h'  # Effectively unlimited
    
    return f'{requests_per_hour}/h'
