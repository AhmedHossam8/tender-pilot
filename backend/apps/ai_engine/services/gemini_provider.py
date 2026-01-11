"""
Google Gemini Provider Implementation

This module implements the AIProvider interface for Google's Gemini API,
supporting Gemini Pro, Gemini Pro Vision, and other Gemini models.
Uses the google-genai SDK (v0.8.0+).
"""

import logging
from typing import Optional, Dict, Any, List

from google import genai
from google.genai import types

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


# Gemini model pricing per 1K tokens (as of late 2024)
GEMINI_PRICING = {
    "gemini-2.5-flash": {"input": 0.0, "output": 0.0},  # Free tier
    "gemini-2.5-flash-preview-05-20": {"input": 0.0, "output": 0.0},  # Free tier
    "gemini-1.5-pro": {"input": 0.00125, "output": 0.005},
    "gemini-1.5-pro-latest": {"input": 0.00125, "output": 0.005},
    "gemini-1.5-flash": {"input": 0.000075, "output": 0.0003},
    "gemini-1.5-flash-latest": {"input": 0.000075, "output": 0.0003},
    "gemini-1.0-pro": {"input": 0.0005, "output": 0.0015},
    "gemini-pro": {"input": 0.0005, "output": 0.0015},
    # Add more models as needed
}

# Model context windows
GEMINI_CONTEXT_WINDOWS = {
    "gemini-2.5-flash": 1000000,  # 1M tokens
    "gemini-2.5-flash-preview-05-20": 1000000,
    "gemini-1.5-pro": 1000000,  # 1M tokens
    "gemini-1.5-pro-latest": 1000000,
    "gemini-1.5-flash": 1000000,
    "gemini-1.5-flash-latest": 1000000,
    "gemini-1.0-pro": 32000,
    "gemini-pro": 32000,
}


