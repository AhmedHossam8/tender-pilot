from rest_framework.permissions import BasePermission
from .models import Project

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
