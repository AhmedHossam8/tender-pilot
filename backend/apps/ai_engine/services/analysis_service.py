"""
AI Analysis Service Layer

This module provides high-level business logic for AI-powered analysis operations.
It orchestrates the workflow of analyzing tenders, checking compliance, and 
generating proposal outlines.

Architecture:
- Views call these services
- Services orchestrate workflow
- Services call AI providers
- Services handle database operations
- Services track usage
"""

import json
import logging
from typing import Dict, Any, Optional, List
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.tenders.models import Tender, TenderDocument, TenderRequirement

# Try to import Proposal model (may not exist yet)
try:
    from apps.proposals.models import Proposal
except ImportError:
    Proposal = None

from ..models import AIRequest, AIResponse, AIRequestStatus
from ..prompts.registry import get_prompt
from ..tracking.usage import AIUsageTracker
from ..exceptions import (
    AIProviderError,
    AIInvalidResponseError,
    AIRateLimitError,
)
from .factory import get_ai_provider

logger = logging.getLogger(__name__)


class TenderAnalysisService:
    """
    Service for AI-powered tender analysis.
    
    This service handles the complete workflow of:
    1. Fetching tender data
    2. Building analysis prompts
    3. Calling AI provider
    4. Parsing and validating results
    5. Saving to database
    6. Tracking usage
    
    Example:
        service = TenderAnalysisService()
        result = service.analyze_tender(
            tender_id="123",
            user=request.user,
            force_refresh=False
        )
    """
    
    def __init__(self):
        self.usage_tracker = AIUsageTracker()
    
    def analyze_tender(
        self,
        tender_id: str,
        user,
        force_refresh: bool = False,
        analysis_depth: str = 'standard'
    ) -> Dict[str, Any]:
        """
        Analyze a tender using AI.
        
        This is the main entry point for tender analysis. It performs the
        complete workflow from fetching data to saving results.
        
        Args:
            tender_id: UUID of the tender to analyze
            user: User making the request
            force_refresh: If True, ignore cached results and re-analyze
            analysis_depth: Level of detail ('quick', 'standard', 'detailed')
            
        Returns:
            Dict containing:
                - request_id: UUID of the AI request
                - analysis: Parsed AI analysis result
                - tokens_used: Total tokens consumed
                - cost: Estimated cost in USD
                - cached: Whether result was cached
                - processing_time_ms: Time taken
                
        Raises:
            ValidationError: If tender has no documents or invalid data
            AIProviderError: If AI service fails
            Tender.DoesNotExist: If tender not found
        """
        logger.info(f"Starting tender analysis: tender_id={tender_id}, user={user.id if user else 'anonymous'}")
        
        # Step 1: Fetch tender and validate
        tender = self._get_tender(tender_id)
        
        # Step 2: Check if we have cached result
        if not force_refresh:
            cached_result = self._get_cached_analysis(tender_id, user)
            if cached_result:
                logger.info(f"Returning cached analysis for tender {tender_id}")
                return cached_result
        
        # Step 3: Get extracted text from documents
        extracted_text = self._get_tender_text(tender)
        
        # Step 4: Build the AI prompt
        prompt_data = self._build_analysis_prompt(tender, extracted_text, analysis_depth)
        
        # Step 5: Execute AI analysis with database tracking
        with transaction.atomic():
            result = self._execute_analysis(
                tender=tender,
                user=user,
                prompt_data=prompt_data,
                analysis_depth=analysis_depth
            )
        
        logger.info(f"Tender analysis completed: tender_id={tender_id}, request_id={result['request_id']}")
        return result
    
    def _get_tender(self, tender_id: str) -> Tender:
        """
        Fetch tender from database with related data.
        
        Args:
            tender_id: UUID of tender
            
        Returns:
            Tender object with prefetched relations
            
        Raises:
            Tender.DoesNotExist: If tender not found
        """
        try:
            return Tender.objects.select_related(
                'issuing_entity'
            ).prefetch_related(
                'documents',
                'requirements'
            ).get(id=tender_id, is_active=True)
        except Tender.DoesNotExist:
            logger.error(f"Tender not found: {tender_id}")
            raise ValidationError({
                'error': 'Tender not found',
                'code': 'tender_not_found',
                'tender_id': tender_id
            })
    
    def _get_cached_analysis(self, tender_id: str, user) -> Optional[Dict[str, Any]]:
        """
        Check if we have a recent cached analysis result.
        
        We consider a result cached if:
        - There's a completed AIRequest for this tender
        - It was created in the last 24 hours
        - The tender hasn't been updated since then
        
        Args:
            tender_id: UUID of tender
            user: User making request
            
        Returns:
            Cached result dict or None
        """
        # Look for recent completed request
        recent_request = AIRequest.objects.filter(
            content_type='tender',
            object_id=str(tender_id),
            status=AIRequestStatus.COMPLETED,
            prompt_name='tender_analysis'
        ).select_related('response').order_by('-created_at').first()
        
        if not recent_request:
            return None
        
        # Check if result is recent (within 24 hours)
        age_hours = (timezone.now() - recent_request.created_at).total_seconds() / 3600
        if age_hours > 24:
            logger.debug(f"Cached result too old: {age_hours:.1f} hours")
            return None
        
        # Check if tender was updated after analysis
        tender = Tender.objects.get(id=tender_id)
        if tender.updated_at > recent_request.created_at:
            logger.debug(f"Tender updated after analysis, cache invalid")
            return None
        
        # Return cached result
        try:
            response = recent_request.response
            analysis = json.loads(response.output_text)
            
            return {
                'request_id': str(recent_request.id),
                'analysis': analysis,
                'tokens_used': response.input_tokens + response.output_tokens,
                'cost': float(recent_request.usage.estimated_cost) if hasattr(recent_request, 'usage') else 0.0,
                'cached': True,
                'processing_time_ms': 0,
                'cache_age_hours': round(age_hours, 2)
            }
        except (json.JSONDecodeError, AttributeError) as e:
            logger.warning(f"Failed to parse cached result: {e}")
            return None
    
    def _get_tender_text(self, tender: Tender) -> str:
        """
        Extract and combine text from all tender documents.
        
        Args:
            tender: Tender object with prefetched documents
            
        Returns:
            Combined text from all documents
            
        Raises:
            ValidationError: If no documents with extracted text found
        """
        # Get all documents with extracted text
        documents = tender.documents.filter(
            extracted_text__isnull=False,
            is_active=True
        ).exclude(extracted_text='')
        
        if not documents.exists():
            raise ValidationError({
                'error': 'No documents with extracted text found',
                'code': 'no_extracted_text',
                'suggestion': 'Upload and process documents first'
            })
        
        # Combine text from all documents
        combined_text = []
        for doc in documents:
            combined_text.append(f"=== Document: {doc.document_type.upper()} ===")
            combined_text.append(doc.extracted_text)
            combined_text.append("")  # Blank line separator
        
        full_text = "\n".join(combined_text)
        
        # Log text length
        logger.debug(f"Extracted {len(full_text)} characters from {documents.count()} documents")
        
        return full_text
    
    def _build_analysis_prompt(
        self,
        tender: Tender,
        extracted_text: str,
        analysis_depth: str
    ) -> Dict[str, str]:
        """
        Build the AI prompt for tender analysis.
        
        Args:
            tender: Tender object
            extracted_text: Combined text from documents
            analysis_depth: Level of detail
            
        Returns:
            Dict with 'user_prompt' and 'system_prompt'
        """
        # Get prompt template
        template = get_prompt('tender_analysis', version='1.0.0')
        
        # Truncate text if too long (to stay within token limits)
        max_chars = 50000 if analysis_depth == 'detailed' else 20000
        if len(extracted_text) > max_chars:
            logger.warning(f"Truncating text from {len(extracted_text)} to {max_chars} chars")
            extracted_text = extracted_text[:max_chars] + "\n\n[... text truncated due to length ...]"
        
        # Build prompt variables
        prompt_vars = {
            'tender_title': tender.title,
            'tender_reference': str(tender.id),
            'issuing_organization': tender.issuing_entity,
            'tender_content': extracted_text,
            'deadline': tender.deadline.isoformat() if tender.deadline else 'Not specified',
            'analysis_depth': analysis_depth
        }
        
        # Render prompt from template
        user_prompt = template.render(**prompt_vars)
        system_prompt = template.system_prompt
        
        return {
            'user_prompt': user_prompt,
            'system_prompt': system_prompt
        }
    
    def _execute_analysis(
        self,
        tender: Tender,
        user,
        prompt_data: Dict[str, str],
        analysis_depth: str
    ) -> Dict[str, Any]:
        """
        Execute the AI analysis and save results.
        
        This method:
        1. Creates AIRequest record (pending)
        2. Calls AI provider
        3. Parses response
        4. Creates AIResponse record
        5. Updates tender
        6. Tracks usage
        7. Returns result
        
        Args:
            tender: Tender object
            user: User making request
            prompt_data: Dict with prompts
            analysis_depth: Level of detail
            
        Returns:
            Dict with analysis results
            
        Raises:
            AIProviderError: If AI call fails
            AIInvalidResponseError: If response is invalid
        """
        start_time = timezone.now()
        
        # Step 1: Create AIRequest record (status=pending)
        ai_request = AIRequest.objects.create(
            user=user,
            content_type='tender',
            object_id=str(tender.id),
            prompt_name='tender_analysis',
            prompt_version='1.0.0',
            system_prompt=prompt_data['system_prompt'],
            user_prompt=prompt_data['user_prompt'],
            provider='openai',
            model='gpt-4o-mini',  # Default model
            temperature=0.3,  # Lower temperature for consistent analysis
            status=AIRequestStatus.PENDING
        )
        
        logger.info(f"Created AIRequest {ai_request.id}")
        
        try:
            # Step 2: Update status to processing
            ai_request.status = AIRequestStatus.PROCESSING
            ai_request.save(update_fields=['status'])
            
            # Step 3: Get AI provider and make the call
            provider = get_ai_provider()
            
            ai_response = provider.generate(
                prompt=prompt_data['user_prompt'],
                system_prompt=prompt_data['system_prompt'],
                temperature=0.3,
                max_tokens=2000 if analysis_depth == 'quick' else 4000
            )
            
            logger.info(f"AI response received: {ai_response.total_tokens} tokens")
            
            # Step 4: Parse the AI response (should be JSON)
            try:
                analysis_result = json.loads(ai_response.content)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from AI: {ai_response.content[:200]}")
                raise AIInvalidResponseError(f"AI returned invalid JSON: {str(e)}")
            
            # Step 5: Validate response structure
            self._validate_analysis_response(analysis_result)
            
            # Step 6: Create AIResponse record
            processing_time_ms = int((timezone.now() - start_time).total_seconds() * 1000)
            
            ai_response_obj = AIResponse.objects.create(
                request=ai_request,
                output_text=ai_response.content,
                input_tokens=ai_response.input_tokens,
                output_tokens=ai_response.output_tokens,
                total_tokens=ai_response.total_tokens,
                model_used=ai_response.model,
                processing_time_ms=processing_time_ms,
                finish_reason=ai_response.finish_reason
            )
            
            # Step 7: Update tender with AI summary
            tender.ai_summary = analysis_result.get('summary', '')
            tender.save(update_fields=['ai_summary'])
            
            # Step 8: Track usage for billing
            usage = self.usage_tracker.log_usage(
                user=user,
                request=ai_request,
                input_tokens=ai_response.input_tokens,
                output_tokens=ai_response.output_tokens,
                provider='openai',
                model=ai_response.model
            )
            
            # Step 9: Update AIRequest to completed
            ai_request.status = AIRequestStatus.COMPLETED
            ai_request.input_tokens = ai_response.input_tokens
            ai_request.save(update_fields=['status', 'input_tokens'])
            
            # Step 10: Build and return result
            return {
                'request_id': str(ai_request.id),
                'analysis': analysis_result,
                'tokens_used': ai_response.total_tokens,
                'cost': float(usage.estimated_cost),
                'cached': False,
                'processing_time_ms': processing_time_ms,
                'model_used': ai_response.model
            }
            
        except Exception as e:
            # Handle any errors
            logger.error(f"Analysis failed: {str(e)}", exc_info=True)
            
            ai_request.status = AIRequestStatus.FAILED
            ai_request.error_message = str(e)
            ai_request.save(update_fields=['status', 'error_message'])
            
            # Re-raise the exception
            raise
    
    def _validate_analysis_response(self, analysis: Dict[str, Any]) -> None:
        """
        Validate that AI response has expected structure.
        
        Args:
            analysis: Parsed JSON from AI
            
        Raises:
            AIInvalidResponseError: If response is missing required fields
        """
        required_fields = ['summary', 'key_requirements', 'estimated_complexity']
        missing_fields = [f for f in required_fields if f not in analysis]
        
        if missing_fields:
            raise AIInvalidResponseError(
                f"AI response missing required fields: {', '.join(missing_fields)}"
            )


