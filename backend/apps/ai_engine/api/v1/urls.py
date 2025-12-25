"""
AI Engine URL Configuration

Maps URLs to AI-powered API endpoints.

Endpoints:
- GET  /api/v1/ai/health/                          - Health check
- POST /api/v1/ai/tender/<uuid>/analyze/          - Analyze tender
- POST /api/v1/ai/tender/<uuid>/compliance/       - Check compliance
- POST /api/v1/ai/tender/<uuid>/outline/          - Generate outline
- POST /api/v1/ai/response/<uuid>/regenerate/     - Regenerate AI response
- GET  /api/v1/ai/response/<uuid>/history/        - Get regeneration history
- GET  /api/v1/ai/analytics/usage                 - Usage analytics
- GET  /api/v1/ai/analytics/usage/user/<uuid>     - User usage analytics
- GET  /api/v1/ai/analytics/performance           - Performance analytics
- GET  /api/v1/ai/analytics/costs                 - Cost analytics
- GET  /api/v1/ai/analytics/prompts               - Prompt performance
"""

from django.urls import path
from apps.ai_engine.views import (
    AIHealthCheckView,
    TenderAnalysisView,
    ComplianceCheckView,
    ProposalOutlineView,
    RegenerateResponseView,
    RegenerationHistoryView,
)
from apps.ai_engine.api.v1.analytics import (
    UsageAnalyticsView,
    UserUsageAnalyticsView,
    PerformanceAnalyticsView,
    CostAnalyticsView,
    PromptPerformanceView,
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
    
    # Response regeneration
    path(
        'response/<uuid:response_id>/regenerate/',
        RegenerateResponseView.as_view(),
        name='response-regenerate'
    ),
    
    # Regeneration history
    path(
        'response/<uuid:response_id>/history/',
        RegenerationHistoryView.as_view(),
        name='regeneration-history'
    ),
    
    # Analytics endpoints
    path(
        'analytics/usage/',
        UsageAnalyticsView.as_view(),
        name='analytics-usage'
    ),
    
    path(
        'analytics/usage/user/<uuid:user_id>/',
        UserUsageAnalyticsView.as_view(),
        name='analytics-user-usage'
    ),
    
    path(
        'analytics/performance/',
        PerformanceAnalyticsView.as_view(),
        name='analytics-performance'
    ),
    
    path(
        'analytics/costs/',
        CostAnalyticsView.as_view(),
        name='analytics-costs'
    ),
    
    path(
        'analytics/prompts/',
        PromptPerformanceView.as_view(),
        name='analytics-prompts'
    ),
]