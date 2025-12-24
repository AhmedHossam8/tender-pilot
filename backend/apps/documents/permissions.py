from rest_framework.permissions import SAFE_METHODS
from apps.users.permissions import IsAdminOrProposalManger

class DocumentPermission(IsAdminOrProposalManger):
    """
    Admin/Proposal Manager: full access
    Reviewer: read-only access
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user.role in ["Admin", "Proposal Manager"]:
            return True
        if request.user.is_authenticated and request.user.role == "Reviewer" and request.method in SAFE_METHODS:
            return True
        return False
