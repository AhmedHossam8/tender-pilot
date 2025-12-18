from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services.ai_base import test_ai

class AIHealthCheckView(APIView):
    def get(self, request):
        try:
            reply = test_ai("Say hello")
            return Response({"status": "ok", "reply": reply})
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)