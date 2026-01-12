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
    
    # Computed fields for frontend compatibility
    title = serializers.CharField(source='name', read_only=True)
    provider_name = serializers.SerializerMethodField()
    base_price = serializers.SerializerMethodField()
    delivery_time = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ["id", "name", "title", "description", "packages", 
                  "created_by", "provider_name", "base_price", 
                  "delivery_time", "average_rating", "created_at"]
    
    def get_provider_name(self, obj):
        """Get the name of the service provider"""
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.email
        return None
    
    def get_base_price(self, obj):
        """Get the minimum price from packages"""
        packages = obj.packages.all()
        if packages.exists():
            return float(min(package.price for package in packages))
        return 0.0  # Return 0 instead of None for services without packages
    
    def get_delivery_time(self, obj):
        """Get the minimum delivery time in days from packages"""
        packages = obj.packages.all()
        if packages.exists():
            min_hours = min(float(package.duration_hours) for package in packages)
            # Convert hours to days, round up
            return int((min_hours + 23) // 24)
        return 0  # Return 0 instead of None for services without packages
    
    def get_average_rating(self, obj):
        """Calculate average rating - placeholder for now"""
        # TODO: Implement rating system
        return None

    def create(self, validated_data):
        service = Service.objects.create(**validated_data)
        return service


# Booking serializer
class BookingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    package = ServicePackageSerializer(read_only=True)
    package_id = serializers.PrimaryKeyRelatedField(
        queryset=ServicePackage.objects.all(),
        source='package',
        write_only=True,
        required=False,
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "user",
            "package",
            "package_id",
            "status",
            "scheduled_for",
            "created_at",
        ]
        read_only_fields = ("user", "id", "created_at")