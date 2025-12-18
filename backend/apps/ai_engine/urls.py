from django.urls import path
from .views import AIHealthCheckView

urlpatterns = [
    path('health/', AIHealthCheckView.as_view()),
]
