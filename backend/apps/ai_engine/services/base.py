"""
AI Provider Base Class - Provider-Agnostic Abstraction

This module defines the abstract base class for all AI providers.
It ensures that any AI provider (OpenAI, Claude, etc.) implements
the required interface for consistency across the application.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from enum import Enum


class AIProviderType(Enum):
    """Supported AI provider types."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    # Add more providers as needed


@dataclass
class AIMessage:
    """Represents a message in a conversation."""
    role: str  # 'system', 'user', 'assistant'
    content: str


@dataclass
class AIResponse:
    """Standardized AI response structure."""
    content: str
    model: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    finish_reason: str
    raw_response: Optional[Dict[str, Any]] = None
    
    @property
    def total_cost(self) -> float:
        """Calculate cost based on token usage. Override in provider-specific implementations."""
        return 0.0


@dataclass
class AIGenerationConfig:
    """Configuration for AI text generation."""
    model: str
    temperature: float = 0.7
    max_tokens: int = 1500  # Reduced from 2000 for cost and speed
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    stop_sequences: Optional[List[str]] = None
    response_format: Optional[Dict[str, str]] = None  # For JSON mode


class AIProvider(ABC):
    """
    Abstract base class for AI providers.
    
    All AI provider implementations (OpenAI, Anthropic, etc.) must inherit
    from this class and implement all abstract methods.
    
    This ensures:
    1. Consistent interface across all providers
    2. Easy provider switching
    3. Testability through mock implementations
    """
    
    def __init__(self, api_key: str, default_model: str):
        """
        Initialize the AI provider.
        
        Args:
            api_key: API key for the provider
            default_model: Default model to use for generations
        """
        self.api_key = api_key
        self.default_model = default_model
        self._validate_api_key()
    
    def _validate_api_key(self) -> None:
        """Validate that API key is provided."""
        if not self.api_key:
            raise ValueError(f"API key is required for {self.__class__.__name__}")
    
    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        config: Optional[AIGenerationConfig] = None,
        **kwargs
    ) -> AIResponse:
        """
        Generate a response from the AI model.
        
        Args:
            prompt: The user's prompt/question
            system_prompt: Optional system instructions
            config: Generation configuration (temperature, max_tokens, etc.)
            **kwargs: Additional provider-specific parameters
            
        Returns:
            AIResponse with the generated content and metadata
        """
        pass
    
    @abstractmethod
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
            AIResponse with the generated content and metadata
        """
        pass
    
    @abstractmethod
    def count_tokens(self, text: str, model: Optional[str] = None) -> int:
        """
        Count the number of tokens in the given text.
        
        Args:
            text: The text to count tokens for
            model: Optional model name (token counting can vary by model)
            
        Returns:
            Number of tokens
        """
        pass
    
    @abstractmethod
    def get_model_info(self, model: Optional[str] = None) -> Dict[str, Any]:
        """
        Get information about a model.
        
        Args:
            model: Model name (uses default if not provided)
            
        Returns:
            Dictionary with model information (context window, capabilities, etc.)
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """
        Check if the provider is available and API key is valid.
        
        Returns:
            True if provider is available, False otherwise
        """
        pass
    
    def get_default_config(self) -> AIGenerationConfig:
        """Get default generation configuration."""
        return AIGenerationConfig(model=self.default_model)
    
    def estimate_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        model: Optional[str] = None
    ) -> float:
        """
        Estimate the cost of a generation.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model name (uses default if not provided)
            
        Returns:
            Estimated cost in USD
        """
        # Override in specific provider implementations
        return 0.0

class AIService:
    def __init__(self):
        self.client = client

    def chat(self, prompt: str):
        response = self.client.chat.completions.create(
            model="gpt-5-nano",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content