class GeminiProvider(AIProvider):
    """
    Google Gemini API provider implementation.
    
    Supports Gemini Pro and Gemini Flash models.
    Includes token estimation, cost estimation, and comprehensive error handling.
    Uses the google-genai SDK (v0.8.0+).
    """
    
    provider_type = AIProviderType.GEMINI
    
    def __init__(
        self,
        api_key: str,
        default_model: str = "gemini-1.5-flash",
        timeout: float = 60.0,
    ):
        """
        Initialize Gemini provider.
        
        Args:
            api_key: Google AI API key
            default_model: Default model to use
            timeout: Request timeout in seconds
        """
        super().__init__(api_key, default_model)
        self.timeout = timeout
        
        # Create the client
        self.client = genai.Client(api_key=api_key)
    
    
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        config: Optional[AIGenerationConfig] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> AIResponse:
        """
        Generate a response from Gemini.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt for context
            model: Model to use (defaults to default_model)
            config: Generation configuration
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            **kwargs: Additional arguments
            
        Returns:
            AIResponse with the generated content
        """
        model_name = model or self.default_model
        
        try:
            # Build the generation config
            gen_config = {
                "temperature": temperature if temperature is not None else (config.temperature if config else 0.7),
                "max_output_tokens": max_tokens or (config.max_tokens if config else 2000),
                "top_p": config.top_p if config else 1.0,
            }
            
            # Combine system prompt with user prompt if provided
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Generate response using the new SDK
            response = self.client.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(**gen_config)
            )
            
            # Extract text from response
            content_text = response.text if hasattr(response, 'text') else ""
            
            # Extract token counts if available
            input_tokens = 0
            output_tokens = 0
            
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = response.usage_metadata
                input_tokens = getattr(usage, 'prompt_token_count', 0)
                output_tokens = getattr(usage, 'candidates_token_count', 0)
            else:
                # Estimate tokens if not provided
                input_tokens = self.count_tokens(full_prompt, model_name)
                output_tokens = self.count_tokens(content_text, model_name) if content_text else 0
            
            # Get finish reason
            finish_reason = "stop"
            if hasattr(response, 'candidates') and response.candidates:
                if hasattr(response.candidates[0], 'finish_reason'):
                    finish_reason = str(response.candidates[0].finish_reason).lower()
            
            return AIResponse(
                content=content_text,
                model=model_name,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
                finish_reason=finish_reason,
                raw_response={"text": content_text, "model": model_name},
            )
            
        except Exception as e:
            error_msg = str(e).lower()
            
            # Handle rate limits
            if 'rate limit' in error_msg or 'quota' in error_msg or 'resource_exhausted' in error_msg:
                logger.warning(f"Gemini rate limit: {e}")
                raise AIRateLimitError(
                    message="Google API rate limit exceeded",
                    provider="gemini",
                    retry_after=60,
                )
            
            # Handle authentication errors
            if 'authentication' in error_msg or 'api key' in error_msg or 'permission' in error_msg:
                logger.error(f"Gemini authentication error: {e}")
                raise AIAuthenticationError(
                    message="Invalid Google API key",
                    provider="gemini",
                )
            
            # Handle timeout errors
            if 'timeout' in error_msg or 'deadline' in error_msg:
                logger.warning(f"Gemini timeout: {e}")
                raise AITimeoutError(
                    message="Request timed out",
                    provider="gemini",
                    timeout=self.timeout,
                )
            
            # Generic error
            logger.error(f"Gemini error: {e}")
            raise AIProviderError(
                message=f"Gemini API error: {str(e)}",
                provider="gemini",
            )
    
    async def generate_async(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        config: Optional[AIGenerationConfig] = None,
        **kwargs
    ) -> AIResponse:
        """
        Generate a response asynchronously.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            model: Model to use
            config: Generation configuration
            **kwargs: Additional arguments
            
        Returns:
            AIResponse with the generated content
        """
        model_name = model or self.default_model
        
        try:
            gemini_model = self._get_model(model_name)
            
            # Build the generation config
            generation_config = GenerationConfig(
                temperature=config.temperature if config else 0.7,
                max_output_tokens=config.max_tokens if config else 2000,
                top_p=config.top_p if config else 1.0,
            )
            
            # Combine system prompt with user prompt if provided
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Generate response asynchronously
            response = await gemini_model.generate_content_async(
                full_prompt,
                generation_config=generation_config,
            )
            
            # Extract token counts
            input_tokens = 0
            output_tokens = 0
            
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                input_tokens = getattr(response.usage_metadata, 'prompt_token_count', 0)
                output_tokens = getattr(response.usage_metadata, 'candidates_token_count', 0)
            else:
                input_tokens = self.count_tokens(full_prompt, model_name)
                output_tokens = self.count_tokens(response.text, model_name) if response.text else 0
            
            finish_reason = "stop"
            if response.candidates and response.candidates[0].finish_reason:
                finish_reason = str(response.candidates[0].finish_reason.name).lower()
            
            return AIResponse(
                content=response.text or "",
                model=model_name,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
                finish_reason=finish_reason,
                raw_response={"text": response.text, "model": model_name},
            )
            
        except Exception as e:
            logger.error(f"Gemini async error: {e}")
            raise AIProviderError(
                message=f"Gemini API error: {str(e)}",
                provider="gemini",
            )
    
    def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        config: Optional[AIGenerationConfig] = None,
        **kwargs
    ):
        """
        Generate a streaming response from Gemini.
        
        Args:
            prompt: The user prompt
            system_prompt: Optional system prompt
            model: Model to use
            config: Generation configuration
            **kwargs: Additional arguments
            
        Yields:
            Chunks of the response content
        """
        model_name = model or self.default_model
        
        try:
            gemini_model = self._get_model(model_name)
            
            generation_config = GenerationConfig(
                temperature=config.temperature if config else 0.7,
                max_output_tokens=config.max_tokens if config else 2000,
                top_p=config.top_p if config else 1.0,
            )
            
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            response = gemini_model.generate_content(
                full_prompt,
                generation_config=generation_config,
                stream=True,
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Gemini streaming error: {e}")
            raise AIProviderError(
                message=f"Gemini streaming error: {str(e)}",
                provider="gemini",
            )
    
    def count_tokens(self, text: str, model: Optional[str] = None) -> int:
        """
        Count tokens in text.
        
        Gemini uses a different tokenizer, so we use an approximation
        or the model's count_tokens method.
        
        Args:
            text: Text to count tokens for
            model: Model to use for counting
            
        Returns:
            Approximate token count
        """
        model_name = model or self.default_model
        
        try:
            gemini_model = self._get_model(model_name)
            result = gemini_model.count_tokens(text)
            return result.total_tokens
        except Exception:
            # Fallback: approximate 4 characters per token
            return len(text) // 4
    
    def estimate_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        model: Optional[str] = None
    ) -> float:
        """
        Estimate the cost of a request.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model to use for pricing
            
        Returns:
            Estimated cost in USD
        """
        model_name = model or self.default_model
        
        # Get pricing for the model
        pricing = GEMINI_PRICING.get(
            model_name,
            GEMINI_PRICING.get("gemini-1.5-flash", {"input": 0.000075, "output": 0.0003})
        )
        
        input_cost = (input_tokens / 1000) * pricing["input"]
        output_cost = (output_tokens / 1000) * pricing["output"]
        
        return input_cost + output_cost
    
    def get_model_context_window(self, model: Optional[str] = None) -> int:
        """
        Get the context window size for a model.
        
        Args:
            model: Model name
            
        Returns:
            Context window size in tokens
        """
        model_name = model or self.default_model
        return GEMINI_CONTEXT_WINDOWS.get(model_name, 32000)
    
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
            **kwargs: Additional provider-specific parameters
            
        Returns:
            AIResponse with the generated content
        """
        model_name = kwargs.get('model') or self.default_model
        
        try:
            gemini_model = self._get_model(model_name)
            
            generation_config = GenerationConfig(
                temperature=config.temperature if config else 0.7,
                max_output_tokens=config.max_tokens if config else 2000,
                top_p=config.top_p if config else 1.0,
            )
            
            # Convert messages to Gemini format
            # Gemini uses a different chat format
            chat = gemini_model.start_chat(history=[])
            
            # Process system message if present
            system_prompt = ""
            for msg in messages:
                if msg.role == "system":
                    system_prompt = msg.content
                    break
            
            # Get the last user message
            last_user_message = ""
            for msg in reversed(messages):
                if msg.role == "user":
                    last_user_message = msg.content
                    break
            
            # Combine system prompt with user message
            full_prompt = last_user_message
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{last_user_message}"
            
            response = chat.send_message(
                full_prompt,
                generation_config=generation_config,
            )
            
            input_tokens = 0
            output_tokens = 0
            
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                input_tokens = getattr(response.usage_metadata, 'prompt_token_count', 0)
                output_tokens = getattr(response.usage_metadata, 'candidates_token_count', 0)
            else:
                input_tokens = self.count_tokens(full_prompt, model_name)
                output_tokens = self.count_tokens(response.text, model_name) if response.text else 0
            
            finish_reason = "stop"
            if response.candidates and response.candidates[0].finish_reason:
                finish_reason = str(response.candidates[0].finish_reason.name).lower()
            
            return AIResponse(
                content=response.text or "",
                model=model_name,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=input_tokens + output_tokens,
                finish_reason=finish_reason,
                raw_response={"text": response.text, "model": model_name},
            )
            
        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            raise AIProviderError(
                message=f"Gemini chat error: {str(e)}",
                provider="gemini",
            )
    
    def get_model_info(self, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Get information about a model.
        
        Args:
            model: Model name (uses default if not provided)
            
        Returns:
            Dictionary with model information
        """
        model_name = model or self.default_model
        
        return {
            "name": model_name,
            "provider": "gemini",
            "context_window": GEMINI_CONTEXT_WINDOWS.get(model_name, 32000),
            "pricing": GEMINI_PRICING.get(model_name, {"input": 0.000075, "output": 0.0003}),
            "supports_streaming": True,
            "supports_vision": "vision" in model_name.lower() or "1.5" in model_name,
        }
    
    def is_available(self) -> bool:
        """
        Check if the Gemini provider is available.
        
        Returns:
            True if the provider can be used
        """
        try:
            # Try to list models to verify the API key works
            models = genai.list_models()
            return any(m for m in models if 'gemini' in m.name.lower())
        except Exception as e:
            logger.warning(f"Gemini availability check failed: {e}")
            return False
    
    def get_available_models(self) -> List[str]:
        """
        Get list of available Gemini models.
        
        Returns:
            List of model names
        """
        try:
            models = genai.list_models()
            return [
                m.name.replace("models/", "")
                for m in models
                if 'generateContent' in [method.name for method in m.supported_generation_methods]
            ]
        except Exception:
            # Return default list if API call fails
            return list(GEMINI_PRICING.keys())
