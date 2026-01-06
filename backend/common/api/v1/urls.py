from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('users/', include('apps.users.api.v1.urls')),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('ai/', include('apps.ai_engine.api.v1.urls')),
    path('projects/', include('apps.projects.api.v1.urls')),
    path('documents/', include('apps.documents.api.v1.urls')),
    path('proposals/', include('apps.proposals.api.v1.urls')),
    path('core/', include('apps.core.api.v1.urls')),
]