"""
AI Fallback Handler

Implements fallback strategies for handling AI failures gracefully.
This ensures the application remains functional even when AI services
are unavailable or experiencing issues.
"""

import logging
import time
from typing import Optional, Callable, Any, Dict, List
from functools import wraps
from django.core.cache import cache
from django.conf import settings

from .base import AIProvider, AIResponse, AIGenerationConfig
from ..exceptions import (
    AIProviderError,
    AIRateLimitError,
    AITimeoutError,
    AIUnavailableError,
)

logger = logging.getLogger(__name__)


class RetryConfig:
    """Configuration for retry behavior."""
    
    def __init__(
        self,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
    ):
        self.max_retries = max_retries
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
    
    def get_delay(self, attempt: int) -> float:
        """Calculate delay for a given attempt number."""
        delay = self.initial_delay * (self.exponential_base ** attempt)
        delay = min(delay, self.max_delay)
        
        if self.jitter:
            import random
            delay = delay * (0.5 + random.random())
        
        return delay


class AIFallbackHandler:
    """
    Handles AI failures with various fallback strategies.
    
    Strategies:
    1. Retry with exponential backoff
    2. Switch to backup provider
    3. Return cached response
    4. Return graceful degradation message
    """
    
    def __init__(
        self,
        primary_provider: AIProvider,
        backup_provider: Optional[AIProvider] = None,
        retry_config: Optional[RetryConfig] = None,
        cache_ttl: int = 3600,  # 1 hour
    ):
        self.primary = primary_provider
        self.backup = backup_provider
        self.retry_config = retry_config or RetryConfig()
        self.cache_ttl = cache_ttl
    
    def execute_with_fallback(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[AIGenerationConfig] = None,
        use_cache: bool = True,
        cache_key: Optional[str] = None,
        **kwargs
    ) -> AIResponse:
        """
        Execute AI request with fallback handling.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            config: Generation configuration
            use_cache: Whether to use caching
            cache_key: Custom cache key
            **kwargs: Additional arguments
            
        Returns:
            AIResponse from primary, backup, or cache
            
        Raises:
            AIProviderError: If all fallback attempts fail
        """
        # Check cache first
        if use_cache and cache_key:
            cached = self._get_from_cache(cache_key)
            if cached:
                logger.info(f"Returning cached response for key: {cache_key}")
                return cached
        
        # Try primary provider with retries
        try:
            response = self._try_with_retries(
                self.primary,
                prompt,
                system_prompt,
                config,
                **kwargs
            )
            
            # Cache successful response
            if use_cache and cache_key:
                self._save_to_cache(cache_key, response)
            
            return response
            
        except AIProviderError as primary_error:
            logger.warning(f"Primary provider failed: {primary_error}")
            
            # Try backup provider
            if self.backup:
                try:
                    logger.info("Attempting backup provider")
                    response = self._try_with_retries(
                        self.backup,
                        prompt,
                        system_prompt,
                        config,
                        **kwargs
                    )
                    
                    # Cache successful response
                    if use_cache and cache_key:
                        self._save_to_cache(cache_key, response)
                    
                    return response
                    
                except AIProviderError as backup_error:
                    logger.warning(f"Backup provider also failed: {backup_error}")
            
            # Try to return stale cache
            if use_cache and cache_key:
                stale = self._get_from_cache(cache_key, allow_stale=True)
                if stale:
                    logger.info("Returning stale cached response")
                    return stale
            
            # All fallbacks failed
            raise AIProviderError(
                message="All AI providers and fallbacks failed",
                provider="fallback",
                details={
                    "primary_error": str(primary_error),
                },
            )
    
    def _try_with_retries(
        self,
        provider: AIProvider,
        prompt: str,
        system_prompt: Optional[str],
        config: Optional[AIGenerationConfig],
        **kwargs
    ) -> AIResponse:
        """Try to get response with retries."""
        last_error = None
        
        for attempt in range(self.retry_config.max_retries + 1):
            try:
                return provider.generate(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    config=config,
                    **kwargs
                )
                
            except AIRateLimitError as e:
                last_error = e
                # Use retry_after from error if available
                delay = e.retry_after or self.retry_config.get_delay(attempt)
                logger.warning(
                    f"Rate limit hit, retry {attempt + 1}/{self.retry_config.max_retries}, "
                    f"waiting {delay:.2f}s"
                )
                time.sleep(delay)
                
            except AITimeoutError as e:
                last_error = e
                delay = self.retry_config.get_delay(attempt)
                logger.warning(
                    f"Timeout, retry {attempt + 1}/{self.retry_config.max_retries}, "
                    f"waiting {delay:.2f}s"
                )
                time.sleep(delay)
                
            except AIProviderError as e:
                # Don't retry non-retryable errors
                raise e
        
        # All retries exhausted
        raise last_error or AIProviderError(
            message="Max retries exceeded",
            provider=provider.__class__.__name__,
        )
    
    def _get_from_cache(
        self,
        key: str,
        allow_stale: bool = False
    ) -> Optional[AIResponse]:
        """Get response from cache."""
        cache_key = f"ai_response:{key}"
        
        try:
            data = cache.get(cache_key)
            if data:
                return AIResponse(**data)
        except Exception as e:
            logger.warning(f"Cache retrieval failed: {e}")
        
        return None
    
    def _save_to_cache(self, key: str, response: AIResponse) -> None:
        """Save response to cache."""
        cache_key = f"ai_response:{key}"
        
        try:
            data = {
                'content': response.content,
                'model': response.model,
                'input_tokens': response.input_tokens,
                'output_tokens': response.output_tokens,
                'total_tokens': response.total_tokens,
                'finish_reason': response.finish_reason,
            }
            cache.set(cache_key, data, self.cache_ttl)
        except Exception as e:
            logger.warning(f"Cache save failed: {e}")


