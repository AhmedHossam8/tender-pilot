from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .filters import ServiceFilter
from .models import Service, ServicePackage, Booking
from .serializers import ServiceSerializer, ServicePackageSerializer, BookingSerializer
from rest_framework.permissions import IsAuthenticated


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ServiceFilter
    search_fields = ["name", "description"]
    ordering_fields = ["packages__price", "name"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ServicePackageViewSet(viewsets.ModelViewSet):
    queryset = ServicePackage.objects.all()
    serializer_class = ServicePackageSerializer
    permission_classes = [IsAuthenticated]


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "user__id", "package__service__id"]
    search_fields = ["package__name", "package__service__name"]
    ordering_fields = ["scheduled_for", "status"]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
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
