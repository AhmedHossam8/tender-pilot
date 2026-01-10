from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users.viewsets import UserViewSet, UserProfileViewSet
from apps.users.views import (
    RegisterAPIView, 
    LoginAPIView, 
    ProfileAPIView, 
    UpdateReadApiView,
    AdminListAPIView,
    AdminUserDetailAPIView,
    UserProfileDetailView,
    PublicProfileView,
    ProviderStatsView,
    ClientStatsView,
    SkillListView,
    ChangePasswordView,
    UpdateUserInfoView,
)
from apps.users.api.v1.reviews import ReviewViewSet

# Create a DRF router
router = DefaultRouter()
router.register("users", UserViewSet, basename="user")          # Admin CRUD
router.register("profile", UserProfileViewSet, basename="profile")  # Read-only profile
router.register("reviews", ReviewViewSet, basename="review")  # Reviews CRUD

# Combine router URLs with action-based URLs
urlpatterns = [
    # Authentication
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Current user profile
    path('profile/', ProfileAPIView.as_view(), name='current_profile'),
    path('me/', UpdateReadApiView.as_view(), name='user_me'),
    path('me/profile/', UserProfileDetailView.as_view(), name='my_profile_detail'),
    path('me/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('me/update-info/', UpdateUserInfoView.as_view(), name='update_user_info'),
    
    # Public profiles and stats
    path('profiles/<int:user_id>/', PublicProfileView.as_view(), name='public_profile'),
    path('profiles/<int:user_id>/provider-stats/', ProviderStatsView.as_view(), name='provider_stats'),
    path('profiles/<int:user_id>/client-stats/', ClientStatsView.as_view(), name='client_stats'),
    
    # Skills
    path('skills/', SkillListView.as_view(), name='skills_list'),
    
    # Admin
    path('admin/userslist/', AdminListAPIView.as_view(), name='admin_users_list'),
    path('admin/users/<int:pk>/', AdminUserDetailAPIView.as_view(), name='admin_user_detail'),
]
