"""
AI Engine Permissions

Custom permission classes for controlling access to AI-powered features.

These permissions check:
1. User authentication
2. User role/capabilities
3. AI feature availability (future: governance rules)
4. Usage quotas (future: when subscription system ready)
"""

from rest_framework.permissions import BasePermission
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class CanUseAI(BasePermission):
    """
    Permission to use AI features.
    
    Checks:
    - User is authenticated
    - User role allows AI access
    - AI is globally enabled (from settings)
    - (Future) User hasn't exceeded quota
    - (Future) User's subscription allows AI access
    
    Usage:
        class MyAIView(APIView):
            permission_classes = [CanUseAI]
    """
    
    def has_permission(self, request, view):
        """
        Check if user can access AI features.
        """
        # 1. Must be authenticated
        if not request.user or not request.user.is_authenticated:
            logger.warning("AI access denied: User not authenticated")
            return False
        
        # 2. Check if AI is globally enabled
        ai_enabled = getattr(settings, 'AI_ENABLED', True)
        if not ai_enabled:
            logger.warning(f"AI access denied: AI globally disabled for user {request.user.id}")
            return False
        
        # 3. Check user role - all authenticated users can use AI for now
        # When governance is ready, this will check specific role permissions
        user_role = str(request.user.role).upper()
        
        # All roles can use AI (ADMIN, PROPOSAL_MANAGER, REVIEWER)
        # If needed in future, restrict to specific roles:
        # if user_role not in ['ADMIN', 'PROPOSAL_MANAGER']:
        #     return False
        
        logger.debug(f"AI access granted: user={request.user.id}, role={user_role}")
        return True


class CanUseAdvancedAI(BasePermission):
    """
    Permission for advanced AI features (detailed analysis, regeneration).
    
    More restrictive than CanUseAI.
    Reserved for ADMIN and PROPOSAL_MANAGER roles.
    
    Usage:
        class AdvancedAIView(APIView):
            permission_classes = [CanUseAdvancedAI]
    """
    
    def has_permission(self, request, view):
        """
        Check if user can access advanced AI features.
        """
        # Must pass basic AI permission first
        if not CanUseAI().has_permission(request, view):
            return False
        
        # Check role - only ADMIN and PROPOSAL_MANAGER
        user_role = str(request.user.role).upper()
        
        if user_role not in ['ADMIN', 'PROPOSAL_MANAGER']:
            logger.warning(
                f"Advanced AI access denied: user={request.user.id}, "
                f"role={user_role}"
            )
            return False
        
        logger.debug(f"Advanced AI access granted: user={request.user.id}, role={user_role}")
        return True


