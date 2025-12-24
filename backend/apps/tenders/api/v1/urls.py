from rest_framework.routers import DefaultRouter
from apps.tenders.views import TenderViewSet, TenderRequirementViewSet
from apps.documents.views import TenderDocumentViewSet

router = DefaultRouter()
router.register(r"tenders", TenderViewSet, basename="tender")
router.register(r"tender-documents", TenderDocumentViewSet, basename="tender-document")
router.register(r"tender-requirements", TenderRequirementViewSet, basename="tender-requirement")

urlpatterns = router.urls