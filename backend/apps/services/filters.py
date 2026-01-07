import django_filters
from .models import Service

class ServiceFilter(django_filters.FilterSet):
    packages_price = django_filters.NumberFilter(field_name="packages__price")

    class Meta:
        model = Service
        fields = ['name']
