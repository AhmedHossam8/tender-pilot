from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import ServiceViewSet, ServicePackageViewSet, BookingViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet)
router.register(r'bookings', BookingViewSet)

service_router = routers.NestedDefaultRouter(router, r'services', lookup='service')
service_router.register(r'packages', ServicePackageViewSet, basename='service-packages')

urlpatterns = router.urls + service_router.urls