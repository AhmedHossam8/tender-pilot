from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.bids.views import BidViewSet, BidMilestoneViewSet, BidAttachmentViewSet

router = DefaultRouter()
router.register(r'', BidViewSet, basename='bid')
router.register(r'milestones', BidMilestoneViewSet, basename='bid-milestone')
router.register(r'attachments', BidAttachmentViewSet, basename='bid-attachment')

urlpatterns = [
    path('', include(router.urls)),
]
