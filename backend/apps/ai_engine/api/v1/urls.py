from django.urls import path
from apps.ai_engine.views import AIHealthCheckView, AIExecutionView

urlpatterns = [
    path('health/', AIHealthCheckView.as_view()),
    path("execute/", AIExecutionView.as_view(), name="ai-execute"),
]