"""
AI Provider Factory

This module implements the Factory pattern for creating AI provider instances.
It allows the application to switch between different AI providers easily
through configuration.
"""

import logging
from typing import Optional, Dict, Type
from django.conf import settings

from .base import AIProvider, AIProviderType
from .openai_provider import OpenAIProvider
from .gemini_provider import GeminiProvider
from ..exceptions import AIProviderError

logger = logging.getLogger(__name__)


class AIProviderFactory:
    """
    Factory for creating AI provider instances.
    
    This factory:
    1. Reads configuration from Django settings
    2. Creates appropriate provider instances
    3. Supports provider registration for extensibility
    4. Caches provider instances for reuse
    """
    
    # Registry of available providers
    _providers: Dict[str, Type[AIProvider]] = {
        AIProviderType.OPENAI.value: OpenAIProvider,
        AIProviderType.GEMINI.value: GeminiProvider,
        # Add more providers here as they are implemented:
        # AIProviderType.ANTHROPIC.value: AnthropicProvider,
    }
    
    # Cache for provider instances
    _instances: Dict[str, AIProvider] = {}
    
    @classmethod
    def register_provider(
        cls,
        provider_type: str,
        provider_class: Type[AIProvider]
    ) -> None:
        """
        Register a new provider type.
        
        Args:
            provider_type: String identifier for the provider
            provider_class: The provider class to register
        """
        cls._providers[provider_type] = provider_class
        logger.info(f"Registered AI provider: {provider_type}")
    
    @classmethod
    def get_provider(
        cls,
        provider_type: Optional[str] = None,
        use_cache: bool = True,
        **kwargs
    ) -> AIProvider:
        """
        Get an AI provider instance.
        
        Args:
            provider_type: Type of provider ('openai', 'anthropic', etc.)
                          Uses AI_DEFAULT_PROVIDER from settings if not specified.
            use_cache: Whether to use cached instance
            **kwargs: Additional arguments to pass to the provider constructor
            
        Returns:
            An AIProvider instance
            
        Raises:
            AIProviderError: If provider type is unknown or configuration is missing
        """
        # Get provider type from settings if not specified
        if provider_type is None:
            provider_type = getattr(settings, 'AI_DEFAULT_PROVIDER', 'openai')
        
        # Check cache
        cache_key = f"{provider_type}:{hash(frozenset(kwargs.items()))}"
        if use_cache and cache_key in cls._instances:
            return cls._instances[cache_key]
        
        # Validate provider type
        if provider_type not in cls._providers:
            available = ", ".join(cls._providers.keys())
            raise AIProviderError(
                message=f"Unknown provider type: {provider_type}. Available: {available}",
                provider=provider_type,
            )
        
        # Get provider class
        provider_class = cls._providers[provider_type]
        
        # Get configuration for this provider
        provider_config = cls._get_provider_config(provider_type)
        provider_config.update(kwargs)
        
        try:
            # Create provider instance
            provider = provider_class(**provider_config)
            
            # Cache the instance
            if use_cache:
                cls._instances[cache_key] = provider
            
            logger.info(f"Created AI provider instance: {provider_type}")
            return provider
            
        except Exception as e:
            logger.exception(f"Failed to create provider {provider_type}: {e}")
            raise AIProviderError(
                message=f"Failed to create provider {provider_type}: {str(e)}",
                provider=provider_type,
            ) from e
    
    @classmethod
    def _get_provider_config(cls, provider_type: str) -> Dict:
        """
        Get configuration for a specific provider from Django settings.
        
        Args:
            provider_type: The provider type
            
        Returns:
            Configuration dictionary
        """
        # Get AI settings from Django settings
        ai_settings = getattr(settings, 'AI_PROVIDERS', {})
        provider_settings = ai_settings.get(provider_type, {})
        
        # Build configuration based on provider type
        if provider_type == AIProviderType.OPENAI.value:
            return {
                'api_key': provider_settings.get(
                    'api_key',
                    getattr(settings, 'OPENAI_API_KEY', '')
                ),
                'default_model': provider_settings.get(
                    'default_model',
                    getattr(settings, 'AI_DEFAULT_MODEL', 'gpt-4o-mini')
                ),
                'organization_id': provider_settings.get('organization_id'),
                'timeout': provider_settings.get('timeout', 60.0),
            }
        
        # Add more provider configurations as needed
        # elif provider_type == AIProviderType.ANTHROPIC.value:
        #     return {...}
        
        return provider_settings
    
    @classmethod
    def clear_cache(cls) -> None:
        """Clear the provider instance cache."""
        cls._instances.clear()
        logger.info("Cleared AI provider cache")
    
    @classmethod
    def get_available_providers(cls) -> list:
        """Get list of available provider types."""
        return list(cls._providers.keys())


# Convenience function for quick access
def get_ai_provider(provider_type: Optional[str] = None, **kwargs) -> AIProvider:
    """
    Convenience function to get an AI provider.
    
    Args:
        provider_type: Provider type (uses default from settings if not specified)
        **kwargs: Additional provider configuration
        
    Returns:
        An AIProvider instance
    """
    return AIProviderFactory.get_provider(provider_type, **kwargs)
