from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .filters import ServiceFilter
from .models import Service, ServicePackage, Booking
from .serializers import ServiceSerializer, ServicePackageSerializer, BookingSerializer
from rest_framework.permissions import IsAuthenticated
from apps.users.models import User

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.prefetch_related('packages').select_related('created_by').all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ServiceFilter
    search_fields = ["name", "description"]
    ordering_fields = ["packages__price", "name"]

    def get_permissions(self):
        """Allow unauthenticated users to list and retrieve services"""
        if self.action in ['list', 'retrieve']:
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return super().get_permissions()

    def perform_create(self, serializer):
        if self.request.user.user_type not in [User.UserType.PROVIDER, User.UserType.BOTH]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You must be a provider to create services.")
        serializer.save(created_by=self.request.user)


class ServicePackageViewSet(viewsets.ModelViewSet):
    queryset = ServicePackage.objects.all()
    serializer_class = ServicePackageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter packages by service_id from URL"""
        service_id = self.kwargs.get('service_pk')
        if service_id:
            return ServicePackage.objects.filter(service_id=service_id)
        return ServicePackage.objects.all()

    def perform_create(self, serializer):
        """Auto-set service from URL parameter"""
        service_id = self.kwargs.get('service_pk')
        if service_id:
            serializer.save(service_id=service_id)
        else:
            serializer.save()


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "user__id", "package__service__id"]
    search_fields = ["package__name", "package__service__name"]
    ordering_fields = ["scheduled_for", "status"]

    def get_queryset(self):
        user = self.request.user
    
        # Admin sees everything
        if user.is_superuser or user.user_type == User.UserType.ADMIN:
            return Booking.objects.all()
    
        # Provider: bookings for their services
        if user.user_type == User.UserType.PROVIDER:
            return Booking.objects.filter(
                package__service__created_by=user
            )
    
        # Both: provider + client bookings
        if user.user_type == User.UserType.BOTH:
            return Booking.objects.filter(
                models.Q(user=user) |
                models.Q(package__service__created_by=user)
            ).distinct()
    
        # Client: only own bookings
        return Booking.objects.filter(user=user)

    def perform_create(self, serializer):
        if self.request.user.user_type not in [User.UserType.CLIENT, User.UserType.BOTH]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You must be a client to book a service.")
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def change_status(self, request, pk=None):
        booking = self.get_object()
        new_status = request.data.get("status")

        allowed_transitions = {
            "pending": ["confirmed", "cancelled"],
            "confirmed": ["completed", "cancelled"],
            "completed": [],
            "cancelled": [],
        }

        if new_status not in allowed_transitions[booking.status]:
            return Response(
                {"error": f"Cannot move from {booking.status} to {new_status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = new_status
        booking.save()
        return Response({"status": booking.status})
