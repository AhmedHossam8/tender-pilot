"""
AI Engine API Views

Provides REST API endpoints for all AI-powered operations.

Endpoints:
1. POST /api/v1/ai/p/{project_id}/analyze - Analyze project
2. POST /api/v1/ai/project/{project_id}/compliance - Check compliance
3. POST /api/v1/ai/project/{project_id}/outline - Generate proposal outline
4. GET /api/v1/ai/health - Health check

Architecture:
- Views handle HTTP request/response
- Validation done via serializers
- Business logic in service layer
- Rate limiting applied per endpoint
- Demo mode support
- Monitoring integration
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError
from django.conf import settings

from .services.analysis_service import (
    ProjectAnalysisService,
    ComplianceCheckService,
    ProposalOutlineService,
)
from .services.regeneration import AIRegenerationService
from .serializers import (
    ProjectAnalysisRequestSerializer,
    ProjectAnalysisResponseSerializer,
    ComplianceCheckRequestSerializer,
    ComplianceCheckResponseSerializer,
    ProposalOutlineRequestSerializer,
    ProposalOutlineResponseSerializer,
    AIErrorResponseSerializer,
    RegenerateRequestSerializer,
    RegenerateResponseSerializer,
    RegenerationHistorySerializer,
)
from .exceptions import (
    AIProviderError,
    AIRateLimitError,
    AIInvalidResponseError,
)
from .decorators import ai_rate_limit
from .permissions import CanUseAI, CanRegenerateAI, check_ai_quota, get_user_ai_limits
from .demo import is_demo_mode, get_demo_response
from .monitoring import ai_logger, ai_metrics, get_health_metrics

logger = logging.getLogger(__name__)


class ProjectAnalysisView(APIView):
    """
    Analyze a project using AI.
    
    POST /api/v1/ai/project/{project_id}/analyze
    
    This endpoint:
    1. Fetches project and documents
    2. Extracts text content
    3. Sends to AI for analysis
    4. Returns structured analysis
    
    Request Body:
        {
            "force_refresh": false,  // Optional: re-analyze even if cached
            "analysis_depth": "standard",  // Optional: quick|standard|detailed
            "include_documents": true  // Optional: include doc-level analysis
        }
    
    Response:
        {
            "request_id": "uuid",
            "analysis": {
                "summary": "...",
                "key_requirements": [...],
                "estimated_complexity": "medium",
                ...
            },
            "tokens_used": 1234,
            "cost": 0.0037,
            "cached": false,
            "processing_time_ms": 3456
        }
    
    Rate Limit: 10 requests per hour per user
    """
    
    permission_classes = [CanUseAI]
    
    @ai_rate_limit(rate='10/h')
    def post(self, request, project_id):
        """Handle project analysis request"""
        try:
            # Check for demo mode
            if is_demo_mode(request):
                demo_response = get_demo_response('project_analysis', 'highway-construction')
                ai_logger.log_request(
                    request_id=demo_response['request_id'],
                    user_id=request.user.id,
                    operation='project_analysis',
                    demo_mode=True
                )
                return Response(demo_response, status=status.HTTP_200_OK)
            
            # Step 1: Validate request data
            serializer = ProjectAnalysisRequestSerializer(
                data=request.data,
                context={'user': request.user}
            )
            serializer.is_valid(raise_exception=True)
            
            logger.info(
                f"Project analysis request: project_id={project_id}, "
                f"user={request.user.id}, params={serializer.validated_data}"
            )
            
            # Step 2: Call service layer
            service = ProjectAnalysisService()
            result = service.analyze_project(
                project_id=project_id,
                user=request.user,
                **serializer.validated_data
            )
            
            # Track metrics
            ai_metrics.increment_requests('project_analysis', 'openai')
            ai_metrics.record_tokens('project_analysis', result.get('tokens_used', 0), 'total')
            ai_metrics.record_cost('project_analysis', result.get('cost', 0))
            
            # Step 3: Format response
            response_serializer = ProjectAnalysisResponseSerializer(data=result)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(
                response_serializer.validated_data,
                status=status.HTTP_200_OK
            )
            
        except DjangoValidationError as e:
            # Handle validation errors from service layer
            logger.warning(f"Validation error: {e}")
            error_data = e.message_dict if hasattr(e, 'message_dict') else {'error': str(e)}
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)
        
        except ValidationError as e:
            # Handle DRF validation errors
            logger.warning(f"DRF validation error: {e}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        
        except AIRateLimitError as e:
            # Handle AI provider rate limits
            logger.error(f"AI rate limit: {e}")
            return Response(
                {
                    'error': 'AI service rate limit exceeded',
                    'code': 'ai_rate_limit',
                    'retry_after': 60,
                    'details': str(e)
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        except AIProviderError as e:
            # Handle AI provider errors
            logger.error(f"AI provider error: {e}", exc_info=True)
            return Response(
                {
                    'error': 'AI service temporarily unavailable',
                    'code': 'ai_service_error',
                    'details': str(e)
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        except Exception as e:
            # Handle unexpected errors
            logger.error(f"Unexpected error in project analysis: {e}", exc_info=True)
            return Response(
                {
                    'error': 'Internal server error',
                    'code': 'internal_error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ComplianceCheckView(APIView):
    """
    Check proposal compliance against project requirements.
    
    POST /api/v1/ai/project/{project_id}/compliance
    
    This endpoint:
    1. Fetches project requirements
    2. Gets proposal content (from DB or request)
    3. Analyzes compliance using AI
    4. Returns gaps and recommendations
    
    Request Body:
        {
            "proposal_id": "uuid",  // Optional: check existing proposal
            "proposal_content": "text",  // Optional: check ad-hoc content
            "sections_to_check": ["technical", "financial"],  // Optional
            "check_format": false  // Optional: also check formatting
        }
    
    Response:
        {
            "request_id": "uuid",
            "compliance_score": 85,
            "gaps": [
                {
                    "requirement": "ISO 9001 certification",
                    "status": "not_met",
                    "severity": "critical",
                    "suggestion": "..."
                }
            ],
            "recommendations": [...],
            "tokens_used": 2341,
            "cost": 0.0067
        }
    
    Rate Limit: 20 requests per hour per user
    """
    
    permission_classes = [CanUseAI]
    
    @ai_rate_limit(rate='20/h')
    def post(self, request, project_id):
        """Handle compliance check request."""
        try:
            # Step 1: Validate request
            serializer = ComplianceCheckRequestSerializer(
                data=request.data,
                context={'user': request.user}
            )
            serializer.is_valid(raise_exception=True)
            
            logger.info(
                f"Compliance check request: project_id={project_id}, "
                f"user={request.user.id}"
            )
            
            # Step 2: Call service layer
            service = ComplianceCheckService()
            result = service.check_compliance(
                project_id=project_id,
                user=request.user,
                proposal_id=serializer.validated_data.get('proposal_id'),
                proposal_content=serializer.validated_data.get('proposal_content')
            )
            
            # Step 3: Format response
            response_serializer = ComplianceCheckResponseSerializer(data=result)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(
                response_serializer.validated_data,
                status=status.HTTP_200_OK
            )
            
        except DjangoValidationError as e:
            logger.warning(f"Validation error: {e}")
            error_data = e.message_dict if hasattr(e, 'message_dict') else {'error': str(e)}
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)
        
        except ValidationError as e:
            logger.warning(f"DRF validation error: {e}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        
        except AIRateLimitError as e:
            logger.error(f"AI rate limit: {e}")
            return Response(
                {
                    'error': 'AI service rate limit exceeded',
                    'code': 'ai_rate_limit',
                    'retry_after': 60
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        except AIProviderError as e:
            logger.error(f"AI provider error: {e}", exc_info=True)
            return Response(
                {
                    'error': 'AI service temporarily unavailable',
                    'code': 'ai_service_error'
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        except Exception as e:
            logger.error(f"Unexpected error in compliance check: {e}", exc_info=True)
            return Response(
                {
                    'error': 'Internal server error',
                    'code': 'internal_error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProposalOutlineView(APIView):
    """
    Generate a proposal outline based on project.
    
    POST /api/v1/ai/project/{project_id}/outline
    
    This endpoint:
    1. Analyzes project requirements
    2. Generates structured proposal outline
    3. Provides section guidance
    4. Suggests page counts
    
    Request Body:
        {
            "style": "detailed",  // Optional: brief|standard|detailed|comprehensive
            "include_examples": true,  // Optional: include example content
            "target_length": "30-40 pages",  // Optional: target document length
            "custom_sections": ["risk_management"]  // Optional: additional sections
        }
    
    Response:
        {
            "request_id": "uuid",
            "outline": {
                "title": "Proposal for Highway Construction",
                "sections": [
                    {
                        "section_number": "1",
                        "name": "Executive Summary",
                        "description": "...",
                        "suggested_length": "2 pages",
                        "key_points": [...],
                        "priority": "critical"
                    }
                ],
                "estimated_total_pages": 35
            },
            "tokens_used": 1876,
            "cost": 0.0053
        }
    
    Rate Limit: 15 requests per hour per user
    """
    
    permission_classes = [CanUseAI]
    
    @ai_rate_limit(rate='15/h')
    def post(self, request, project_id):
        """Handle proposal outline generation request."""
        try:
            # Step 1: Validate request
            serializer = ProposalOutlineRequestSerializer(
                data=request.data,
                context={'user': request.user}
            )
            serializer.is_valid(raise_exception=True)
            
            logger.info(
                f"Proposal outline request: project_id={project_id}, "
                f"user={request.user.id}, style={serializer.validated_data.get('style')}"
            )
            
            # Step 2: Call service layer
            service = ProposalOutlineService()
            result = service.generate_outline(
                project_id=project_id,
                user=request.user,
                style=serializer.validated_data.get('style', 'standard'),
                include_examples=serializer.validated_data.get('include_examples', False)
            )
            
            # Step 3: Format response
            response_serializer = ProposalOutlineResponseSerializer(data=result)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(
                response_serializer.validated_data,
                status=status.HTTP_200_OK
            )
            
        except DjangoValidationError as e:
            logger.warning(f"Validation error: {e}")
            error_data = e.message_dict if hasattr(e, 'message_dict') else {'error': str(e)}
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)
        
        except ValidationError as e:
            logger.warning(f"DRF validation error: {e}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        
        except AIRateLimitError as e:
            logger.error(f"AI rate limit: {e}")
            return Response(
                {
                    'error': 'AI service rate limit exceeded',
                    'code': 'ai_rate_limit',
                    'retry_after': 60
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        
        except AIProviderError as e:
            logger.error(f"AI provider error: {e}", exc_info=True)
            return Response(
                {
                    'error': 'AI service temporarily unavailable',
                    'code': 'ai_service_error'
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        except Exception as e:
            logger.error(f"Unexpected error in outline generation: {e}", exc_info=True)
            return Response(
                {
                    'error': 'Internal server error',
                    'code': 'internal_error'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AIHealthCheckView(APIView):
    """
    Check health status of AI engine and provider.
    
    GET /api/v1/ai/health
    
    Returns:
        {
            "status": "ok",  // ok|degraded|error
            "provider": "openai",
            "available": true,
            "enabled": true,
            "latency_ms": 150,
            "message": "AI services operational",
            "metrics": {...}
        }
    """
    
    permission_classes = []
    
    def get(self, request):
        """Check AI service health."""
        import time
        from .services import get_ai_provider
        
        try:
            # Check if AI is globally enabled
            ai_enabled = getattr(settings, 'AI_ENABLED', True)
            if not ai_enabled:
                return Response({
                    "status": "disabled",
                    "provider": "none",
                    "available": False,
                    "message": "AI services are disabled",
                    "enabled": False
                })
            
            # Try to get provider with latency measurement
            start_time = time.time()
            provider = get_ai_provider()
            is_available = provider.is_available()
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Get additional health metrics
            health_metrics = get_health_metrics()
            
            response_data = {
                "status": "ok" if is_available else "degraded",
                "provider": provider.provider_type.value,
                "available": is_available,
                "enabled": True,
                "latency_ms": latency_ms,
                "message": "AI services operational" if is_available else "AI services degraded",
                "metrics": health_metrics
            }
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Health check failed: {e}", exc_info=True)
            return Response(
                {
                    "status": "error",
                    "provider": "unknown",
                    "available": False,
                    "enabled": getattr(settings, 'AI_ENABLED', True),
                    "message": str(e),
                    "error_type": type(e).__name__
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class RegenerateResponseView(APIView):
    """
    Regenerate an AI response with improvements.
    
    POST /api/v1/ai/response/{response_id}/regenerate
    
    Request:
        {
            "feedback": "Make it more concise",
            "temperature": 0.7,
            "style": "concise"
        }
    
    Response:
        {
            "new_response_id": "uuid",
            "content": "...",
            "improvements": ["Applied feedback", "..."],
            "confidence": {...},
            "parent_response_id": "uuid",
            "regeneration_count": 2
        }
    
    This endpoint allows users to:
    - Request improved versions of AI outputs
    - Provide feedback on what to change
    - Adjust generation parameters
    - Track regeneration history
    
    Permissions:
    - Requires CanRegenerateAI permission (costly operation)
    - Users can only regenerate their own responses (unless admin)
    
    Rate Limits:
    - More restrictive than standard AI operations
    - Limited to prevent abuse
    """
    
    permission_classes = [CanRegenerateAI]
    
    @ai_rate_limit(group='regenerate', rate='5/hour')
    def post(self, request, response_id):
        """
        Regenerate an AI response.
        
        Args:
            request: HTTP request with regeneration parameters
            response_id: UUID of response to regenerate
        
        Returns:
            Response with new generated content
        """
        logger.info(
            f"Regenerate request from user {request.user.id} "
            f"for response {response_id}"
        )
        
        # Validate input
        serializer = RegenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Execute regeneration
            service = AIRegenerationService()
            result = service.regenerate_response(
                response_id=response_id,
                user=request.user,
                **serializer.validated_data
            )
            
            # Format response
            response_serializer = RegenerateResponseSerializer(data=result)
            response_serializer.is_valid(raise_exception=True)
            
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
            
        except DjangoValidationError as e:
            logger.warning(f"Regeneration validation failed: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except AIProviderError as e:
            logger.error(f"AI provider error during regeneration: {e}")
            error_serializer = AIErrorResponseSerializer(data={
                "error": e.message,
                "code": "provider_error",
                "details": {"provider": e.provider}
            })
            error_serializer.is_valid(raise_exception=True)
            return Response(
                error_serializer.data,
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
            
        except AIRateLimitError as e:
            logger.warning(f"Rate limit hit during regeneration: {e}")
            error_serializer = AIErrorResponseSerializer(data={
                "error": e.message,
                "code": "rate_limit",
                "retry_after": e.retry_after
            })
            error_serializer.is_valid(raise_exception=True)
            return Response(
                error_serializer.data,
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
            
        except Exception as e:
            logger.error(f"Unexpected error in regeneration: {e}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RegenerationHistoryView(APIView):
    """
    Get the full regeneration history for a response.
    
    GET /api/v1/ai/response/{response_id}/history
    
    Response:
        {
            "root": {
                "id": "uuid",
                "created_at": "...",
                "confidence_score": 0.85,
                ...
            },
            "chain": [{...}, {...}],
            "current": {...},
            "total_regenerations": 3
        }
    
    This endpoint provides:
    - Complete regeneration chain
    - Root (original) response
    - All intermediate versions
    - Current response details
    
    Useful for:
    - Comparing different versions
    - Understanding improvement progression
    - Debugging response quality issues
    """
    
    permission_classes = [CanUseAI]
    
    def get(self, request, response_id):
        """
        Retrieve regeneration history.
        
        Args:
            request: HTTP request
            response_id: UUID of any response in the chain
        
        Returns:
            Response with complete history
        """
        logger.info(
            f"History request from user {request.user.id} "
            f"for response {response_id}"
        )
        
        try:
            service = AIRegenerationService()
            history = service.get_regeneration_history(response_id)
            
            # Format response
            serializer = RegenerationHistorySerializer(data=history)
            serializer.is_valid(raise_exception=True)
            
            return Response(serializer.data)
            
        except DjangoValidationError as e:
            logger.warning(f"History validation failed: {e}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
            
        except Exception as e:
            logger.error(f"Unexpected error in history: {e}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AIMatchProvidersView(APIView):
    """
    AI endpoint to find and rank matching service providers for a project.
    
    POST /api/v1/ai/match/project/{project_id}/providers/
    
    Returns ranked list of providers with match scores and explanations.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, project_id):
        """
        Find matching providers for a project.
        
        Args:
            request: HTTP request
            project_id: ID of the project/project
        
        Returns:
            Response with ranked provider matches
        """
        logger.info(
            f"Match providers request from user {request.user.id} "
            f"for project {project_id}"
        )
        
        try:
            from apps.projects.models import Project
            from apps.ai_engine.services.matching_service import AIMatchingService
            
            # Get the project
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Response(
                    {"error": "Project not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get limit from query params
            limit = int(request.query_params.get('limit', 10))
            
            # Find matching providers
            matching_service = AIMatchingService()
            matches = matching_service.match_providers_to_project(project, limit=limit)
            
            return Response({
                "project_id": project_id,
                "project_title": project.title,
                "matches_count": len(matches),
                "matches": matches
            })
            
        except Exception as e:
            logger.error(f"Error in match providers: {e}", exc_info=True)
            return Response(
                {"error": "An error occurred while matching providers"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AIGenerateCoverLetterView(APIView):
    """
    AI endpoint to generate a cover letter for a bid.
    
    POST /api/v1/ai/bid/generate-cover-letter/
    
    Body: {
        "project_id": <project_id>
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Generate AI cover letter for a bid.
        
        Args:
            request: HTTP request with project_id
        
        Returns:
            Response with generated cover letter
        """
        logger.info(f"Generate cover letter request from user {request.user.id}")
        
        try:
            from apps.projects.models import Project
            from apps.ai_engine.services.matching_service import AIBidAssistant
            
            project_id = request.data.get('project_id')
            if not project_id:
                return Response(
                    {"error": "project_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the project
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Response(
                    {"error": "Project not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Generate cover letter
            assistant = AIBidAssistant()
            cover_letter = assistant.generate_cover_letter(project, request.user)
            
            if cover_letter:
                return Response({
                    "project_id": project_id,
                    "cover_letter": cover_letter,
                    "generated_at": "now"  # Would use timezone.now() in real impl
                })
            else:
                return Response(
                    {"error": "Failed to generate cover letter"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            logger.error(f"Error generating cover letter: {e}", exc_info=True)
            return Response(
                {"error": "An error occurred while generating cover letter"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AISuggestPricingView(APIView):
    """
    AI endpoint to suggest competitive pricing for a bid.
    
    POST /api/v1/ai/bid/suggest-pricing/
    
    Body: {
        "project_id": <project_id>
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Suggest competitive pricing for a bid.
        
        Args:
            request: HTTP request with project_id
        
        Returns:
            Response with pricing suggestions
        """
        logger.info(f"Suggest pricing request from user {request.user.id}")
        
        try:
            from apps.projects.models import Project
            from apps.ai_engine.services.matching_service import AIBidAssistant
            
            project_id = request.data.get('project_id')
            if not project_id:
                return Response(
                    {"error": "project_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the project
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Response(
                    {"error": "Project not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Suggest pricing
            assistant = AIBidAssistant()
            pricing = assistant.suggest_pricing(project, request.user)
            
            if pricing:
                return Response({
                    "project_id": project_id,
                    **pricing
                })
            else:
                return Response(
                    {"error": "Failed to suggest pricing"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            logger.error(f"Error suggesting pricing: {e}", exc_info=True)
            return Response(
                {"error": "An error occurred while suggesting pricing"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )