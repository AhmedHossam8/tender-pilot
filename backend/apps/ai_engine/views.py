"""
AI Engine Views

API views for AI-powered features.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status


class AIHealthCheckView(APIView):
    """
    Health check endpoint for the AI engine.
    
    GET /api/ai/health/
    """
    
    def get(self, request):
        """Check if the AI engine is operational."""
        try:
            from .services import get_ai_provider
            
            provider = get_ai_provider()
            is_available = provider.is_available()
            
            return Response({
                "status": "ok" if is_available else "degraded",
                "provider": "openai",
                "available": is_available,
            })
        except Exception as e:
            return Response(
                {
                    "status": "error",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
