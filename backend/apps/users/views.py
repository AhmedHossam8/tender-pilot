from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView 
from rest_framework.generics import RetrieveUpdateAPIView , ListAPIView , RetrieveUpdateDestroyAPIView
from rest_framework import generics, permissions
from .serializers import LoginSerializer , RegisterSerializer , UserProfileSerializer , AdminUserSerializer
from rest_framework.permissions import AllowAny , IsAuthenticated 
from rest_framework.response import Response
from .permissions import IsAdmin, IsOwnerOrAdmin
from .models import User

class RegisterAPIView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class LoginAPIView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self,request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
class UpdateReadApiView(generics.RetrieveUpdateAPIView):

        serializer_class = UserProfileSerializer
        permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

        def get_object(self):
            return self.request.user


class AdminListAPIView(ListAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]


class AdminUserDetailAPIView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]

    def destroy(self, request, *args, **kwargs):
         user = self.get_object()
         user.is_active = False
         user.save()
         return Response(
        {"detail": "User deactivated successfully"},
        status=204
    )