from django.urls import path
from apps.core.views import CategoryListAPIView, SkillListAPIView

urlpatterns = [
    path('categories/', CategoryListAPIView.as_view(), name='category-list'),
    path('skills/', SkillListAPIView.as_view(), name='skill-list'),
]