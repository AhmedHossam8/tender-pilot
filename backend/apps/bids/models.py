from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from apps.projects.models import Project

User = get_user_model()


class BidStatus(models.TextChoices):
    """Status choices for bids in the ServiceHub marketplace"""
    PENDING = "pending", "Pending"
    SHORTLISTED = "shortlisted", "Shortlisted"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    WITHDRAWN = "withdrawn", "Withdrawn"


class Bid(models.Model):
    """
    Bid model - Transformed from Proposal for ServiceHub marketplace.
    Represents a service provider's bid on a client's project.
    """
    # Relationships
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE,
        related_name='bids',
        help_text="The project this bid is for"
    )
    service_provider = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='submitted_bids',
        help_text="The service provider submitting the bid"
    )
    
    # Bid content
    cover_letter = models.TextField(
        help_text="The service provider's cover letter/proposal text"
    )
    
    # Pricing and timeline
    proposed_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Proposed price for the project"
    )
    proposed_timeline = models.IntegerField(
        help_text="Proposed number of days to complete the project"
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=BidStatus.choices,
        default=BidStatus.PENDING,
        db_index=True,
    )
    
    # AI features
    ai_score = models.FloatField(
        null=True,
        blank=True,
        help_text="AI-calculated match score (0-100)"
    )
    ai_feedback = models.JSONField(
        blank=True,
        null=True,
        help_text="Structured AI feedback and analysis"
    )
    
    # Milestones (stored as JSON for flexibility)
    milestones = models.JSONField(
        blank=True,
        null=True,
        help_text="Breakdown of project milestones with deliverables and timelines"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['service_provider', 'status']),
            models.Index(fields=['project']),
            models.Index(fields=['created_at']),
            models.Index(fields=['ai_score']),
        ]
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'service_provider'],
                name='unique_bid_per_project_provider'
            )
        ]

    # Define valid status transitions
    STATUS_TRANSITIONS = {
        BidStatus.PENDING: [BidStatus.SHORTLISTED, BidStatus.REJECTED, BidStatus.WITHDRAWN],
        BidStatus.SHORTLISTED: [BidStatus.ACCEPTED, BidStatus.REJECTED, BidStatus.WITHDRAWN],
        BidStatus.ACCEPTED: [BidStatus.REJECTED],  # Allow reversing acceptance
        BidStatus.REJECTED: [],  # Terminal state
        BidStatus.WITHDRAWN: [],  # Terminal state
    }

    def change_status(self, new_status: str, user=None, action=None, extra_info=None):
        """
        Change the bid status with validation and logging.
        
        Args:
            new_status: The new status to transition to
            user: The user performing the action
            action: The action being performed
            extra_info: Additional information about the status change
            
        Returns:
            tuple: (old_status, new_status)
            
        Raises:
            ValueError: If the status transition is not allowed
        """
        if self.status == new_status:
            # No change
            return

        allowed = self.STATUS_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise ValueError(
                f"Cannot change status from {self.status} to {new_status}. "
                f"Allowed transitions: {allowed}"
            )

        old_status = self.status
        self.status = new_status
        self.save(update_fields=['status', 'updated_at'])

        # Create audit log
        if user and action:
            BidAuditLog.objects.create(
                bid=self,
                user=user,
                action=action,
                extra_info=extra_info
            )

        return old_status, new_status

    def __str__(self):
        return f"Bid by {self.service_provider} on {self.project.title}"


class BidMilestone(models.Model):
    """
    Individual milestone within a bid.
    Alternative to storing milestones as JSON in the Bid model.
    """
    bid = models.ForeignKey(
        Bid,
        on_delete=models.CASCADE,
        related_name='milestone_details'
    )
    order = models.IntegerField(
        default=0,
        help_text="Order of the milestone in the project timeline"
    )
    title = models.CharField(
        max_length=255,
        help_text="Milestone name/title"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed description of what will be delivered"
    )
    duration_days = models.IntegerField(
        help_text="Number of days allocated for this milestone"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Payment amount for this milestone"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['bid', 'order']),
        ]

    def __str__(self):
        return f"Milestone {self.order}: {self.title}"


class BidAttachment(models.Model):
    """
    File attachments for bids (e.g., portfolio samples, references, documents)
    """
    bid = models.ForeignKey(
        Bid,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(
        upload_to='bids/attachments/%Y/%m/%d/',
        help_text="Uploaded file"
    )
    file_name = models.CharField(
        max_length=255,
        help_text="Original filename"
    )
    file_type = models.CharField(
        max_length=50,
        blank=True,
        help_text="File MIME type or extension"
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        help_text="Optional description of the file"
    )
    file_size = models.IntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['bid']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.file_name} - {self.bid}"


class BidAuditLog(models.Model):
    """
    Audit trail for all bid-related actions and status changes
    """
    ACTION_CHOICES = [
        ("submit", "Submit Bid"),
        ("shortlist", "Shortlist"),
        ("accept", "Accept Bid"),
        ("reject", "Reject Bid"),
        ("withdraw", "Withdraw Bid"),
        ("update_amount", "Update Amount"),
        ("update_timeline", "Update Timeline"),
        ("add_attachment", "Add Attachment"),
        ("ai_score_calculated", "AI Score Calculated"),
        ("client_viewed", "Viewed by Client"),
    ]

    bid = models.ForeignKey(
        Bid,
        on_delete=models.CASCADE,
        related_name="audit_logs"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    extra_info = models.TextField(
        blank=True,
        null=True,
        help_text="Additional information about the action"
    )

    class Meta:
        indexes = [
            models.Index(fields=['bid', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
        ]
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.bid} | {self.action} | {self.user} | {self.timestamp}"
