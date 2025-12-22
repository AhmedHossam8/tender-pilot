from django.urls import path
from apps.tenders.views import AssignUserToTenderAPIView , TenderUsersListAPIView


urlpatterns=[
    path("tenders/<int:tender_id>/assign-user/",AssignUserToTenderAPIView.as_view()),
    path("tenders/<int:tender_id>/users/",TenderUsersListAPIView.as_view())
]