class ComplianceCheckService:
    """
    Service for AI-powered compliance checking.
    
    Checks if a proposal meets tender requirements and identifies gaps.
    """
    
    def __init__(self):
        self.usage_tracker = AIUsageTracker()
    
    def check_compliance(
        self,
        tender_id: str,
        user,
        proposal_id: Optional[str] = None,
        proposal_content: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check proposal compliance against tender requirements.
        
        Args:
            tender_id: UUID of tender
            user: User making request
            proposal_id: UUID of proposal (if checking existing proposal)
            proposal_content: Raw text content (if checking ad-hoc content)
            
        Returns:
            Dict with compliance analysis
            
        Raises:
            ValidationError: If neither proposal_id nor proposal_content provided
        """
        logger.info(f"Starting compliance check: tender_id={tender_id}")
        
        # Validate input
        if not proposal_id and not proposal_content:
            raise ValidationError({
                'error': 'Either proposal_id or proposal_content must be provided',
                'code': 'missing_proposal_data'
            })
        
        # Get tender and requirements
        tender = self._get_tender_with_requirements(tender_id)
        
        # Get proposal content
        if proposal_id:
            if Proposal is None:
                raise ValidationError({
                    'error': 'Proposal model not implemented yet',
                    'code': 'proposal_not_available',
                    'suggestion': 'Use proposal_content parameter instead'
                })
            proposal = Proposal.objects.get(id=proposal_id)
            proposal_text = proposal.content
        else:
            proposal_text = proposal_content
        
        # Build compliance check prompt
        prompt_data = self._build_compliance_prompt(tender, proposal_text)
        
        # Execute compliance check
        with transaction.atomic():
            result = self._execute_compliance_check(
                tender=tender,
                user=user,
                prompt_data=prompt_data,
                proposal_id=proposal_id
            )
        
        return result
    
    def _get_tender_with_requirements(self, tender_id: str) -> Tender:
        """Get tender with all requirements."""
        try:
            return Tender.objects.prefetch_related('requirements').get(
                id=tender_id,
                is_active=True
            )
        except Tender.DoesNotExist:
            raise ValidationError({
                'error': 'Tender not found',
                'code': 'tender_not_found'
            })
    
    def _build_compliance_prompt(self, tender: Tender, proposal_text: str) -> Dict[str, str]:
        """Build compliance check prompt."""
        template = get_prompt('compliance_check', version='1.0.0')
        
        # Build requirements list
        requirements_list = []
        for req in tender.requirements.all():
            requirements_list.append(
                f"- {req.title}: {req.description} "
                f"[{'MANDATORY' if req.is_mandatory else 'OPTIONAL'}]"
            )
        
        requirements_text = "\n".join(requirements_list) if requirements_list else "No specific requirements listed"
        
        # Truncate proposal text if needed
        max_chars = 30000
        if len(proposal_text) > max_chars:
            proposal_text = proposal_text[:max_chars] + "\n[... truncated ...]"
        
        prompt_vars = {
            'tender_title': tender.title,
            'requirements': requirements_text,
            'proposal_content': proposal_text
        }
        
        return {
            'user_prompt': template.render(**prompt_vars),
            'system_prompt': template.system_prompt
        }
    
    def _execute_compliance_check(
        self,
        tender: Tender,
        user,
        prompt_data: Dict[str, str],
        proposal_id: Optional[str]
    ) -> Dict[str, Any]:
        """Execute compliance check with AI."""
        start_time = timezone.now()
        
        # Create AI request
        ai_request = AIRequest.objects.create(
            user=user,
            content_type='compliance',
            object_id=str(tender.id),
            prompt_name='compliance_check',
            prompt_version='1.0.0',
            system_prompt=prompt_data['system_prompt'],
            user_prompt=prompt_data['user_prompt'],
            provider='openai',
            model='gpt-4o-mini',
            temperature=0.2,
            status=AIRequestStatus.PROCESSING
        )
        
        try:
            # Call AI
            provider = get_ai_provider()
            ai_response = provider.generate(
                prompt=prompt_data['user_prompt'],
                system_prompt=prompt_data['system_prompt'],
                temperature=0.2
            )
            
            # Parse response
            compliance_result = json.loads(ai_response.content)
            
            # Save response
            processing_time_ms = int((timezone.now() - start_time).total_seconds() * 1000)
            
            AIResponse.objects.create(
                request=ai_request,
                output_text=ai_response.content,
                input_tokens=ai_response.input_tokens,
                output_tokens=ai_response.output_tokens,
                total_tokens=ai_response.total_tokens,
                model_used=ai_response.model,
                processing_time_ms=processing_time_ms
            )
            
            # Track usage
            usage = self.usage_tracker.log_usage(
                user=user,
                request=ai_request,
                input_tokens=ai_response.input_tokens,
                output_tokens=ai_response.output_tokens,
                provider='openai',
                model=ai_response.model
            )
            
            # Mark completed
            ai_request.status = AIRequestStatus.COMPLETED
            ai_request.save()
            
            return {
                'request_id': str(ai_request.id),
                'compliance_score': compliance_result.get('compliance_score', 0),
                'gaps': compliance_result.get('gaps', []),
                'fully_met': compliance_result.get('fully_met', []),
                'recommendations': compliance_result.get('recommendations', []),
                'tokens_used': ai_response.total_tokens,
                'cost': float(usage.estimated_cost),
                'processing_time_ms': processing_time_ms
            }
            
        except Exception as e:
            logger.error(f"Compliance check failed: {e}", exc_info=True)
            ai_request.status = AIRequestStatus.FAILED
            ai_request.error_message = str(e)
            ai_request.save()
            raise


class ProposalOutlineService:
    """
    Service for AI-powered proposal outline generation.
    
    Generates a structured proposal outline based on tender requirements.
    """
    
    def __init__(self):
        self.usage_tracker = AIUsageTracker()
    
    def generate_outline(
        self,
        tender_id: str,
        user,
        style: str = 'standard',
        include_examples: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a proposal outline for a tender.
        
        Args:
            tender_id: UUID of tender
            user: User making request
            style: Outline style ('brief', 'standard', 'detailed')
            include_examples: Whether to include example content
            
        Returns:
            Dict with generated outline
        """
        logger.info(f"Generating proposal outline: tender_id={tender_id}, style={style}")
        
        # Get tender
        tender = self._get_tender_with_requirements(tender_id)
        
        # Build outline prompt
        prompt_data = self._build_outline_prompt(tender, style, include_examples)
        
        # Execute outline generation
        with transaction.atomic():
            result = self._execute_outline_generation(
                tender=tender,
                user=user,
                prompt_data=prompt_data,
                style=style
            )
        
        return result
    
    def _get_tender_with_requirements(self, tender_id: str) -> Tender:
        """Get tender with requirements."""
        try:
            return Tender.objects.prefetch_related('requirements', 'documents').get(
                id=tender_id,
                is_active=True
            )
        except Tender.DoesNotExist:
            raise ValidationError({
                'error': 'Tender not found',
                'code': 'tender_not_found'
            })
    
    def _build_outline_prompt(
        self,
        tender: Tender,
        style: str,
        include_examples: bool
    ) -> Dict[str, str]:
        """Build proposal outline prompt."""
        template = get_prompt('proposal_generation', version='1.0.0')
        
        # Build requirements summary
        requirements_list = [
            f"- {req.title}" for req in tender.requirements.all()
        ]
        requirements_text = "\n".join(requirements_list) if requirements_list else "No specific requirements"
        
        prompt_vars = {
            'tender_title': tender.title,
            'issuing_organization': tender.issuing_entity,
            'requirements': requirements_text,
            'style': style,
            'include_examples': 'Yes' if include_examples else 'No'
        }
        
        return {
            'user_prompt': template.render(**prompt_vars),
            'system_prompt': template.system_prompt
        }
    
    def _execute_outline_generation(
        self,
        tender: Tender,
        user,
        prompt_data: Dict[str, str],
        style: str
    ) -> Dict[str, Any]:
        """Execute outline generation with AI."""
        start_time = timezone.now()
        
        # Create AI request
        ai_request = AIRequest.objects.create(
            user=user,
            content_type='outline',
            object_id=str(tender.id),
            prompt_name='proposal_outline',
            prompt_version='1.0.0',
            system_prompt=prompt_data['system_prompt'],
            user_prompt=prompt_data['user_prompt'],
            provider='openai',
            model='gpt-4o-mini',
            temperature=0.7,  # Higher for more creative outlines
            status=AIRequestStatus.PROCESSING
        )
        
        try:
            # Call AI
            provider = get_ai_provider()
            ai_response = provider.generate(
                prompt=prompt_data['user_prompt'],
                system_prompt=prompt_data['system_prompt'],
                temperature=0.7,
                max_tokens=3000
            )
            
            # Parse response
            outline_result = json.loads(ai_response.content)
            
            # Save response
            processing_time_ms = int((timezone.now() - start_time).total_seconds() * 1000)
            
            AIResponse.objects.create(
                request=ai_request,
                output_text=ai_response.content,
                input_tokens=ai_response.input_tokens,
                output_tokens=ai_response.output_tokens,
                total_tokens=ai_response.total_tokens,
                model_used=ai_response.model,
                processing_time_ms=processing_time_ms
            )
            
            # Track usage
            usage = self.usage_tracker.log_usage(
                user=user,
                request=ai_request,
                input_tokens=ai_response.input_tokens,
                output_tokens=ai_response.output_tokens,
                provider='openai',
                model=ai_response.model
            )
            
            # Mark completed
            ai_request.status = AIRequestStatus.COMPLETED
            ai_request.save()
            
            return {
                'request_id': str(ai_request.id),
                'outline': outline_result,
                'tokens_used': ai_response.total_tokens,
                'cost': float(usage.estimated_cost),
                'processing_time_ms': processing_time_ms
            }
            
        except Exception as e:
            logger.error(f"Outline generation failed: {e}", exc_info=True)
            ai_request.status = AIRequestStatus.FAILED
            ai_request.error_message = str(e)
            ai_request.save()
            raise
