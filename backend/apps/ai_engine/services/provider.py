from django.conf import settings
from .openai_provider import OpenAIProvider

def get_ai_provider():
    """
    Returns an OpenAIProvider instance using the API key from settings.
    """
    api_key = getattr(settings, "OPENAI_API_KEY", None)
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set in Django settings")
    
    return OpenAIProvider(api_key=api_key)