from rest_framework.routers import DefaultRouter
from .views import ServiceViewSet, ServicePackageViewSet, BookingViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet)
router.register(r'packages', ServicePackageViewSet)
router.register(r'bookings', BookingViewSet)

urlpatterns = router.urls
