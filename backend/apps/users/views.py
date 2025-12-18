from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView
from rest_framework import generics, permissions
from .serializers import LoginSerializer , RegisterSerializer , UserProfileSeralizer
from rest_framework.permissions import AllowAny , IsAuthenticated 
from rest_framework.response import Response


class RegisterAPIView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class LoginAPIView(TokenObtainPairView):
    serializer_class = LoginSerializer


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]


    def get(self,request):
        serializer = UserProfileSeralizer(request.user)
        return Response(serializer.data)