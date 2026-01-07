from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView 
from rest_framework.generics import (
     RetrieveUpdateAPIView,
     ListAPIView, 
     RetrieveUpdateDestroyAPIView,
     RetrieveAPIView,
)
from rest_framework import generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q

from .serializers import (
    LoginSerializer, 
    RegisterSerializer,
    UserSerializer,
    UserProfileSerializer,
    PublicProfileSerializer,
    AdminUserSerializer,
    SkillSerializer,
)
from .permissions import IsAdmin, IsOwnerOrAdmin
from .models import User, UserProfile, Skill


class RegisterAPIView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer
    # throttle_classes = [RegisterThrottle]


class LoginAPIView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    # throttle_classes = [LoginThrottle]


class ProfileAPIView(APIView):
    """Get current user's profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserProfileDetailView(RetrieveUpdateAPIView):
    """View and update current user's profile"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Get or create profile for current user
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class PublicProfileView(RetrieveAPIView):
    """View public profile of any user"""
    serializer_class = PublicProfileSerializer
    permission_classes = [permissions.AllowAny]
    queryset = UserProfile.objects.select_related('user').prefetch_related('skills')
    lookup_field = 'user__id'
    lookup_url_kwarg = 'user_id'


class ProviderStatsView(APIView):
    """Get provider statistics (completed projects, ratings, etc.)"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # TODO: Update these queries once projects/bids/reviews are implemented
        stats = {
            'user_id': user_id,
            'user_type': user.user_type,
            'completed_projects': 0,  # Will be: Project.objects.filter(...).count()
            'active_bids': 0,  # Will be: Bid.objects.filter(...).count()
            'average_rating': 0.0,  # Will be: Review.objects.filter(...).aggregate(Avg('rating'))
            'total_reviews': 0,  # Will be: Review.objects.filter(...).count()
            'success_rate': 0.0,  # Calculation TBD
            'profile_completeness': user.profile.ai_profile_score if hasattr(user, 'profile') else 0,
        }

        return Response(stats)


class ClientStatsView(APIView):
    """Get client statistics (posted projects, hired count, etc.)"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # TODO: Update these queries once projects/bookings are implemented
        stats = {
            'user_id': user_id,
            'user_type': user.user_type,
            'posted_projects': 0,  # Will be: Project.objects.filter(client=user).count()
            'active_projects': 0,  # Will be: Project.objects.filter(client=user, status='open').count()
            'total_bookings': 0,  # Will be: Booking.objects.filter(client=user).count()
            'total_spent': 0.0,  # Calculation TBD
        }

        return Response(stats)


class SkillListView(ListAPIView):
    """List all available skills"""
    serializer_class = SkillSerializer
    permission_classes = [permissions.AllowAny]
    queryset = Skill.objects.all()


class UpdateReadApiView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_object(self):
        return self.request.user


class AdminListAPIView(ListAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    # throttle_classes = [AdminThrottle]


class AdminUserDetailAPIView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    # throttle_classes = [AdminThrottle]

    def destroy(self, request, *args, **kwargs):
         user = self.get_object()
         user.is_active = False
         user.save()
         return Response(
        {"detail": "User deactivated successfully"},
        status=204
    )