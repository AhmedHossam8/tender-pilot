from rest_framework import serializers
from .models import Service, ServicePackage, Booking
from apps.users.serializers import UserSerializer


# LIGHT service serializer (used inside packages)
class ServiceMiniSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Service
        fields = ["id", "name", "created_by"]


# Package serializer (includes service)
class ServicePackageSerializer(serializers.ModelSerializer):
    service = ServiceMiniSerializer(read_only=True)

    class Meta:
        model = ServicePackage
        fields = ["id", "name", "price", "duration_hours", "service"]


# Full service serializer (used in services list/details)
class ServiceSerializer(serializers.ModelSerializer):
    packages = ServicePackageSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Service
        fields = ["id", "name", "description", "packages", "created_by"]

    def create(self, validated_data):
        service = Service.objects.create(**validated_data)
        return service


# Booking serializer
class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    package = ServicePackageSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "package",
            "status",
            "scheduled_for",
            "created_at",
        ]
        read_only_fields = ("user", "id", "created_at")
