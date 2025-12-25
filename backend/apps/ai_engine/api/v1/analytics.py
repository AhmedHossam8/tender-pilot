"""
AI Usage Analytics API

Provides analytics endpoints for monitoring AI engine usage, costs, and performance.

Endpoints:
1. GET /api/v1/ai/analytics/usage - Overall usage metrics
2. GET /api/v1/ai/analytics/usage/user/{user_id} - Per-user usage
3. GET /api/v1/ai/analytics/performance - Performance metrics
4. GET /api/v1/ai/analytics/costs - Cost estimation
5. GET /api/v1/ai/analytics/prompts - Prompt performance comparison

Features:
- Role-based access (admins see all, PMs see their team)
- Time range filtering
- Aggregation by provider, model, prompt
- Cost estimation
- Performance trends

Architecture:
- Views handle HTTP requests
- Service layer performs aggregations
- Permission-based filtering
- Cached for performance
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Avg, Count, Q, F
from django.utils import timezone
from django.core.cache import cache

from ..models import AIRequest, AIResponse, AIUsage, AIRequestStatus
from ..permissions import CanViewAIAnalytics
from ..decorators import ai_rate_limit

logger = logging.getLogger(__name__)


# ============================================================================
# COST ESTIMATION (approximate)
# ============================================================================

# Approximate costs per 1K tokens (USD)
TOKEN_COSTS = {
    'gpt-4': {'input': 0.03, 'output': 0.06},
    'gpt-4-turbo': {'input': 0.01, 'output': 0.03},
    'gpt-3.5-turbo': {'input': 0.0005, 'output': 0.0015},
    'gemini-pro': {'input': 0.00025, 'output': 0.0005},
    'gemini-1.5-pro': {'input': 0.00125, 'output': 0.00375},
}


def estimate_cost(provider: str, model: str, input_tokens: int, output_tokens: int) -> Decimal:
    """
    Estimate cost for token usage.
    
    Args:
        provider: AI provider name
        model: Model name
        input_tokens: Input token count
        output_tokens: Output token count
    
    Returns:
        Estimated cost in USD
    """
    # Get costs (default to gpt-3.5-turbo if unknown)
    costs = TOKEN_COSTS.get(model, TOKEN_COSTS['gpt-3.5-turbo'])
    
    input_cost = (input_tokens / 1000) * costs['input']
    output_cost = (output_tokens / 1000) * costs['output']
    
    return Decimal(str(input_cost + output_cost)).quantize(Decimal('0.0001'))


class UsageAnalyticsView(APIView):
    """
    GET /api/v1/ai/analytics/usage
    
    Query params:
        - start_date: YYYY-MM-DD (default: 30 days ago)
        - end_date: YYYY-MM-DD (default: today)
        - group_by: provider|model|prompt (default: provider)
    
    Response:
        {
            "summary": {
                "total_requests": 1234,
                "successful_requests": 1200,
                "failed_requests": 34,
                "total_tokens": 500000,
                "estimated_cost": "123.45"
            },
            "by_provider": [...],
            "by_model": [...],
            "daily_trend": [...]
        }
    
    Permissions:
    - Admins: See all usage
    - Proposal Managers: See only their own usage
    - Reviewers: See only their own usage
    """
    
    permission_classes = [CanViewAIAnalytics]
    
    @ai_rate_limit(group='analytics', rate='30/hour')
    def get(self, request):
        """Get usage analytics."""
        # Parse query params
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        group_by = request.query_params.get('group_by', 'provider')
        
        # Default date range (last 30 days)
        if not end_date:
            end_date = timezone.now()
        else:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        if not start_date:
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        # Build base queryset with permissions
        requests_query = AIRequest.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        usage_query = AIUsage.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        # Filter by permissions
        user_role = str(request.user.role).upper()
        if user_role != 'ADMIN':
            requests_query = requests_query.filter(user=request.user)
            usage_query = usage_query.filter(user=request.user)
        
        # Build cache key
        cache_key = f"analytics:usage:{request.user.id}:{start_date.date()}:{end_date.date()}:{group_by}"
        cached_result = cache.get(cache_key)
        if cached_result:
            logger.debug(f"Analytics cache hit: {cache_key}")
            return Response(cached_result)
        
        # Calculate summary
        summary = {
            'total_requests': requests_query.count(),
            'successful_requests': requests_query.filter(status=AIRequestStatus.COMPLETED).count(),
            'failed_requests': requests_query.filter(status=AIRequestStatus.FAILED).count(),
            'total_tokens': usage_query.aggregate(Sum('total_tokens'))['total_tokens__sum'] or 0,
        }
        
        # Calculate estimated cost
        total_cost = Decimal('0')
        for usage in usage_query.values('provider', 'model', 'input_tokens', 'output_tokens'):
            total_cost += estimate_cost(
                usage['provider'],
                usage['model'],
                usage['input_tokens'] or 0,
                usage['output_tokens'] or 0
            )
        summary['estimated_cost'] = str(total_cost)
        
        # Group by provider
        by_provider = list(
            usage_query.values('provider')
            .annotate(
                requests=Count('id'),
                total_tokens=Sum('total_tokens'),
                avg_tokens=Avg('total_tokens')
            )
            .order_by('-requests')
        )
        
        # Group by model
        by_model = list(
            usage_query.values('model')
            .annotate(
                requests=Count('id'),
                total_tokens=Sum('total_tokens'),
                avg_tokens=Avg('total_tokens')
            )
            .order_by('-requests')
        )
        
        # Daily trend (last 30 days)
        daily_trend = []
        current_date = start_date.date()
        end = end_date.date()
        
        while current_date <= end:
            day_requests = requests_query.filter(
                created_at__date=current_date
            ).count()
            
            day_tokens = usage_query.filter(
                created_at__date=current_date
            ).aggregate(Sum('total_tokens'))['total_tokens__sum'] or 0
            
            daily_trend.append({
                'date': current_date.isoformat(),
                'requests': day_requests,
                'tokens': day_tokens,
            })
            
            current_date += timedelta(days=1)
        
        result = {
            'summary': summary,
            'by_provider': by_provider,
            'by_model': by_model,
            'daily_trend': daily_trend,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
            }
        }
        
        # Cache for 5 minutes
        cache.set(cache_key, result, 300)
        
        return Response(result)


class UserUsageAnalyticsView(APIView):
    """
    GET /api/v1/ai/analytics/usage/user/{user_id}
    
    Response:
        {
            "user": {...},
            "usage": {
                "total_requests": 100,
                "total_tokens": 50000,
                "estimated_cost": "12.34",
                "by_prompt": [...]
            },
            "quota": {
                "daily_limit": 200000,
                "used_today": 15000,
                "remaining": 185000
            }
        }
    
    Permissions:
    - Admins: Can view any user
    - Others: Can only view themselves
    """
    
    permission_classes = [CanViewAIAnalytics]
    
    @ai_rate_limit(group='analytics', rate='30/hour')
    def get(self, request, user_id):
        """Get user-specific usage analytics."""
        from apps.users.models import User
        
        # Check permission
        user_role = str(request.user.role).upper()
        if user_role != 'ADMIN' and str(request.user.id) != user_id:
            return Response(
                {'error': 'You can only view your own analytics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get usage data
        requests_query = AIRequest.objects.filter(user=user)
        usage_query = AIUsage.objects.filter(user=user)
        
        # Calculate totals
        total_requests = requests_query.count()
        total_tokens = usage_query.aggregate(Sum('total_tokens'))['total_tokens__sum'] or 0
        
        # Calculate cost
        total_cost = Decimal('0')
        for usage in usage_query.values('provider', 'model', 'input_tokens', 'output_tokens'):
            total_cost += estimate_cost(
                usage['provider'],
                usage['model'],
                usage['input_tokens'] or 0,
                usage['output_tokens'] or 0
            )
        
        # Group by prompt
        by_prompt = list(
            requests_query.values('prompt_name')
            .annotate(
                count=Count('id'),
                successful=Count('id', filter=Q(status=AIRequestStatus.COMPLETED)),
            )
            .order_by('-count')
        )
        
        # Get today's usage for quota
        today = timezone.now().date()
        today_usage = usage_query.filter(
            created_at__date=today
        ).aggregate(Sum('total_tokens'))['total_tokens__sum'] or 0
        
        # Get user's quota
        from ..permissions import get_user_ai_limits
        limits = get_user_ai_limits(user)
        
        return Response({
            'user': {
                'id': str(user.id),
                'email': user.email,
                'role': str(user.role),
            },
            'usage': {
                'total_requests': total_requests,
                'total_tokens': total_tokens,
                'estimated_cost': str(total_cost),
                'by_prompt': by_prompt,
            },
            'quota': {
                'daily_limit': limits['daily_tokens'],
                'used_today': today_usage,
                'remaining': max(0, limits['daily_tokens'] - today_usage),
                'percentage_used': (today_usage / limits['daily_tokens'] * 100) if limits['daily_tokens'] > 0 else 0,
            }
        })


class PerformanceAnalyticsView(APIView):
    """
    GET /api/v1/ai/analytics/performance
    
    Response:
        {
            "avg_response_time": 2.34,
            "success_rate": 97.5,
            "avg_confidence": 0.85,
            "by_prompt": [...],
            "failure_reasons": [...]
        }
    
    Permissions:
    - Admins: See all performance data
    """
    
    permission_classes = [CanViewAIAnalytics]
    
    @ai_rate_limit(group='analytics', rate='30/hour')
    def get(self, request):
        """Get performance analytics."""
        # Only admins can view performance analytics
        user_role = str(request.user.role).upper()
        if user_role != 'ADMIN':
            return Response(
                {'error': 'Admin permission required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Date range
        start_date = request.query_params.get('start_date')
        if not start_date:
            start_date = timezone.now() - timedelta(days=30)
        else:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        requests_query = AIRequest.objects.filter(created_at__gte=start_date)
        responses_query = AIResponse.objects.filter(created_at__gte=start_date)
        
        # Calculate metrics
        total_requests = requests_query.count()
        successful = requests_query.filter(status=AIRequestStatus.COMPLETED).count()
        success_rate = (successful / total_requests * 100) if total_requests > 0 else 0
        
        avg_response_time = requests_query.filter(
            processing_time__isnull=False
        ).aggregate(Avg('processing_time'))['processing_time__avg'] or 0
        
        avg_confidence = responses_query.filter(
            confidence_score__isnull=False
        ).aggregate(Avg('confidence_score'))['confidence_score__avg'] or 0
        
        # Performance by prompt
        by_prompt = list(
            requests_query.values('prompt_name')
            .annotate(
                total=Count('id'),
                successful=Count('id', filter=Q(status=AIRequestStatus.COMPLETED)),
                avg_time=Avg('processing_time', filter=Q(processing_time__isnull=False)),
            )
            .order_by('-total')
        )
        
        # Add success rate to each prompt
        for prompt in by_prompt:
            prompt['success_rate'] = (prompt['successful'] / prompt['total'] * 100) if prompt['total'] > 0 else 0
        
        # Failure reasons
        failure_reasons = list(
            requests_query.filter(status=AIRequestStatus.FAILED)
            .values('error_message')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        
        return Response({
            'avg_response_time': float(avg_response_time),
            'success_rate': float(success_rate),
            'avg_confidence': float(avg_confidence),
            'by_prompt': by_prompt,
            'failure_reasons': failure_reasons,
        })


class CostAnalyticsView(APIView):
    """
    GET /api/v1/ai/analytics/costs
    
    Response:
        {
            "total_cost": "1234.56",
            "by_provider": [...],
            "by_model": [...],
            "daily_costs": [...]
        }
    
    Permissions:
    - Admins only
    """
    
    permission_classes = [CanViewAIAnalytics]
    
    @ai_rate_limit(group='analytics', rate='30/hour')
    def get(self, request):
        """Get cost analytics."""
        # Only admins can view cost analytics
        user_role = str(request.user.role).upper()
        if user_role != 'ADMIN':
            return Response(
                {'error': 'Admin permission required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not end_date:
            end_date = timezone.now()
        else:
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        
        if not start_date:
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        
        usage_query = AIUsage.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        # Calculate total cost
        total_cost = Decimal('0')
        by_provider = {}
        by_model = {}
        
        for usage in usage_query.values('provider', 'model', 'input_tokens', 'output_tokens', 'created_at'):
            cost = estimate_cost(
                usage['provider'],
                usage['model'],
                usage['input_tokens'] or 0,
                usage['output_tokens'] or 0
            )
            
            total_cost += cost
            
            # Aggregate by provider
            provider = usage['provider']
            if provider not in by_provider:
                by_provider[provider] = Decimal('0')
            by_provider[provider] += cost
            
            # Aggregate by model
            model = usage['model']
            if model not in by_model:
                by_model[model] = Decimal('0')
            by_model[model] += cost
        
        # Daily costs
        daily_costs = []
        current_date = start_date.date()
        end = end_date.date()
        
        while current_date <= end:
            day_usage = usage_query.filter(created_at__date=current_date)
            day_cost = Decimal('0')
            
            for usage in day_usage.values('provider', 'model', 'input_tokens', 'output_tokens'):
                day_cost += estimate_cost(
                    usage['provider'],
                    usage['model'],
                    usage['input_tokens'] or 0,
                    usage['output_tokens'] or 0
                )
            
            daily_costs.append({
                'date': current_date.isoformat(),
                'cost': str(day_cost),
            })
            
            current_date += timedelta(days=1)
        
        return Response({
            'total_cost': str(total_cost),
            'by_provider': [
                {'provider': k, 'cost': str(v)}
                for k, v in sorted(by_provider.items(), key=lambda x: x[1], reverse=True)
            ],
            'by_model': [
                {'model': k, 'cost': str(v)}
                for k, v in sorted(by_model.items(), key=lambda x: x[1], reverse=True)
            ],
            'daily_costs': daily_costs,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
            }
        })


class PromptPerformanceView(APIView):
    """
    GET /api/v1/ai/analytics/prompts
    
    Compare performance across prompt versions.
    
    Response:
        {
            "prompts": [
                {
                    "name": "tender_analysis",
                    "versions": [
                        {
                            "version": "1.0",
                            "is_active": true,
                            "usage_count": 100,
                            "success_rate": 98.0,
                            "avg_confidence": 0.87,
                            "avg_tokens": 1234
                        }
                    ]
                }
            ]
        }
    
    Permissions:
    - Admins only
    """
    
    permission_classes = [CanViewAIAnalytics]
    
    @ai_rate_limit(group='analytics', rate='30/hour')
    def get(self, request):
        """Get prompt performance comparison."""
        # Only admins can view
        user_role = str(request.user.role).upper()
        if user_role != 'ADMIN':
            return Response(
                {'error': 'Admin permission required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from ..models import PromptVersion
        
        # Group by prompt name
        prompt_names = AIRequest.objects.values_list('prompt_name', flat=True).distinct()
        
        result = []
        for prompt_name in prompt_names:
            versions_data = []
            
            # Get all versions used
            versions = AIRequest.objects.filter(
                prompt_name=prompt_name
            ).values_list('prompt_version', flat=True).distinct()
            
            for version in versions:
                requests = AIRequest.objects.filter(
                    prompt_name=prompt_name,
                    prompt_version=version
                )
                
                responses = AIResponse.objects.filter(
                    request__prompt_name=prompt_name,
                    request__prompt_version=version
                )
                
                total = requests.count()
                successful = requests.filter(status=AIRequestStatus.COMPLETED).count()
                
                # Check if active in DB
                is_active = PromptVersion.objects.filter(
                    name=prompt_name,
                    version=version,
                    is_active=True
                ).exists()
                
                versions_data.append({
                    'version': version,
                    'is_active': is_active,
                    'usage_count': total,
                    'success_rate': (successful / total * 100) if total > 0 else 0,
                    'avg_confidence': float(
                        responses.aggregate(Avg('confidence_score'))['confidence_score__avg'] or 0
                    ),
                    'avg_tokens': float(
                        responses.aggregate(Avg('total_tokens'))['total_tokens__avg'] or 0
                    ),
                })
            
            result.append({
                'name': prompt_name,
                'versions': sorted(versions_data, key=lambda x: x['usage_count'], reverse=True),
            })
        
        return Response({'prompts': result})
