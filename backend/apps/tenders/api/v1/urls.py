from rest_framework.routers import DefaultRouter
from .views import TenderViewSet

router = DefaultRouter()
router.register(r"tenders", TenderViewSet, basename="tender")

urlpatterns = router.urls
