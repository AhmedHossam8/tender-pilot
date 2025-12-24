from common.viewsets import BaseModelViewSet
from rest_framework import permissions
from .models import User
from .serializers import AdminUserSerializer, UserProfileSerializer
from .permissions import IsAdmin

class UserViewSet(BaseModelViewSet):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["role", "is_active", "email"]
    ordering_fields = ["created_at", "email"]
    filter_backends = BaseModelViewSet.filter_backends + [
        'rest_framework.filters.OrderingFilter',
    ]
    ordering_fields = ["created_at", "last_login", "email"]

class UserProfileViewSet(BaseModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get"]  # read-only for own profile

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)
