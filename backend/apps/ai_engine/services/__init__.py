"""
AI Engine Services Package

Provides AI provider implementations, factories, and fallback handling.
"""

from .base import (
    AIProvider,
    AIResponse,
    AIMessage,
    AIGenerationConfig,
    AIProviderType,
)
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider
from .factory import AIProviderFactory, get_ai_provider
from .fallback import (
    AIFallbackHandler,
    RetryConfig,
    GracefulDegradation,
    with_retry,
)
from .circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerConfig,
    CircuitState,
    CircuitOpenError,
    openai_circuit,
)

__all__ = [
    # Base classes
    'AIProvider',
    'AIResponse',
    'AIMessage',
    'AIGenerationConfig',
    'AIProviderType',
    # Providers
    'OpenAIProvider',
    'GeminiProvider',
    # Factory
    'AIProviderFactory',
    'get_ai_provider',
    # Fallback
    'AIFallbackHandler',
    'RetryConfig',
    'GracefulDegradation',
    'with_retry',
    # Circuit Breaker
    'CircuitBreaker',
    'CircuitBreakerConfig',
    'CircuitState',
    'CircuitOpenError',
    'openai_circuit',
]
