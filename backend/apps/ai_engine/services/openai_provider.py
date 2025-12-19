"""
OpenAI Provider Implementation

This module implements the AIProvider interface for OpenAI's API,
supporting GPT-4, GPT-3.5-turbo, and other OpenAI models.
"""

import logging
from typing import Optional, Dict, Any, List

from openai import OpenAI, APIError, RateLimitError, APIConnectionError
import tiktoken

from .base import (
    AIProvider,
    AIResponse,
    AIMessage,
    AIGenerationConfig,
    AIProviderType,
)
from ..exceptions import (
    AIProviderError,
    AIRateLimitError,
    AITimeoutError,
    AIInvalidResponseError,
    AIAuthenticationError,
)

logger = logging.getLogger(__name__)


# OpenAI model pricing per 1K tokens (as of late 2024)
OPENAI_PRICING = {
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "gpt-3.5-turbo-16k": {"input": 0.003, "output": 0.004},
    # Add more models as needed
}

# Model context windows
OPENAI_CONTEXT_WINDOWS = {
    "gpt-4": 8192,
    "gpt-4-turbo": 128000,
    "gpt-4-turbo-preview": 128000,
    "gpt-4o": 128000,
    "gpt-4o-mini": 128000,
    "gpt-3.5-turbo": 4096,
    "gpt-3.5-turbo-16k": 16384,
}


class OpenAIProvider(AIProvider):
    """
    OpenAI API provider implementation.
    
    Supports all OpenAI chat completion models including GPT-4 and GPT-3.5-turbo.
    Includes token counting, cost estimation, and comprehensive error handling.
    """
    
    provider_type = AIProviderType.OPENAI
    
    def __init__(
        self,
        api_key: str,
        default_model: str = "gpt-4o-mini",
        organization_id: Optional[str] = None,
        timeout: float = 60.0,
    ):
        """
        Initialize OpenAI provider.
        
        Args:
            api_key: OpenAI API key
            default_model: Default model to use
            organization_id: Optional OpenAI organization ID
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, default_model)
        self.organization_id = organization_id
        self.timeout = timeout
        
        # Initialize OpenAI client
        self.client = OpenAI(
            api_key=api_key,
            organization=organization_id,
            timeout=timeout,
        )
        
        # Initialize tokenizer
        self._encoders: Dict[str, tiktoken.Encoding] = {}
    
    def _get_encoder(self, model: str) -> tiktoken.Encoding:
        """Get the appropriate tokenizer for the model."""
        if model not in self._encoders:
            try:
                self._encoders[model] = tiktoken.encoding_for_model(model)
            except KeyError:
                # Fallback to cl100k_base for newer models
                self._encoders[model] = tiktoken.get_encoding("cl100k_base")
        return self._encoders[model]
    
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[AIGenerationConfig] = None,
        **kwargs
    ) -> AIResponse:
        """
        Generate a response from OpenAI.
        
        Args:
            prompt: The user's prompt
            system_prompt: Optional system instructions
            config: Generation configuration
            **kwargs: Additional parameters
            
        Returns:
            AIResponse with generated content
        """
        messages = []
        
        if system_prompt:
            messages.append(AIMessage(role="system", content=system_prompt))
        
        messages.append(AIMessage(role="user", content=prompt))
        
        return self.generate_chat(messages, config, **kwargs)
    
    def generate_chat(
        self,
        messages: List[AIMessage],
        config: Optional[AIGenerationConfig] = None,
        **kwargs
    ) -> AIResponse:
        """
        Generate a response from a chat conversation.
        
        Args:
            messages: List of conversation messages
            config: Generation configuration
            **kwargs: Additional parameters
            
        Returns:
            AIResponse with generated content
        """
        if config is None:
            config = self.get_default_config()
        
        # Convert messages to OpenAI format
        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        try:
            # Build request parameters
            request_params = {
                "model": config.model or self.default_model,
                "messages": openai_messages,
                "temperature": config.temperature,
                "max_tokens": config.max_tokens,
                "top_p": config.top_p,
                "frequency_penalty": config.frequency_penalty,
                "presence_penalty": config.presence_penalty,
            }
            
            if config.stop_sequences:
                request_params["stop"] = config.stop_sequences
            
            if config.response_format:
                request_params["response_format"] = config.response_format
            
            # Add any extra kwargs
            request_params.update(kwargs)
            
            # Make API call
            response = self.client.chat.completions.create(**request_params)
            
            # Extract response data
            choice = response.choices[0]
            usage = response.usage
            
            return AIResponse(
                content=choice.message.content or "",
                model=response.model,
                input_tokens=usage.prompt_tokens,
                output_tokens=usage.completion_tokens,
                total_tokens=usage.total_tokens,
                finish_reason=choice.finish_reason,
                raw_response=response.model_dump(),
            )
            
        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise AIRateLimitError(
                message="OpenAI API rate limit exceeded. Please try again later.",
                provider="openai",
                retry_after=getattr(e, 'retry_after', 60),
            ) from e
            
        except APIConnectionError as e:
            logger.error(f"OpenAI connection error: {e}")
            raise AITimeoutError(
                message="Failed to connect to OpenAI API. Please check your internet connection.",
                provider="openai",
            ) from e
            
        except APIError as e:
            logger.error(f"OpenAI API error: {e}")
            if "authentication" in str(e).lower() or "api key" in str(e).lower():
                raise AIAuthenticationError(
                    message="Invalid OpenAI API key.",
                    provider="openai",
                ) from e
            raise AIProviderError(
                message=f"OpenAI API error: {str(e)}",
                provider="openai",
            ) from e
            
        except Exception as e:
            logger.exception(f"Unexpected error calling OpenAI: {e}")
            raise AIProviderError(
                message=f"Unexpected error: {str(e)}",
                provider="openai",
            ) from e
    
    def count_tokens(self, text: str, model: Optional[str] = None) -> int:
        """
        Count tokens in text using tiktoken.
        
        Args:
            text: Text to count tokens for
            model: Model name (uses default if not provided)
            
        Returns:
            Token count
        """
        model = model or self.default_model
        encoder = self._get_encoder(model)
        return len(encoder.encode(text))
    
    def get_model_info(self, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Get model information.
        
        Args:
            model: Model name (uses default if not provided)
            
        Returns:
            Dictionary with model info
        """
        model = model or self.default_model
        
        return {
            "name": model,
            "provider": "openai",
            "context_window": OPENAI_CONTEXT_WINDOWS.get(model, 4096),
            "pricing": OPENAI_PRICING.get(model, {"input": 0.0, "output": 0.0}),
            "supports_json_mode": model in ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
            "supports_vision": model in ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
        }
    
    def is_available(self) -> bool:
        """
        Check if OpenAI API is available.
        
        Returns:
            True if available, False otherwise
        """
        try:
            # Make a minimal API call to check availability
            self.client.models.list()
            return True
        except Exception as e:
            logger.warning(f"OpenAI API availability check failed: {e}")
            return False
    
    def estimate_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        model: Optional[str] = None
    ) -> float:
        """
        Estimate cost for token usage.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model name (uses default if not provided)
            
        Returns:
            Estimated cost in USD
        """
        model = model or self.default_model
        pricing = OPENAI_PRICING.get(model, {"input": 0.0, "output": 0.0})
        
        input_cost = (input_tokens / 1000) * pricing["input"]
        output_cost = (output_tokens / 1000) * pricing["output"]
        
        return round(input_cost + output_cost, 6)
