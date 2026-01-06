from django.urls import path
from .views import CategoryListAPIView, SkillListAPIView

urlpatterns = [
    path("categories/", CategoryListAPIView.as_view(), name="categories-list"),
    path("skills/", SkillListAPIView.as_view(), name="skills-list"),
]
