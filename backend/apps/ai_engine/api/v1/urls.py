"""
AI Engine URL Configuration

Maps URLs to AI-powered API endpoints.

Endpoints:
- GET  /api/v1/ai/health/                        - Health check
- POST /api/v1/ai/tender/<uuid>/analyze/        - Analyze tender
- POST /api/v1/ai/tender/<uuid>/compliance/     - Check compliance
- POST /api/v1/ai/tender/<uuid>/outline/        - Generate outline
"""

from django.urls import path
from apps.ai_engine.views import (
    AIHealthCheckView,
    TenderAnalysisView,
    ComplianceCheckView,
    ProposalOutlineView,
)

app_name = 'ai_engine'

urlpatterns = [
    # Health check
    path(
        'health/',
        AIHealthCheckView.as_view(),
        name='health-check'
    ),
    
    # Tender analysis
    path(
        'tender/<uuid:tender_id>/analyze/',
        TenderAnalysisView.as_view(),
        name='tender-analyze'
    ),
    
    # Compliance checking
    path(
        'tender/<uuid:tender_id>/compliance/',
        ComplianceCheckView.as_view(),
        name='compliance-check'
    ),
    
    # Proposal outline generation
    path(
        'tender/<uuid:tender_id>/outline/',
        ProposalOutlineView.as_view(),
        name='proposal-outline'
    ),
]