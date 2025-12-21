from django.urls import path
from apps.ai_engine.views import AIHealthCheckView

urlpatterns = [
    path('health/', AIHealthCheckView.as_view()),
]