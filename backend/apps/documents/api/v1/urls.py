from rest_framework.routers import DefaultRouter
from apps.documents.views import ProjectDocumentViewSet

router = DefaultRouter()
router.register(r"project-documents", ProjectDocumentViewSet, basename="project-document")

urlpatterns = router.urls
