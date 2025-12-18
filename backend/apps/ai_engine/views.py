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

<<<<<<< HEAD
=======
# Create your views here.
from django.http import JsonResponse
from .services import ask_gemini

def ai_chat_view(request):
    if request.method == "POST":
        user_message = request.POST.get("message")
        answer = ask_gemini(user_message)
        return JsonResponse({"reply": answer})
    
    return render(request, "chat.html")
>>>>>>> 5b52b1fdea9bbbd9341d131a7ec4c31cb6b4309c
