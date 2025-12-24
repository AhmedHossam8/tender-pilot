from rest_framework.permissions import SAFE_METHODS
from apps.users.permissions import IsAdminOrProposalManager

class DocumentPermission(IsAdminOrProposalManager):
    """
    Admin/Proposal Manager: full access
    Reviewer: read-only access
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user.role in ["ADMIN", "PROPOSAL_MANAGER"]:
            return True
        if request.user.is_authenticated and request.user.role == "REVIEWER" and request.method in SAFE_METHODS:
            return True
        return False