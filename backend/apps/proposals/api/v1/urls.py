from rest_framework.routers import DefaultRouter
from apps.proposals.views import ProposalViewSet
from apps.proposals.viewsets import ProposalSectionViewSet

router = DefaultRouter()
router.register(r'', ProposalViewSet, basename='proposal')
router.register(r'sections', ProposalSectionViewSet, basename='proposal-section')

urlpatterns = router.urls