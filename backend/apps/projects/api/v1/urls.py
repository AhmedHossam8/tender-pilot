from rest_framework.routers import DefaultRouter
from apps.projects.views import ProjectViewSet, ProjectRequirementViewSet
from apps.documents.views import ProjectDocumentViewSet

router = DefaultRouter()
router.register(r"", ProjectViewSet, basename="project")
router.register(r"project-documents", ProjectDocumentViewSet, basename="project-document")
router.register(r"project-requirements", ProjectRequirementViewSet, basename="project-requirement")

urlpatterns = router.urls