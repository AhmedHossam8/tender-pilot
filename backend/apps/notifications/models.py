import uuid
from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Notification(models.Model):
    class Type(models.TextChoices):
        NEW_BID = "new_bid", "New Bid"
        BID_ACCEPTED = "bid_accepted", "Bid Accepted"
        PROJECT_AWARDED = "project_awarded", "Project Awarded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    type = models.CharField(max_length=50, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()

    related_object_id = models.CharField(max_length=255, blank=True, null=True)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
