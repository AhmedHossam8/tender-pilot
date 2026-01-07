from rest_framework import serializers
from .models import Service, ServicePackage, Booking


class ServicePackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicePackage
        fields = "__all__"


class ServiceSerializer(serializers.ModelSerializer):
    packages = ServicePackageSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = "__all__"


class BookingSerializer(serializers.ModelSerializer):
    package = serializers.PrimaryKeyRelatedField(queryset=ServicePackage.objects.all())

    class Meta:
        model = Booking
        fields = ["id", "user", "package", "status", "scheduled_for", "created_at"]
        read_only_fields = ("user", "id", "created_at")
        depth = 1
