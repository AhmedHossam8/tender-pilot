from django.conf import settings
from .factory import AIProviderFactory

def get_ai_provider(provider_name=None):
    """
    Returns an AI provider instance using the factory.
    
    Args:
        provider_name: Optional provider name ('gemini', 'openai', etc.)
                      Uses AI_DEFAULT_PROVIDER from settings if not specified.
    
    Returns:
        An AIProvider instance
    """
    return AIProviderFactory.get_provider(provider_type=provider_name)