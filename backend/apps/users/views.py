from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView 
from rest_framework.generics import RetrieveUpdateAPIView , ListAPIView , RetrieveUpdateDestroyAPIView
from rest_framework import generics, permissions
from .serializers import LoginSerializer , RegisterSerializer , UserProfileSeralizer , AdminUserSerializer
from rest_framework.permissions import AllowAny , IsAuthenticated 
from rest_framework.response import Response
from .permissions import IsAdmin , IsOwnerorAdmin
from .models import User

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
    
class UpdateReadApiView(generics.RetrieveUpdateAPIView):

        serializer_class = UserProfileSeralizer
        permission_classes = [IsAuthenticated , IsOwnerorAdmin ]

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