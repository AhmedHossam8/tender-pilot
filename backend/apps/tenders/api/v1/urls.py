from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.tenders.views import TenderViewSet, TenderDocumentViewSet, TenderRequirementViewSet

router = DefaultRouter()
router.register(r'tenders', TenderViewSet, basename='tender')
router.register(r'documents', TenderDocumentViewSet, basename='document')
router.register(r'requirements', TenderRequirementViewSet, basename='requirement')

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path("tenders/<int:tender_id>/assign-user/",AssignUserToTenderAPIView.as_view()),
    path("tenders/<int:tender_id>/users/",TenderUsersListAPIView.as_view())
]
