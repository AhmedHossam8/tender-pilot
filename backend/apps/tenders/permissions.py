from rest_framework.permissions import BasePermission
from .models import TenderUser

class IsTenderManager(BasePermission):
    def has_permission(self, request, view):
        tender_id = view.kwargs.get("tender_id")
        if not tender_id:
            return False
        

        return TenderUser.objects.filter(
            tender_id=tender_id,
            user=request.user,
            role=TenderUser.TenderRole.MANAGER,
            is_active=True
        ).exists()