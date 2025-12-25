"""
Tests for AI Engine Permissions

Tests the permission system for AI features including:
- CanUseAI permission
- CanUseAdvancedAI permission
- CanViewAIAnalytics permission
- CanRegenerateAI permission
- Quota checking functions
"""

import pytest
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.ai_engine.permissions import (
    CanUseAI,
    CanUseAdvancedAI,
    CanViewAIAnalytics,
    CanRegenerateAI,
    check_ai_quota,
    check_feature_access,
    get_user_ai_limits,
)

User = get_user_model()


class PermissionsTestCase(TestCase):
    """Test AI permissions."""
    
    def setUp(self):
        """Create test users with different roles."""
        self.factory = APIRequestFactory()
        
        # Create users with different roles
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            full_name='Admin User',
            role=User.Role.ADMIN
        )
        
        self.proposal_manager = User.objects.create_user(
            email='manager@test.com',
            password='testpass123',
            full_name='Manager User',
            role=User.Role.PROPOSAL_MANAGER
        )
        
        self.reviewer = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123',
            full_name='Reviewer User',
            role=User.Role.REVIEWER
        )
    
    def test_can_use_ai_authenticated(self):
        """Test that authenticated users can use AI."""
        permission = CanUseAI()
        
        # Create a mock request
        request = self.factory.get('/api/v1/ai/test')
        request.user = self.reviewer
        
        # Mock view
        view = APIView()
        
        # Check permission
        self.assertTrue(permission.has_permission(request, view))
    
    def test_can_use_ai_unauthenticated(self):
        """Test that unauthenticated users cannot use AI."""
        permission = CanUseAI()
        
        # Create a mock request without user
        request = self.factory.get('/api/v1/ai/test')
        from django.contrib.auth.models import AnonymousUser
        request.user = AnonymousUser()
        
        view = APIView()
        
        # Check permission - should be denied
        self.assertFalse(permission.has_permission(request, view))
    
    def test_can_use_advanced_ai_admin(self):
        """Test that admins can use advanced AI features."""
        permission = CanUseAdvancedAI()
        
        request = self.factory.get('/api/v1/ai/advanced')
        request.user = self.admin
        
        view = APIView()
        
        self.assertTrue(permission.has_permission(request, view))
    
    def test_can_use_advanced_ai_proposal_manager(self):
        """Test that proposal managers can use advanced AI features."""
        permission = CanUseAdvancedAI()
        
        request = self.factory.get('/api/v1/ai/advanced')
        request.user = self.proposal_manager
        
        view = APIView()
        
        self.assertTrue(permission.has_permission(request, view))
    
    def test_can_use_advanced_ai_reviewer(self):
        """Test that reviewers CANNOT use advanced AI features."""
        permission = CanUseAdvancedAI()
        
        request = self.factory.get('/api/v1/ai/advanced')
        request.user = self.reviewer
        
        view = APIView()
        
        # Reviewers should not have access
        self.assertFalse(permission.has_permission(request, view))
    
    def test_can_view_analytics_admin(self):
        """Test that admins can view all analytics."""
        permission = CanViewAIAnalytics()
        
        request = self.factory.get('/api/v1/ai/analytics')
        request.user = self.admin
        
        view = APIView()
        
        self.assertTrue(permission.has_permission(request, view))
    
    def test_can_view_analytics_reviewer(self):
        """Test that reviewers CANNOT view analytics."""
        permission = CanViewAIAnalytics()
        
        request = self.factory.get('/api/v1/ai/analytics')
        request.user = self.reviewer
        
        view = APIView()
        
        self.assertFalse(permission.has_permission(request, view))
    
    def test_can_regenerate_admin(self):
        """Test that admins can regenerate AI responses."""
        permission = CanRegenerateAI()
        
        request = self.factory.post('/api/v1/ai/regenerate')
        request.user = self.admin
        
        view = APIView()
        
        self.assertTrue(permission.has_permission(request, view))
    
    def test_can_regenerate_reviewer(self):
        """Test that reviewers CANNOT regenerate AI responses."""
        permission = CanRegenerateAI()
        
        request = self.factory.post('/api/v1/ai/regenerate')
        request.user = self.reviewer
        
        view = APIView()
        
        self.assertFalse(permission.has_permission(request, view))
    
    def test_check_ai_quota_returns_true(self):
        """Test quota check function (currently always returns True)."""
        has_quota, message = check_ai_quota(self.admin)
        
        self.assertTrue(has_quota)
        self.assertEqual(message, "Quota check passed")
    
    def test_check_feature_access_analysis(self):
        """Test that all roles can access analysis feature."""
        # All roles should have access to analysis
        self.assertTrue(check_feature_access(self.admin, 'analysis'))
        self.assertTrue(check_feature_access(self.proposal_manager, 'analysis'))
        self.assertTrue(check_feature_access(self.reviewer, 'analysis'))
    
    def test_check_feature_access_regenerate(self):
        """Test that only ADMIN and PROPOSAL_MANAGER can regenerate."""
        self.assertTrue(check_feature_access(self.admin, 'regenerate'))
        self.assertTrue(check_feature_access(self.proposal_manager, 'regenerate'))
        self.assertFalse(check_feature_access(self.reviewer, 'regenerate'))
    
    def test_check_feature_access_analytics(self):
        """Test that only ADMIN and PROPOSAL_MANAGER can view analytics."""
        self.assertTrue(check_feature_access(self.admin, 'analytics'))
        self.assertTrue(check_feature_access(self.proposal_manager, 'analytics'))
        self.assertFalse(check_feature_access(self.reviewer, 'analytics'))
    
    def test_get_user_ai_limits_admin(self):
        """Test that admins get higher limits."""
        limits = get_user_ai_limits(self.admin)
        
        self.assertIn('requests_per_hour', limits)
        self.assertIn('tokens_per_day', limits)
        self.assertIn('can_regenerate', limits)
        
        # Admin should have high limits
        self.assertEqual(limits['requests_per_hour'], 100)
        self.assertEqual(limits['tokens_per_day'], 500000)
        self.assertTrue(limits['can_regenerate'])
    
    def test_get_user_ai_limits_reviewer(self):
        """Test that reviewers get lower limits."""
        limits = get_user_ai_limits(self.reviewer)
        
        # Reviewer should have lower limits
        self.assertEqual(limits['requests_per_hour'], 20)
        self.assertEqual(limits['tokens_per_day'], 50000)
        self.assertFalse(limits['can_regenerate'])
    
    def test_get_user_ai_limits_proposal_manager(self):
        """Test that proposal managers get medium limits."""
        limits = get_user_ai_limits(self.proposal_manager)
        
        # Proposal manager should have medium limits
        self.assertEqual(limits['requests_per_hour'], 50)
        self.assertEqual(limits['tokens_per_day'], 200000)
        self.assertTrue(limits['can_regenerate'])


class PermissionIntegrationTestCase(TestCase):
    """Integration tests for permissions with views."""
    
    def setUp(self):
        """Set up test users."""
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            full_name='Admin User',
            role=User.Role.ADMIN
        )
        
        self.reviewer = User.objects.create_user(
            email='reviewer@test.com',
            password='testpass123',
            full_name='Reviewer User',
            role=User.Role.REVIEWER
        )
    
    def test_permission_blocks_reviewer_from_advanced(self):
        """Test that advanced AI endpoints block reviewers."""
        from rest_framework.test import APIClient
        
        client = APIClient()
        client.force_authenticate(user=self.reviewer)
        
        # This would be an advanced feature endpoint
        # For now, we're just testing the permission logic
        # Real integration test would hit actual endpoint
        
        permission = CanUseAdvancedAI()
        factory = APIRequestFactory()
        request = factory.get('/test')
        request.user = self.reviewer
        
        self.assertFalse(permission.has_permission(request, None))


# Run tests with: python manage.py test apps.ai_engine.test_permissions
