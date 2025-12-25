"""
AI Response Regeneration Service

This service handles regeneration and refinement of AI responses.
Users can request new versions of responses with feedback on how to improve them.

Features:
- Regenerate responses with user feedback
- Adjust generation parameters (temperature, etc.)
- Track regeneration history
- Prevent excessive regenerations
- Link child responses to parents

Architecture:
- Service layer handles business logic
- Tracks regeneration chains
- Enforces regeneration limits
- Preserves original responses

Example:
    service = AIRegenerationService()
    new_response = service.regenerate_response(
        response_id=uuid,
        user=request.user,
        feedback="Make it more concise",
        temperature=0.8
    )
"""

import logging
from typing import Dict, Any, Optional
from uuid import UUID
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from ..models import AIRequest, AIResponse, AIRequestStatus
from ..exceptions import AIProviderError, AIRateLimitError
from ..tracking.usage import AIUsageTracker
from .factory import get_ai_provider
from .confidence import AIConfidenceScorer

logger = logging.getLogger(__name__)


class AIRegenerationService:
    """
    Service for regenerating and refining AI responses.
    
    This service allows users to request improved versions of AI outputs
    by providing feedback on what to change or improve.
    """
    
    # Maximum regenerations per request (prevent abuse)
    MAX_REGENERATIONS = 5
    
    def __init__(self):
        """Initialize the regeneration service."""
        self.usage_tracker = AIUsageTracker()
        self.confidence_scorer = AIConfidenceScorer()
    
    def regenerate_response(
        self,
        response_id: UUID,
        user,
        feedback: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        style: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Regenerate an AI response with improvements.
        
        Args:
            response_id: UUID of the response to regenerate
            user: User requesting regeneration
            feedback: Optional feedback on what to improve
            temperature: Optional new temperature (higher = more creative)
            max_tokens: Optional new max token limit
            style: Optional style adjustment ('concise', 'detailed', 'formal', 'casual')
        
        Returns:
            Dict containing:
                - new_response_id: UUID of new response
                - content: New generated content
                - improvements: What was improved
                - confidence: Confidence in new response
                - parent_response_id: Original response ID
        
        Raises:
            ValidationError: If regeneration not allowed
            AIProviderError: If AI generation fails
        
        Example:
            result = service.regenerate_response(
                response_id=uuid.UUID('...'),
                user=request.user,
                feedback="Make it shorter and focus on key points",
                temperature=0.7,
                style='concise'
            )
        """
        logger.info(
            f"Regenerating response {response_id} for user {user.id}"
        )
        
        # Step 1: Validate and fetch original response
        original_response = self._get_original_response(response_id)
        self._validate_regeneration_allowed(original_response, user)
        
        # Step 2: Check regeneration count
        self._check_regeneration_limit(original_response)
        
        # Step 3: Build improved prompt
        modified_prompt = self._build_improved_prompt(
            original_request=original_response.request,
            feedback=feedback,
            style=style
        )
        
        # Step 4: Get generation parameters
        params = self._get_generation_params(
            original_response.request,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Step 5: Execute regeneration with tracking
        with transaction.atomic():
            result = self._execute_regeneration(
                original_response=original_response,
                user=user,
                modified_prompt=modified_prompt,
                params=params,
                feedback=feedback
            )
        
        logger.info(
            f"Successfully regenerated response. New ID: {result['new_response_id']}"
        )
        
        return result
    
    def _get_original_response(self, response_id: UUID) -> AIResponse:
        """
        Fetch the original response to regenerate.
        
        Args:
            response_id: UUID of response
        
        Returns:
            AIResponse object
        
        Raises:
            AIResponse.DoesNotExist: If response not found
        """
        try:
            return AIResponse.objects.select_related(
                'request',
                'request__user'
            ).get(id=response_id)
        except AIResponse.DoesNotExist:
            logger.error(f"Response {response_id} not found")
            raise ValidationError(f"Response {response_id} not found")
    
    def _validate_regeneration_allowed(
        self,
        response: AIResponse,
        user
    ) -> None:
        """
        Validate that user can regenerate this response.
        
        Args:
            response: AIResponse to regenerate
            user: User requesting regeneration
        
        Raises:
            ValidationError: If regeneration not allowed
        """
        # Check ownership (or admin)
        request_user = response.request.user
        user_role = str(user.role).upper()
        
        if user_role != 'ADMIN' and request_user != user:
            raise ValidationError(
                "You can only regenerate your own AI responses"
            )
        
        # Check if original request succeeded
        if response.request.status != AIRequestStatus.COMPLETED:
            raise ValidationError(
                "Can only regenerate completed responses"
            )
    
    def _check_regeneration_limit(self, response: AIResponse) -> None:
        """
        Check if regeneration limit has been reached.
        
        Args:
            response: Response to check
        
        Raises:
            ValidationError: If limit exceeded
        """
        # Count regenerations in the chain
        root_response = self._get_root_response(response)
        regeneration_count = root_response.regenerations.count()
        
        if regeneration_count >= self.MAX_REGENERATIONS:
            raise ValidationError(
                f"Maximum regeneration limit ({self.MAX_REGENERATIONS}) reached. "
                f"Please create a new analysis request."
            )
    
    def _get_root_response(self, response: AIResponse) -> AIResponse:
        """
        Get the root (original) response in a regeneration chain.
        
        Args:
            response: Any response in the chain
        
        Returns:
            The root response
        """
        current = response
        while current.parent_response is not None:
            current = current.parent_response
        return current
    
    def _build_improved_prompt(
        self,
        original_request: AIRequest,
        feedback: Optional[str],
        style: Optional[str]
    ) -> str:
        """
        Build an improved prompt based on feedback and style.
        
        Args:
            original_request: Original AIRequest
            feedback: User feedback
            style: Desired style
        
        Returns:
            Improved prompt string
        """
        # Start with original prompt
        base_prompt = original_request.user_prompt
        
        # Build improvement instructions
        improvements = []
        
        if feedback:
            improvements.append(f"User feedback: {feedback}")
        
        if style:
            style_instructions = {
                'concise': "Make the response more concise and to the point.",
                'detailed': "Provide more detailed explanation and examples.",
                'formal': "Use a formal, professional tone.",
                'casual': "Use a more casual, conversational tone.",
            }
            if style in style_instructions:
                improvements.append(style_instructions[style])
        
        # Combine original prompt with improvements
        if improvements:
            improved_prompt = (
                f"{base_prompt}\n\n"
                f"IMPROVEMENTS REQUESTED:\n"
                + "\n".join(f"- {imp}" for imp in improvements)
            )
        else:
            # No specific feedback, just regenerate with variation
            improved_prompt = (
                f"{base_prompt}\n\n"
                f"Please provide an alternative analysis with fresh perspective."
            )
        
        return improved_prompt
    
    def _get_generation_params(
        self,
        original_request: AIRequest,
        temperature: Optional[float],
        max_tokens: Optional[int]
    ) -> Dict[str, Any]:
        """
        Get generation parameters, using provided values or defaults.
        
        Args:
            original_request: Original request
            temperature: Optional new temperature
            max_tokens: Optional new max tokens
        
        Returns:
            Dict of generation parameters
        """
        return {
            'temperature': temperature if temperature is not None else original_request.temperature,
            'max_tokens': max_tokens if max_tokens is not None else original_request.max_tokens,
            'provider': original_request.provider,
            'model': original_request.model,
        }
    
    def _execute_regeneration(
        self,
        original_response: AIResponse,
        user,
        modified_prompt: str,
        params: Dict[str, Any],
        feedback: Optional[str]
    ) -> Dict[str, Any]:
        """
        Execute the actual regeneration.
        
        This is wrapped in a transaction in the parent method.
        
        Args:
            original_response: Original AIResponse
            user: User requesting regeneration
            modified_prompt: Improved prompt
            params: Generation parameters
            feedback: User feedback
        
        Returns:
            Dict with regeneration results
        """
        # Create new AIRequest
        new_request = AIRequest.objects.create(
            user=user,
            content_type=original_response.request.content_type,
            object_id=original_response.request.object_id,
            prompt_name=original_response.request.prompt_name,
            prompt_version=original_response.request.prompt_version,
            system_prompt=original_response.request.system_prompt,
            user_prompt=modified_prompt,
            provider=params['provider'],
            model=params['model'],
            temperature=params['temperature'],
            max_tokens=params['max_tokens'],
            metadata={
                'is_regeneration': True,
                'parent_response_id': str(original_response.id),
                'feedback': feedback or "",
            }
        )
        
        new_request.mark_processing()
        
        try:
            # Get AI provider
            provider = get_ai_provider(params['provider'])
            
            # Generate response
            from .ai_base import AIGenerationConfig
            config = AIGenerationConfig(
                temperature=params['temperature'],
                max_tokens=params['max_tokens']
            )
            
            ai_result = provider.generate(
                prompt=modified_prompt,
                system_prompt=original_response.request.system_prompt,
                model=params['model'],
                config=config
            )
            
            # Create new AIResponse
            new_response = AIResponse.objects.create(
                request=new_request,
                content=ai_result.content,
                output_tokens=ai_result.output_tokens,
                total_tokens=ai_result.total_tokens,
                model_used=ai_result.model,
                finish_reason=ai_result.finish_reason,
                parent_response=original_response,  # Link to parent
            )
            
            # Calculate confidence
            confidence = self.confidence_scorer.calculate_confidence(
                ai_response={
                    'content': ai_result.content,
                    'finish_reason': ai_result.finish_reason
                },
                input_text=modified_prompt,
                model=ai_result.model
            )
            
            new_response.confidence_score = confidence['score']
            new_response.save(update_fields=['confidence_score'])
            
            # Mark request completed
            new_request.mark_completed()
            
            # Track usage
            self.usage_tracker.log_usage(
                user=user,
                request=new_request,
                input_tokens=ai_result.input_tokens,
                output_tokens=ai_result.output_tokens,
                provider=params['provider'],
                model=ai_result.model
            )
            
            # Build result
            improvements = []
            if feedback:
                improvements.append(f"Applied feedback: {feedback}")
            if params['temperature'] != original_response.request.temperature:
                improvements.append(f"Adjusted creativity level")
            
            return {
                'new_response_id': str(new_response.id),
                'new_request_id': str(new_request.id),
                'content': new_response.content,
                'parsed_content': new_response.parsed_content,
                'improvements': improvements or ['Generated alternative version'],
                'confidence': confidence,
                'parent_response_id': str(original_response.id),
                'tokens_used': ai_result.total_tokens,
                'model': ai_result.model,
                'regeneration_count': self._get_regeneration_count(new_response),
            }
            
        except Exception as e:
            new_request.mark_failed(str(e))
            logger.error(f"Regeneration failed: {e}")
            raise AIProviderError(
                message=f"Failed to regenerate response: {str(e)}",
                provider=params['provider']
            )
    
    def _get_regeneration_count(self, response: AIResponse) -> int:
        """
        Get the regeneration count for a response.
        
        Args:
            response: Response to check
        
        Returns:
            Number of regenerations in the chain
        """
        count = 0
        current = response
        while current.parent_response is not None:
            count += 1
            current = current.parent_response
        return count
    
    def get_regeneration_history(
        self,
        response_id: UUID
    ) -> Dict[str, Any]:
        """
        Get the full regeneration history for a response.
        
        Args:
            response_id: UUID of any response in the chain
        
        Returns:
            Dict containing:
                - root: Original response
                - chain: List of all regenerations
                - current: The requested response
        
        Example:
            history = service.get_regeneration_history(response_id)
            # Returns complete chain from original to latest
        """
        try:
            current_response = AIResponse.objects.get(id=response_id)
        except AIResponse.DoesNotExist:
            raise ValidationError(f"Response {response_id} not found")
        
        # Get root
        root = self._get_root_response(current_response)
        
        # Build chain
        chain = [self._response_summary(root)]
        
        # Get all regenerations
        def collect_regenerations(response):
            for regen in response.regenerations.all().order_by('created_at'):
                chain.append(self._response_summary(regen))
                collect_regenerations(regen)  # Recursive
        
        collect_regenerations(root)
        
        return {
            'root': self._response_summary(root),
            'chain': chain,
            'current': self._response_summary(current_response),
            'total_regenerations': len(chain) - 1,
        }
    
    def _response_summary(self, response: AIResponse) -> Dict[str, Any]:
        """
        Create a summary dict for a response.
        
        Args:
            response: AIResponse object
        
        Returns:
            Summary dict
        """
        return {
            'id': str(response.id),
            'created_at': response.created_at.isoformat(),
            'confidence_score': response.confidence_score,
            'tokens_used': response.total_tokens,
            'model': response.model_used,
            'is_regeneration': response.parent_response is not None,
            'feedback': response.request.metadata.get('feedback', ''),
        }
