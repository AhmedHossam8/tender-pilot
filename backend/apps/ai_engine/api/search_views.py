"""
Search API Views
Unified search across projects, services, and providers
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from apps.ai_engine.services import AISearchService
import logging

logger = logging.getLogger(__name__)


class UnifiedSearchView(APIView):
    """
    Unified search endpoint across all content types
    """
    permission_classes = [AllowAny]
    
    @swagger_auto_schema(
        operation_description="Search across projects, services, and providers",
        manual_parameters=[
            openapi.Parameter(
                'q', openapi.IN_QUERY,
                description="Search query",
                type=openapi.TYPE_STRING,
                required=True
            ),
            openapi.Parameter(
                'types', openapi.IN_QUERY,
                description="Content types to search (comma-separated): projects,services,providers",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'category', openapi.IN_QUERY,
                description="Filter by category",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'budget_min', openapi.IN_QUERY,
                description="Minimum budget (for projects)",
                type=openapi.TYPE_NUMBER,
                required=False
            ),
            openapi.Parameter(
                'budget_max', openapi.IN_QUERY,
                description="Maximum budget (for projects)",
                type=openapi.TYPE_NUMBER,
                required=False
            ),
            openapi.Parameter(
                'price_min', openapi.IN_QUERY,
                description="Minimum price (for services)",
                type=openapi.TYPE_NUMBER,
                required=False
            ),
            openapi.Parameter(
                'price_max', openapi.IN_QUERY,
                description="Maximum price (for services)",
                type=openapi.TYPE_NUMBER,
                required=False
            ),
            openapi.Parameter(
                'skills', openapi.IN_QUERY,
                description="Filter by skills (comma-separated)",
                type=openapi.TYPE_STRING,
                required=False
            ),
            openapi.Parameter(
                'limit', openapi.IN_QUERY,
                description="Maximum results per type (default: 20)",
                type=openapi.TYPE_INTEGER,
                required=False
            ),
        ],
        responses={
            200: openapi.Response(
                description="Search results",
                examples={
                    "application/json": {
                        "projects": [
                            {
                                "id": 1,
                                "type": "project",
                                "title": "Build a mobile app",
                                "description": "Need an iOS app...",
                                "client": "John Doe",
                                "budget_range": "$5000-$10000",
                                "deadline": "2026-02-01",
                                "status": "open"
                            }
                        ],
                        "services": [],
                        "providers": [],
                        "metadata": {
                            "query": "mobile app",
                            "total_results": 1
                        }
                    }
                }
            ),
            400: "Invalid parameters"
        }
    )
    def get(self, request):
        """
        GET /api/v1/search/?q=query&types=projects,services&limit=20
        """
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response(
                {'error': 'Query parameter "q" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse search types
        types_param = request.query_params.get('types', '')
        if types_param:
            search_types = [t.strip() for t in types_param.split(',')]
        else:
            search_types = ['projects', 'services', 'providers']
        
        # Validate search types
        valid_types = {'projects', 'services', 'providers'}
        search_types = [t for t in search_types if t in valid_types]
        
        if not search_types:
            return Response(
                {'error': 'Invalid search types. Valid options: projects, services, providers'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Build filters
        filters = {}
        
        if request.query_params.get('category'):
            filters['category'] = request.query_params.get('category')
        
        # Budget filters (for projects)
        if request.query_params.get('budget_min'):
            try:
                filters['budget_min'] = float(request.query_params.get('budget_min'))
            except ValueError:
                pass
        
        if request.query_params.get('budget_max'):
            try:
                filters['budget_max'] = float(request.query_params.get('budget_max'))
            except ValueError:
                pass
        
        # Price filters (for services)
        if request.query_params.get('price_min'):
            try:
                filters['price_min'] = float(request.query_params.get('price_min'))
            except ValueError:
                pass
        
        if request.query_params.get('price_max'):
            try:
                filters['price_max'] = float(request.query_params.get('price_max'))
            except ValueError:
                pass
        
        # Skills filter
        if request.query_params.get('skills'):
            filters['skills'] = [
                s.strip() 
                for s in request.query_params.get('skills').split(',')
            ]
        
        # Hourly rate filters (for providers)
        if request.query_params.get('hourly_rate_min'):
            try:
                filters['hourly_rate_min'] = float(request.query_params.get('hourly_rate_min'))
            except ValueError:
                pass
        
        if request.query_params.get('hourly_rate_max'):
            try:
                filters['hourly_rate_max'] = float(request.query_params.get('hourly_rate_max'))
            except ValueError:
                pass
        
        # Results limit
        limit = 20
        if request.query_params.get('limit'):
            try:
                limit = int(request.query_params.get('limit'))
                limit = min(max(limit, 1), 50)  # Clamp between 1 and 50
            except ValueError:
                pass
        
        # Perform search
        try:
            search_service = AISearchService()
            results = search_service.semantic_search(
                query=query,
                search_types=search_types,
                filters=filters,
                limit=limit
            )
            
            return Response(results, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return Response(
                {'error': 'Search failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SimilarItemsView(APIView):
    """
    Get similar items recommendations
    """
    permission_classes = [AllowAny]
    
    @swagger_auto_schema(
        operation_description="Get similar items based on a specific item",
        manual_parameters=[
            openapi.Parameter(
                'type', openapi.IN_QUERY,
                description="Item type: project, service, or provider",
                type=openapi.TYPE_STRING,
                required=True
            ),
            openapi.Parameter(
                'id', openapi.IN_QUERY,
                description="Item ID",
                type=openapi.TYPE_INTEGER,
                required=True
            ),
            openapi.Parameter(
                'limit', openapi.IN_QUERY,
                description="Number of similar items to return (default: 5)",
                type=openapi.TYPE_INTEGER,
                required=False
            ),
        ],
        responses={
            200: "List of similar items",
            400: "Invalid parameters",
            404: "Item not found"
        }
    )
    def get(self, request):
        """
        GET /api/v1/search/similar/?type=project&id=1&limit=5
        """
        item_type = request.query_params.get('type', '').strip()
        item_id = request.query_params.get('id', '').strip()
        
        if not item_type or not item_id:
            return Response(
                {'error': 'Parameters "type" and "id" are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if item_type not in ['project', 'service', 'provider']:
            return Response(
                {'error': 'Invalid type. Valid options: project, service, provider'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            item_id = int(item_id)
        except ValueError:
            return Response(
                {'error': 'Invalid ID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse limit
        limit = 5
        if request.query_params.get('limit'):
            try:
                limit = int(request.query_params.get('limit'))
                limit = min(max(limit, 1), 10)  # Clamp between 1 and 10
            except ValueError:
                pass
        
        # Get similar items
        try:
            search_service = AISearchService()
            similar_items = search_service.suggest_similar(
                item_type=item_type,
                item_id=item_id,
                limit=limit
            )
            
            return Response({
                'similar_items': similar_items,
                'count': len(similar_items)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Similar items error: {e}")
            
            # Check if it's a not found error
            if 'DoesNotExist' in str(e):
                return Response(
                    {'error': f'{item_type.capitalize()} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(
                {'error': 'Failed to find similar items'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AutoCategorizeView(APIView):
    """
    Auto-categorize content using AI
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Automatically categorize content using AI",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['text', 'content_type'],
            properties={
                'text': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Content to categorize'
                ),
                'content_type': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Type of content: project or service',
                    enum=['project', 'service']
                ),
            },
        ),
        responses={
            200: openapi.Response(
                description="Category suggestion",
                examples={
                    "application/json": {
                        "category": "Web Development",
                        "confidence": "high"
                    }
                }
            ),
            400: "Invalid parameters"
        }
    )
    def post(self, request):
        """
        POST /api/v1/search/auto-categorize/
        Body: {"text": "Build a Django website", "content_type": "project"}
        """
        text = request.data.get('text', '').strip()
        content_type = request.data.get('content_type', '').strip()
        
        if not text or not content_type:
            return Response(
                {'error': 'Both "text" and "content_type" are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if content_type not in ['project', 'service']:
            return Response(
                {'error': 'Invalid content_type. Valid options: project, service'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            search_service = AISearchService()
            category = search_service.auto_categorize(text, content_type)
            
            return Response({
                'category': category,
                'confidence': 'high' if category and category != 'Other' else 'low'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Auto-categorize error: {e}")
            return Response(
                {'error': 'Categorization failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExtractSkillsView(APIView):
    """
    Extract skills from text using AI
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Extract skills/keywords from text using AI",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['text'],
            properties={
                'text': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Text to extract skills from'
                ),
                'max_skills': openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description='Maximum number of skills to extract (default: 10)',
                    default=10
                ),
            },
        ),
        responses={
            200: openapi.Response(
                description="Extracted skills",
                examples={
                    "application/json": {
                        "skills": ["Python", "Django", "React", "PostgreSQL"],
                        "count": 4
                    }
                }
            ),
            400: "Invalid parameters"
        }
    )
    def post(self, request):
        """
        POST /api/v1/search/extract-skills/
        Body: {"text": "I need a Python Django developer...", "max_skills": 10}
        """
        text = request.data.get('text', '').strip()
        
        if not text:
            return Response(
                {'error': 'Parameter "text" is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        max_skills = request.data.get('max_skills', 10)
        try:
            max_skills = int(max_skills)
            max_skills = min(max(max_skills, 1), 20)  # Clamp between 1 and 20
        except (ValueError, TypeError):
            max_skills = 10
        
        try:
            search_service = AISearchService()
            skills = search_service.extract_skills(text, max_skills)
            
            return Response({
                'skills': skills,
                'count': len(skills)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Skill extraction error: {e}")
            return Response(
                {'error': 'Skill extraction failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
