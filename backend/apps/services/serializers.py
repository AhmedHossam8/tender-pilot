from rest_framework import serializers
from .models import Service, ServicePackage, Booking
from apps.users.serializers import UserSerializer


class ServicePackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicePackage
        fields = ["id", "name", "price", "duration_hours"]


class ServiceSerializer(serializers.ModelSerializer):
    packages = ServicePackageSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Service
        fields = ["id", "name", "description", "packages", "created_by"]
    
    def create(self, validated_data):
        packages_data = validated_data.pop("packages", [])
        service = Service.objects.create(**validated_data)
        for pkg_data in packages_data:
            ServicePackage.objects.create(service=service, **pkg_data)
        return service


class BookingSerializer(serializers.ModelSerializer):
    package = serializers.PrimaryKeyRelatedField(queryset=ServicePackage.objects.all())

    class Meta:
        model = Booking
        fields = ["id", "user", "package", "status", "scheduled_for", "created_at"]
        read_only_fields = ("user", "id", "created_at")
        depth = 1
