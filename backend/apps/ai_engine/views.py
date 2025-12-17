from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from .services import ask_gemini

def ai_chat_view(request):
    if request.method == "POST":
        user_message = request.POST.get("message")
        answer = ask_gemini(user_message)
        return JsonResponse({"reply": answer})
    
    return render(request, "chat.html")