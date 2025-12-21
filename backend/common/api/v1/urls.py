from django.urls import path, include

urlpatterns = [
    path('ai/', include('ai_engine.api.v1.urls')),
    # path('tenders/', include('tenders.api.v1.urls')),
    # path('users/', include('users.api.v1.urls')),
]