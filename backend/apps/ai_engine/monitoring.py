"""
AI Engine Monitoring and Observability

Provides comprehensive monitoring, logging, and metrics tracking for AI operations.
Integrates with common monitoring tools like Prometheus, Sentry, and custom dashboards.

Features:
- Structured logging for all AI operations
- Prometheus metrics export
- Error tracking and alerting
- Performance monitoring
- Cost tracking metrics

Usage:
    from ai_engine.monitoring import ai_metrics, ai_logger
    
    # Log AI request
    ai_logger.log_request(request_id, user, prompt)
    
    # Track metrics
    ai_metrics.increment_requests()
    ai_metrics.record_latency(duration_ms)
"""

import logging
import time
from typing import Dict, Any, Optional
from decimal import Decimal
from functools import wraps
from django.conf import settings

logger = logging.getLogger(__name__)


# ============================================================================
# STRUCTURED LOGGING
# ============================================================================

class AILogger:
    """
    Structured logging for AI operations.
    
    Provides consistent, structured logging across all AI operations
    for easy parsing and analysis.
    """
    
    def __init__(self, logger_name: str = 'ai_engine'):
        self.logger = logging.getLogger(logger_name)
    
    def log_request(
        self,
        request_id: str,
        user_id: Any,
        operation: str,
        **kwargs
    ):
        """Log AI request initiation."""
        self.logger.info(
            'AI_REQUEST_START',
            extra={
                'event_type': 'ai_request_start',
                'request_id': str(request_id),
                'user_id': str(user_id),
                'operation': operation,
                **kwargs
            }
        )
    
    def log_response(
        self,
        request_id: str,
        operation: str,
        tokens_used: int,
        cost: Decimal,
        duration_ms: int,
        success: bool = True,
        **kwargs
    ):
        """Log AI response completion."""
        self.logger.info(
            'AI_REQUEST_COMPLETE',
            extra={
                'event_type': 'ai_request_complete',
                'request_id': str(request_id),
                'operation': operation,
                'tokens_used': tokens_used,
                'cost': float(cost),
                'duration_ms': duration_ms,
                'success': success,
                **kwargs
            }
        )
    
    def log_error(
        self,
        request_id: str,
        operation: str,
        error_type: str,
        error_message: str,
        **kwargs
    ):
        """Log AI operation error."""
        self.logger.error(
            'AI_REQUEST_ERROR',
            extra={
                'event_type': 'ai_request_error',
                'request_id': str(request_id),
                'operation': operation,
                'error_type': error_type,
                'error_message': error_message,
                **kwargs
            }
        )
    
    def log_rate_limit(
        self,
        user_id: Any,
        operation: str,
        limit_type: str,
        **kwargs
    ):
        """Log rate limit hit."""
        self.logger.warning(
            'AI_RATE_LIMIT',
            extra={
                'event_type': 'ai_rate_limit',
                'user_id': str(user_id),
                'operation': operation,
                'limit_type': limit_type,
                **kwargs
            }
        )
    
    def log_cache_hit(
        self,
        request_id: str,
        operation: str,
        cache_age_hours: float,
        **kwargs
    ):
        """Log cache hit."""
        self.logger.info(
            'AI_CACHE_HIT',
            extra={
                'event_type': 'ai_cache_hit',
                'request_id': str(request_id),
                'operation': operation,
                'cache_age_hours': cache_age_hours,
                **kwargs
            }
        )


# ============================================================================
# METRICS TRACKING
# ============================================================================

class AIMetrics:
    """
    Track AI metrics for monitoring and alerting.
    
    Provides counters and histograms for key AI operations.
    Can be integrated with Prometheus, StatsD, or custom backends.
    """
    
    def __init__(self):
        self.metrics_backend = self._get_metrics_backend()
    
    def _get_metrics_backend(self):
        """Get metrics backend based on configuration."""
        backend_type = getattr(settings, 'METRICS_BACKEND', 'memory')
        
        if backend_type == 'prometheus':
            return PrometheusMetrics()
        elif backend_type == 'statsd':
            return StatsDMetrics()
        else:
            return InMemoryMetrics()
    
    def increment_requests(self, operation: str, provider: str):
        """Increment request counter."""
        self.metrics_backend.increment(
            'ai_requests_total',
            labels={'operation': operation, 'provider': provider}
        )
    
    def increment_errors(self, operation: str, error_type: str):
        """Increment error counter."""
        self.metrics_backend.increment(
            'ai_errors_total',
            labels={'operation': operation, 'error_type': error_type}
        )
    
    def record_latency(self, operation: str, duration_ms: int):
        """Record request latency."""
        self.metrics_backend.histogram(
            'ai_request_duration_milliseconds',
            duration_ms,
            labels={'operation': operation}
        )
    
    def record_tokens(self, operation: str, tokens: int, token_type: str):
        """Record token usage."""
        self.metrics_backend.counter(
            'ai_tokens_used_total',
            tokens,
            labels={'operation': operation, 'token_type': token_type}
        )
    
    def record_cost(self, operation: str, cost: Decimal):
        """Record AI cost."""
        self.metrics_backend.counter(
            'ai_cost_usd_total',
            float(cost),
            labels={'operation': operation}
        )
    
    def increment_cache_hits(self, operation: str):
        """Increment cache hit counter."""
        self.metrics_backend.increment(
            'ai_cache_hits_total',
            labels={'operation': operation}
        )
    
    def increment_rate_limits(self, limit_type: str):
        """Increment rate limit counter."""
        self.metrics_backend.increment(
            'ai_rate_limits_total',
            labels={'limit_type': limit_type}
        )


