from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .handlers import AIRequestHandler

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

class AIExecutionView(APIView):
    """
    Generic AI execution endpoint.
    """
    def post(self, request):
        handler = AIRequestHandler()
        try:
            result = handler.execute(request.data)
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)