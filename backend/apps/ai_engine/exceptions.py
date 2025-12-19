"""
AI Engine Exceptions

Custom exceptions for AI-related errors. These provide
specific error types for different failure scenarios.
"""

from typing import Optional


class AIEngineError(Exception):
    """Base exception for all AI engine errors."""
    
    def __init__(
        self,
        message: str,
        provider: Optional[str] = None,
        details: Optional[dict] = None,
    ):
        self.message = message
        self.provider = provider
        self.details = details or {}
        super().__init__(message)
    
    def to_dict(self) -> dict:
        """Convert exception to dictionary for API responses."""
        return {
            "error_type": self.__class__.__name__,
            "message": self.message,
            "provider": self.provider,
            "details": self.details,
        }


class AIProviderError(AIEngineError):
    """
    General error from an AI provider.
    
    Used when the provider returns an error that doesn't
    fit into more specific categories.
    """
    pass


class AIAuthenticationError(AIEngineError):
    """
    Authentication error with AI provider.
    
    Raised when API key is invalid or missing.
    """
    pass


class AIRateLimitError(AIEngineError):
    """
    Rate limit exceeded error.
    
    Raised when too many requests are made to the AI provider.
    """
    
    def __init__(
        self,
        message: str,
        provider: Optional[str] = None,
        retry_after: Optional[int] = None,
        details: Optional[dict] = None,
    ):
        super().__init__(message, provider, details)
        self.retry_after = retry_after  # seconds to wait before retry
    
    def to_dict(self) -> dict:
        result = super().to_dict()
        result["retry_after"] = self.retry_after
        return result


class AITimeoutError(AIEngineError):
    """
    Timeout error.
    
    Raised when the AI provider takes too long to respond.
    """
    pass


class AIContentFilterError(AIEngineError):
    """
    Content filter error.
    
    Raised when content is blocked by the AI provider's
    safety filters.
    """
    
    def __init__(
        self,
        message: str,
        provider: Optional[str] = None,
        filter_type: Optional[str] = None,
        details: Optional[dict] = None,
    ):
        super().__init__(message, provider, details)
        self.filter_type = filter_type
    
    def to_dict(self) -> dict:
        result = super().to_dict()
        result["filter_type"] = self.filter_type
        return result


class AIInvalidResponseError(AIEngineError):
    """
    Invalid response error.
    
    Raised when the AI response cannot be parsed or
    doesn't match expected format.
    """
    
    def __init__(
        self,
        message: str,
        provider: Optional[str] = None,
        expected_format: Optional[str] = None,
        raw_response: Optional[str] = None,
        details: Optional[dict] = None,
    ):
        super().__init__(message, provider, details)
        self.expected_format = expected_format
        self.raw_response = raw_response


class AIContextLengthError(AIEngineError):
    """
    Context length exceeded error.
    
    Raised when input exceeds the model's context window.
    """
    
    def __init__(
        self,
        message: str,
        provider: Optional[str] = None,
        max_tokens: Optional[int] = None,
        actual_tokens: Optional[int] = None,
        details: Optional[dict] = None,
    ):
        super().__init__(message, provider, details)
        self.max_tokens = max_tokens
        self.actual_tokens = actual_tokens


class AIQuotaExceededError(AIEngineError):
    """
    Quota exceeded error.
    
    Raised when user's AI usage quota has been exceeded.
    """
    
    def __init__(
        self,
        message: str,
        provider: Optional[str] = None,
        quota_type: Optional[str] = None,  # 'requests', 'tokens', 'cost'
        limit: Optional[int] = None,
        used: Optional[int] = None,
        details: Optional[dict] = None,
    ):
        super().__init__(message, provider, details)
        self.quota_type = quota_type
        self.limit = limit
        self.used = used


class AIUnavailableError(AIEngineError):
    """
    AI service unavailable error.
    
    Raised when the AI service is temporarily unavailable.
    """
    pass


class AIModelNotFoundError(AIEngineError):
    """
    Model not found error.
    
    Raised when the requested model doesn't exist.
    """
    pass


class PromptError(AIEngineError):
    """
    Prompt-related error.
    
    Raised for errors related to prompt templates.
    """
    pass


class PromptNotFoundError(PromptError):
    """Prompt template not found."""
    pass


class PromptRenderError(PromptError):
    """Error rendering prompt template."""
    pass
