from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterAPIView, LoginAPIView , ProfileAPIView , UpdateReadApiView,AdminListAPIView,AdminUserDetailAPIView

urlpatterns = [
    path('register/',RegisterAPIView.as_view()),
    path('login/',LoginAPIView.as_view()),
    path('refresh/',TokenRefreshView.as_view()),
    path('profile/',ProfileAPIView.as_view()),
    path('me/',UpdateReadApiView.as_view()),
    path('admin/userslist/',AdminListAPIView.as_view()),
    path('admin/users/<int:pk>/',AdminUserDetailAPIView.as_view())
]