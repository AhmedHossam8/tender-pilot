"""
Demo scenarios and responses for AI Engine testing and demonstrations.
"""

import uuid
from django.http import HttpRequest


def is_demo_mode(request: HttpRequest) -> bool:
    """
    Check if the request is in demo mode.
    
    Demo mode is enabled when the 'demo' query parameter is set to 'true'.
    """
    return request.GET.get('demo') == 'true'


def get_demo_response(operation: str, tender_id: str) -> dict:
    """
    Generate a demo response for the given operation and tender ID.
    
    Args:
        operation: The operation type (e.g., 'tender_analysis')
        tender_id: The tender identifier
    
    Returns:
        A dictionary containing demo response data
    """
    if operation == 'tender_analysis':
        return {
            'request_id': f'demo-{uuid.uuid4().hex[:8]}',
            'demo_mode': True,
            'analysis': {
                'summary': 'This is a demo analysis for tender evaluation.',
                'risk_level': 'low',
                'recommendations': ['Review contract terms', 'Verify supplier credentials'],
                'score': 85
            },
            'tender_id': tender_id
        }
    else:
        return {
            'request_id': f'demo-{uuid.uuid4().hex[:8]}',
            'demo_mode': True,
            'message': f'Demo response for operation: {operation}'
        }


# Demo data constants
DEMO_TENDERS = {
    'highway-construction': {
        'id': 'highway-construction',
        'title': 'Highway Construction Project',
        'description': 'Construction of a new highway segment',
        'budget': 1000000,
        'deadline': '2024-12-31'
    }
}

DEMO_RESPONSES = {
    'tender_analysis': {
        'highway-construction': get_demo_response('tender_analysis', 'highway-construction')
    }
}