# ============================================================================
# METRICS BACKENDS
# ============================================================================

class InMemoryMetrics:
    """In-memory metrics storage (for development)."""
    
    def __init__(self):
        self.counters = {}
        self.histograms = {}
    
    def increment(self, name: str, labels: Dict[str, str] = None):
        """Increment a counter."""
        key = f"{name}_{labels}" if labels else name
        self.counters[key] = self.counters.get(key, 0) + 1
    
    def counter(self, name: str, value: float, labels: Dict[str, str] = None):
        """Add to a counter."""
        key = f"{name}_{labels}" if labels else name
        self.counters[key] = self.counters.get(key, 0) + value
    
    def histogram(self, name: str, value: float, labels: Dict[str, str] = None):
        """Record a histogram value."""
        key = f"{name}_{labels}" if labels else name
        if key not in self.histograms:
            self.histograms[key] = []
        self.histograms[key].append(value)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get all metrics (for debugging)."""
        return {
            'counters': self.counters,
            'histograms': {
                k: {
                    'count': len(v),
                    'sum': sum(v),
                    'avg': sum(v) / len(v) if v else 0,
                    'min': min(v) if v else 0,
                    'max': max(v) if v else 0,
                }
                for k, v in self.histograms.items()
            }
        }


class PrometheusMetrics:
    """Prometheus metrics backend."""
    
    def __init__(self):
        try:
            from prometheus_client import Counter, Histogram
            self.Counter = Counter
            self.Histogram = Histogram
            self._setup_metrics()
        except ImportError:
            logger.warning("prometheus_client not installed, falling back to in-memory metrics")
            self.fallback = InMemoryMetrics()
    
    def _setup_metrics(self):
        """Setup Prometheus metric objects."""
        self.requests_counter = self.Counter(
            'ai_requests_total',
            'Total AI requests',
            ['operation', 'provider']
        )
        self.errors_counter = self.Counter(
            'ai_errors_total',
            'Total AI errors',
            ['operation', 'error_type']
        )
        self.latency_histogram = self.Histogram(
            'ai_request_duration_milliseconds',
            'AI request duration',
            ['operation']
        )
        self.tokens_counter = self.Counter(
            'ai_tokens_used_total',
            'Total tokens used',
            ['operation', 'token_type']
        )
        self.cost_counter = self.Counter(
            'ai_cost_usd_total',
            'Total AI cost in USD',
            ['operation']
        )
    
    def increment(self, name: str, labels: Dict[str, str] = None):
        """Increment a counter."""
        if hasattr(self, 'fallback'):
            return self.fallback.increment(name, labels)
        
        if 'requests_total' in name:
            self.requests_counter.labels(**labels).inc()
        elif 'errors_total' in name:
            self.errors_counter.labels(**labels).inc()
    
    def counter(self, name: str, value: float, labels: Dict[str, str] = None):
        """Add to a counter."""
        if hasattr(self, 'fallback'):
            return self.fallback.counter(name, value, labels)
        
        if 'tokens_used' in name:
            self.tokens_counter.labels(**labels).inc(value)
        elif 'cost_usd' in name:
            self.cost_counter.labels(**labels).inc(value)
    
    def histogram(self, name: str, value: float, labels: Dict[str, str] = None):
        """Record a histogram value."""
        if hasattr(self, 'fallback'):
            return self.fallback.histogram(name, value, labels)
        
        if 'duration' in name:
            self.latency_histogram.labels(**labels).observe(value)


class StatsDMetrics:
    """StatsD metrics backend."""
    
    def __init__(self):
        try:
            from statsd import StatsClient
            host = getattr(settings, 'STATSD_HOST', 'localhost')
            port = getattr(settings, 'STATSD_PORT', 8125)
            self.client = StatsClient(host, port, prefix='ai_engine')
        except ImportError:
            logger.warning("statsd not installed, falling back to in-memory metrics")
            self.fallback = InMemoryMetrics()
    
    def increment(self, name: str, labels: Dict[str, str] = None):
        """Increment a counter."""
        if hasattr(self, 'fallback'):
            return self.fallback.increment(name, labels)
        
        metric_name = f"{name}.{'.'.join(labels.values())}" if labels else name
        self.client.incr(metric_name)
    
    def counter(self, name: str, value: float, labels: Dict[str, str] = None):
        """Add to a counter."""
        if hasattr(self, 'fallback'):
            return self.fallback.counter(name, value, labels)
        
        metric_name = f"{name}.{'.'.join(labels.values())}" if labels else name
        self.client.incr(metric_name, value)
    
    def histogram(self, name: str, value: float, labels: Dict[str, str] = None):
        """Record a histogram value."""
        if hasattr(self, 'fallback'):
            return self.fallback.histogram(name, value, labels)
        
        metric_name = f"{name}.{'.'.join(labels.values())}" if labels else name
        self.client.timing(metric_name, value)


# ============================================================================
# SENTRY INTEGRATION
# ============================================================================

class SentryIntegration:
    """Integration with Sentry for error tracking."""
    
    @staticmethod
    def capture_ai_error(
        error: Exception,
        context: Dict[str, Any]
    ):
        """
        Capture AI error in Sentry with context.
        
        Args:
            error: The exception
            context: Additional context (request_id, user, operation, etc.)
        """
        try:
            import sentry_sdk
            
            with sentry_sdk.push_scope() as scope:
                # Add AI-specific tags
                scope.set_tag('ai_operation', context.get('operation', 'unknown'))
                scope.set_tag('ai_provider', context.get('provider', 'unknown'))
                
                # Add context
                scope.set_context('ai_request', {
                    'request_id': context.get('request_id'),
                    'user_id': context.get('user_id'),
                    'operation': context.get('operation'),
                    'provider': context.get('provider'),
                    'model': context.get('model'),
                })
                
                # Capture exception
                sentry_sdk.capture_exception(error)
                
        except ImportError:
            logger.warning("Sentry SDK not installed, error not captured")
        except Exception as e:
            logger.error(f"Failed to capture error in Sentry: {e}")


# ============================================================================
# MONITORING DECORATOR
# ============================================================================

def monitor_ai_operation(operation_name: str):
    """
    Decorator to automatically monitor AI operations.
    
    Usage:
        @monitor_ai_operation('tender_analysis')
        def analyze_tender(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            request_id = kwargs.get('request_id', 'unknown')
            
            # Log start
            ai_logger.log_request(
                request_id=request_id,
                user_id=kwargs.get('user_id', 'unknown'),
                operation=operation_name
            )
            
            # Increment request counter
            ai_metrics.increment_requests(
                operation=operation_name,
                provider=kwargs.get('provider', 'unknown')
            )
            
            try:
                # Execute function
                result = func(*args, **kwargs)
                
                # Calculate duration
                duration_ms = int((time.time() - start_time) * 1000)
                
                # Log success
                ai_logger.log_response(
                    request_id=request_id,
                    operation=operation_name,
                    tokens_used=result.get('tokens_used', 0),
                    cost=result.get('cost', Decimal('0')),
                    duration_ms=duration_ms,
                    success=True
                )
                
                # Record metrics
                ai_metrics.record_latency(operation_name, duration_ms)
                ai_metrics.record_tokens(
                    operation_name,
                    result.get('tokens_used', 0),
                    'total'
                )
                ai_metrics.record_cost(
                    operation_name,
                    result.get('cost', Decimal('0'))
                )
                
                return result
                
            except Exception as e:
                # Calculate duration
                duration_ms = int((time.time() - start_time) * 1000)
                
                # Log error
                ai_logger.log_error(
                    request_id=request_id,
                    operation=operation_name,
                    error_type=type(e).__name__,
                    error_message=str(e)
                )
                
                # Increment error counter
                ai_metrics.increment_errors(
                    operation=operation_name,
                    error_type=type(e).__name__
                )
                
                # Capture in Sentry
                SentryIntegration.capture_ai_error(e, {
                    'request_id': request_id,
                    'operation': operation_name,
                    **kwargs
                })
                
                raise
        
        return wrapper
    return decorator


# ============================================================================
# GLOBAL INSTANCES
# ============================================================================

# Singleton instances for easy import
ai_logger = AILogger()
ai_metrics = AIMetrics()
sentry = SentryIntegration()


# ============================================================================
# HEALTH CHECK
# ============================================================================

def get_health_metrics() -> Dict[str, Any]:
    """
    Get health metrics for monitoring dashboards.
    
    Returns:
        Dict with health information
    """
    from apps.ai_engine.models import AIRequest, AIRequestStatus
    from django.utils import timezone
    from datetime import timedelta
    
    now = timezone.now()
    last_hour = now - timedelta(hours=1)
    last_day = now - timedelta(days=1)
    
    # Recent requests
    recent_requests = AIRequest.objects.filter(created_at__gte=last_hour)
    total_recent = recent_requests.count()
    failed_recent = recent_requests.filter(status=AIRequestStatus.FAILED).count()
    
    # Success rate
    success_rate = ((total_recent - failed_recent) / total_recent * 100) if total_recent > 0 else 100
    
    # Average latency (from last 24 hours)
    from django.db.models import Avg
    avg_latency = AIRequest.objects.filter(
        created_at__gte=last_day,
        status=AIRequestStatus.COMPLETED
    ).aggregate(
        avg=Avg('response__total_tokens')
    )['avg'] or 0
    
    return {
        'status': 'healthy' if success_rate > 90 else 'degraded',
        'last_hour': {
            'total_requests': total_recent,
            'failed_requests': failed_recent,
            'success_rate': round(success_rate, 2),
        },
        'performance': {
            'avg_latency_ms': round(avg_latency, 2),
        },
        'timestamp': now.isoformat(),
    }
