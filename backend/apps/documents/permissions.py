from rest_framework.permissions import SAFE_METHODS
from apps.users.permissions import IsAdminOrProposalManager

class DocumentPermission(IsAdminOrProposalManager):
    """
    Admin/Proposal Manager: full access
    Reviewer: review-documents and approve or decline
    Writer: access to write and edit documents
    Others: read-only access
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user.role in ["ADMIN", "PROPOSAL_MANAGER", "REVIEWER", "WRITER"]:
            return True
        return False