class CanViewAIAnalytics(BasePermission):
    """
    Permission to view AI usage analytics.
    
    Only ADMIN users can view analytics.
    PROPOSAL_MANAGERs can view their own usage only.
    
    Usage:
        class AIAnalyticsView(APIView):
            permission_classes = [CanViewAIAnalytics]
    """
    
    def has_permission(self, request, view):
        """
        Check if user can view AI analytics.
        """
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = str(request.user.role).upper()
        
        # ADMIN can view all analytics
        if user_role == 'ADMIN':
            return True
        
        # PROPOSAL_MANAGER can view their own analytics
        # This is checked in has_object_permission
        if user_role == 'PROPOSAL_MANAGER':
            return True
        
        logger.warning(
            f"AI analytics access denied: user={request.user.id}, "
            f"role={user_role}"
        )
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can view specific analytics data.
        """
        user_role = str(request.user.role).upper()
        
        # ADMIN can view everything
        if user_role == 'ADMIN':
            return True
        
        # PROPOSAL_MANAGER can only view their own data
        if user_role == 'PROPOSAL_MANAGER':
            # Check if the data belongs to this user
            if hasattr(obj, 'user') and obj.user == request.user:
                return True
        
        return False


class CanRegenerateAI(BasePermission):
    """
    Permission to regenerate AI responses.
    
    This is a costly operation, so it's restricted to:
    - ADMIN (always)
    - PROPOSAL_MANAGER (with rate limits)
    
    Usage:
        class RegenerateView(APIView):
            permission_classes = [CanRegenerateAI]
    """
    
    def has_permission(self, request, view):
        """
        Check if user can regenerate AI responses.
        """
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if AI is enabled
        ai_enabled = getattr(settings, 'AI_ENABLED', True)
        if not ai_enabled:
            return False
        
        user_role = str(request.user.role).upper()
        
        # Only ADMIN and PROPOSAL_MANAGER can regenerate
        if user_role not in ['ADMIN', 'PROPOSAL_MANAGER']:
            logger.warning(
                f"AI regeneration denied: user={request.user.id}, "
                f"role={user_role}"
            )
            return False
        
        # TODO: When governance is ready, check quota limits
        # - Max regenerations per day
        # - Token budget remaining
        
        logger.debug(f"AI regeneration granted: user={request.user.id}, role={user_role}")
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can regenerate specific AI response.
        """
        user_role = str(request.user.role).upper()
        
        # ADMIN can regenerate anything
        if user_role == 'ADMIN':
            return True
        
        # PROPOSAL_MANAGER can only regenerate their own responses
        if user_role == 'PROPOSAL_MANAGER':
            if hasattr(obj, 'request') and hasattr(obj.request, 'user'):
                if obj.request.user == request.user:
                    return True
        
        return False


# Utility functions for permission checks (can be used in views)

def check_ai_quota(user) -> tuple[bool, str]:
    """
    Check if user has remaining AI quota.
    
    Returns:
        (has_quota: bool, message: str)
    
    TODO: Implement when subscription system is ready
    Currently always returns True
    """
    # When subscription system is ready, check:
    # - Daily token limit
    # - Monthly request limit
    # - Subscription tier features
    
    return True, "Quota check passed"


def check_feature_access(user, feature: str) -> bool:
    """
    Check if user's subscription/role allows access to specific AI feature.
    
    Args:
        user: User object
        feature: Feature name ('analysis', 'compliance', 'outline', 'regenerate')
    
    Returns:
        bool: True if user can access feature
    
    TODO: Integrate with subscription system when ready
    """
    # When subscription system is ready, check tier features
    # For now, check role only
    
    user_role = str(user.role).upper()
    
    # Feature access matrix
    feature_roles = {
        'analysis': ['ADMIN', 'PROPOSAL_MANAGER', 'REVIEWER'],
        'compliance': ['ADMIN', 'PROPOSAL_MANAGER', 'REVIEWER'],
        'outline': ['ADMIN', 'PROPOSAL_MANAGER'],
        'regenerate': ['ADMIN', 'PROPOSAL_MANAGER'],
        'analytics': ['ADMIN', 'PROPOSAL_MANAGER'],
    }
    
    allowed_roles = feature_roles.get(feature, [])
    return user_role in allowed_roles


def get_user_ai_limits(user) -> dict:
    """
    Get AI usage limits for user based on role/subscription.
    
    Returns:
        dict with limit information
    
    TODO: Load from subscription system when ready
    """
    user_role = str(user.role).upper()
    
    # Default limits by role
    limits = {
        'ADMIN': {
            'requests_per_hour': 100,
            'requests_per_day': 500,
            'tokens_per_day': 500000,
            'can_regenerate': True,
            'max_regenerations_per_request': 5,
        },
        'PROPOSAL_MANAGER': {
            'requests_per_hour': 50,
            'requests_per_day': 200,
            'tokens_per_day': 200000,
            'can_regenerate': True,
            'max_regenerations_per_request': 3,
        },
        'REVIEWER': {
            'requests_per_hour': 20,
            'requests_per_day': 100,
            'tokens_per_day': 50000,
            'can_regenerate': False,
            'max_regenerations_per_request': 0,
        },
    }
    
    return limits.get(user_role, limits['REVIEWER'])
