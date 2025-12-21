from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('users/', include('apps.users.api.v1.urls')),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('ai/', include('apps.ai_engine.api.v1.urls')),
    # path('tenders/', include('apps.tenders.api.v1.urls')),
]