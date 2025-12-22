from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.viewsets import UserViewSet, UserProfileViewSet
from apps.users.views import RegisterAPIView, LoginAPIView, ProfileAPIView , UpdateReadApiView,AdminListAPIView,AdminUserDetailAPIView

# Create a DRF router
router = DefaultRouter()
router.register("users", UserViewSet, basename="user")          # Admin CRUD
router.register("profile", UserProfileViewSet, basename="profile")  # Read-only profile

# Combine router URLs with action-based URLs
urlpatterns = [
    path('register/',RegisterAPIView.as_view()),
    path('login/',LoginAPIView.as_view()),
    path('refresh/',TokenRefreshView.as_view()),
    path('profile/',ProfileAPIView.as_view()),
    path('me/',UpdateReadApiView.as_view()),
    path('admin/userslist/',AdminListAPIView.as_view()),
    path('admin/users/<int:pk>/',AdminUserDetailAPIView.as_view())
]
