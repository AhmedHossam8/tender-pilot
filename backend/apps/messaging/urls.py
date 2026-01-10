from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, UnreadCountView

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversations')

urlpatterns = [
    path('', include(router.urls)),
    path('unread-count/', UnreadCountView.as_view({'get': 'list'}), name='unread-count'),
]