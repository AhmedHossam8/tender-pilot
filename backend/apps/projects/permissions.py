from rest_framework.permissions import BasePermission
from rest_framework import permissions
from .models import Project, ProjectRequirement
from apps.bids.models import Bid

class IsProjectOwnerOrReadOnly(BasePermission):
    """
    Permission to allow only the creator of a project to edit or delete it.
    Read-only access is allowed for all users.
    """

    def has_permission(self, request, view):
        # Safe methods are always allowed
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        # For create action, any authenticated user can create a project
        if view.action == "create":
            return request.user and request.user.is_authenticated

        # For other actions (update, partial_update, destroy), defer to object-level check
        return True

    def has_object_permission(self, request, view, obj):
        # Safe methods are always allowed
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        # Only the creator of the project can update/delete
        return obj.created_by == request.user

class IsProjectOwnerOrAssignedProvider(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Read permissions for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Owner can always edit
        if obj.created_by == request.user:
            return True
        
        # Assigned provider can update in-progress projects
        assigned_provider = obj.bids.filter(status='accepted').first()
        if assigned_provider and assigned_provider.service_provider == request.user:
            return obj.status == 'in_progress'

        return False
