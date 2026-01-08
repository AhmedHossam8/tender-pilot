from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, UnreadCountView

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversations')
router.register(r'unread-count', UnreadCountView, basename='unread-count')

urlpatterns = [
    path('', include(router.urls)),
]