def with_retry(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    exponential_base: float = 2.0,
    retryable_exceptions: tuple = (AIRateLimitError, AITimeoutError),
):
    """
    Decorator for retrying AI operations.
    
    Usage:
        @with_retry(max_retries=3)
        def call_ai(prompt):
            return provider.generate(prompt)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            retry_config = RetryConfig(
                max_retries=max_retries,
                initial_delay=initial_delay,
                exponential_base=exponential_base,
            )
            
            last_error = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_error = e
                    if attempt < max_retries:
                        delay = retry_config.get_delay(attempt)
                        logger.warning(
                            f"{func.__name__} failed, retry {attempt + 1}/{max_retries}, "
                            f"waiting {delay:.2f}s"
                        )
                        time.sleep(delay)
            
            raise last_error
        
        return wrapper
    return decorator


class GracefulDegradation:
    """
    Provides graceful degradation responses when AI is unavailable.
    
    Returns template-based responses that indicate AI is temporarily
    unavailable while still providing some value to users.
    """
    
    @staticmethod
    def get_degraded_response(
        feature: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Get a degraded response for a feature.
        
        Args:
            feature: The AI feature that's unavailable
            context: Additional context for the response
            
        Returns:
            Dictionary with degraded response
        """
        responses = {
            'tender_analysis': {
                'status': 'degraded',
                'message': 'AI analysis is temporarily unavailable. Please try again later.',
                'summary': 'Unable to generate AI summary at this time.',
                'key_requirements': [],
                'recommended_actions': [
                    {
                        'action': 'Manually review the tender document',
                        'priority': 'high',
                        'reason': 'AI analysis unavailable',
                    }
                ],
            },
            'compliance_check': {
                'status': 'degraded',
                'message': 'AI compliance check is temporarily unavailable.',
                'compliance_score': None,
                'gaps': [],
                'recommendations': [
                    'Please manually review requirements against your proposal.',
                ],
            },
            'proposal_outline': {
                'status': 'degraded',
                'message': 'AI proposal outline generation is temporarily unavailable.',
                'sections': [],
                'suggestion': 'Use a standard proposal template as a starting point.',
            },
        }
        
        response = responses.get(feature, {
            'status': 'degraded',
            'message': 'AI service is temporarily unavailable.',
        })
        
        if context:
            response['context'] = context
        
        return response
