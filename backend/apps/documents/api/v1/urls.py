from rest_framework.routers import DefaultRouter
from apps.documents.views import TenderDocumentViewSet

router = DefaultRouter()
router.register(r"tender-documents", TenderDocumentViewSet, basename="tender-document")

urlpatterns = router.urls
