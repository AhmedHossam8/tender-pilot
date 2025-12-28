"""
AI Engine Demo Module

Provides demo scenarios, sample data, and pre-canned responses for
demonstrations and testing without consuming actual AI API credits.

Usage:
    from ai_engine.demo import get_demo_response, is_demo_mode
    
    if is_demo_mode(request):
        return get_demo_response('tender_analysis', tender_id)
"""

from .scenarios import (
    get_demo_response,
    is_demo_mode,
    DEMO_TENDERS,
    DEMO_RESPONSES,
)

__all__ = [
    'get_demo_response',
    'is_demo_mode',
    'DEMO_TENDERS',
    'DEMO_RESPONSES',
]
