from rest_framework.permissions import BasePermission
from .models import User

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and str(request.user.role).upper() == "ADMIN"
        )

class IsProposalManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and str(request.user.role).upper() == "PROPOSAL_MANAGER"
        )

class IsReviewer(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and str(request.user.role).upper() == "REVIEWER"
        )

class IsAdminOrProposalManager(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and str(request.user.role).upper() in ("ADMIN", "PROPOSAL_MANAGER")
        )

class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: allow admins full access,
    otherwise only the object owner can access.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if str(request.user.role).upper() == "ADMIN":
            return True
        return obj.id == request.user.id
