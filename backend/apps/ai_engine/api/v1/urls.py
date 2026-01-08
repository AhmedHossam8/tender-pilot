"""
AI Engine URL Configuration

Maps URLs to AI-powered API endpoints.

Endpoints:
- GET  /api/v1/ai/health/                         - Health check
- POST /api/v1/ai/project/<uuid>/analyze/         - Analyze project
- POST /api/v1/ai/project/<uuid>/compliance/      - Check compliance
- POST /api/v1/ai/project/<uuid>/outline/         - Generate outline
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
    ProjectAnalysisView,
    ComplianceCheckView,
    ProposalOutlineView,
    RegenerateResponseView,
    RegenerationHistoryView,
    AIMatchProvidersView,
    AIGenerateCoverLetterView,
    AISuggestPricingView,
)
from apps.ai_engine.api.v1.analytics import (
    UsageAnalyticsView,
    UserUsageAnalyticsView,
    PerformanceAnalyticsView,
    CostAnalyticsView,
    PromptPerformanceView,
)
from apps.ai_engine.api.analytics_views import (
    AIUsageStatsView,
    MatchAccuracyView,
    DailySummaryView,
    CostTrendView,
    FeatureUsageView,
    GenerateDailySummaryView,
)
from apps.ai_engine.api.search_views import (
    UnifiedSearchView,
    SimilarItemsView,
    AutoCategorizeView,
    ExtractSkillsView,
)

app_name = 'ai_engine'

urlpatterns = [
    # Health check
    path(
        'health/',
        AIHealthCheckView.as_view(),
        name='health-check'
    ),
    
    # Project analysis
    path(
        'project/<uuid:project_id>/analyze/',
        ProjectAnalysisView.as_view(),
        name='project-analyze'
    ),
    
    # Compliance checking
    path(
        'project/<uuid:project_id>/compliance/',
        ComplianceCheckView.as_view(),
        name='compliance-check'
    ),
    
    # Proposal outline generation
    path(
        'project/<uuid:project_id>/outline/',
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
    
    # AI Matching endpoints for ServiceHub
    path(
        'match/project/<uuid:project_id>/providers/',
        AIMatchProvidersView.as_view(),
        name='match-providers'
    ),
    
    path(
        'bid/generate-cover-letter/',
        AIGenerateCoverLetterView.as_view(),
        name='generate-cover-letter'
    ),
    
    path(
        'bid/suggest-pricing/',
        AISuggestPricingView.as_view(),
        name='suggest-pricing'
    ),
    
    # New analytics endpoints for Day 4
    path(
        'analytics/stats/',
        AIUsageStatsView.as_view(),
        name='analytics-stats'
    ),
    
    path(
        'analytics/match-accuracy/',
        MatchAccuracyView.as_view(),
        name='analytics-match-accuracy'
    ),
    
    path(
        'analytics/daily-summary/',
        DailySummaryView.as_view(),
        name='analytics-daily-summary'
    ),
    
    path(
        'analytics/cost-trend/',
        CostTrendView.as_view(),
        name='analytics-cost-trend'
    ),
    
    path(
        'analytics/feature-usage/',
        FeatureUsageView.as_view(),
        name='analytics-feature-usage'
    ),
    
    path(
        'analytics/generate-summary/',
        GenerateDailySummaryView.as_view(),
        name='analytics-generate-summary'
    ),
    
    # Search endpoints
    path(
        'search/',
        UnifiedSearchView.as_view(),
        name='unified-search'
    ),
    
    path(
        'search/similar/',
        SimilarItemsView.as_view(),
        name='similar-items'
    ),
    
    path(
        'search/auto-categorize/',
        AutoCategorizeView.as_view(),
        name='auto-categorize'
    ),
    
    path(
        'search/extract-skills/',
        ExtractSkillsView.as_view(),
        name='extract-skills'
    ),
]