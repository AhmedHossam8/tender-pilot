from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.viewsets import UserViewSet, UserProfileViewSet
from apps.users.views import RegisterAPIView, LoginAPIView

# Create a DRF router
router = DefaultRouter()
router.register("users", UserViewSet, basename="user")          # Admin CRUD
router.register("profile", UserProfileViewSet, basename="profile")  # Read-only profile

# Combine router URLs with action-based URLs
urlpatterns = [
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(router.urls)),  # include all ViewSet routes
]
