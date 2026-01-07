from .models import Notification

def create_notification(*, recipient, type, title, message, obj=None):
    Notification.objects.create(
        recipient=recipient,
        type=type,
        title=title,
        message=message,
        related_object_id=str(obj.id) if obj else None,
        related_object_type=obj.__class__.__name__ if obj else None,
    )