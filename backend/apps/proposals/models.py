from django.db import models
from django.contrib.auth import get_user_model
from apps.projects.models import Project
from django.conf import settings
from django.utils import timezone

User = get_user_model()


class Status(models.TextChoices):
    DRAFT = "draft", "Draft"
    IN_REVIEW = "in_review", "In Review"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    SUBMITTED = "submitted", "Submitted"


class Proposal(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    # Stores structured AI review feedback for the proposal
    ai_feedback = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['project']),
            models.Index(fields=['created_at']),
        ]

    # Define valid status transitions
    STATUS_TRANSITIONS = {
        Status.DRAFT: [Status.IN_REVIEW],
        Status.IN_REVIEW: [Status.APPROVED, Status.REJECTED],
        Status.APPROVED: [Status.SUBMITTED],
        Status.REJECTED: [Status.DRAFT],
    }

    def change_status(self, new_status: str, user=None, action=None, extra_info=None):
        """
        Change the proposal status with validation and logging.
        """
        if self.status == new_status:
            # No change
            return

        allowed = self.STATUS_TRANSITIONS.get(self.status, [])
        if new_status not in allowed:
            raise ValueError(f"Cannot change status from {self.status} to {new_status}")

        old_status = self.status
        self.status = new_status
        self.save(update_fields=['status', 'updated_at'])

        # Create audit log
        if user and action:
            ProposalAuditLog.objects.create(
                proposal=self,
                user=user,
                action=action,
                extra_info=extra_info
            )

        return old_status, new_status


class ProposalSection(models.Model):
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=100)  # e.g., Background, Methodology
    content = models.TextField(blank=True)
    ai_generated = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['proposal']),
        ]

    def __str__(self):
        return f"{self.name} - {self.proposal.title}"


class ProposalDocument(models.Model):
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='proposals/')
    type = models.CharField(max_length=10, choices=[('docx', 'DOCX'), ('pdf', 'PDF')])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['proposal']),
        ]


class ProposalAuditLog(models.Model):
    ACTION_CHOICES = [
        ("submit_for_review", "Submit for Review"),
        ("approve", "Approve"),
        ("reject", "Reject"),
        ("submit", "Submit Proposal"),
        ("regenerate_section", "Regenerate Section"),
        ("generate_document", "Generate Document"),
    ]

    proposal = models.ForeignKey("Proposal", on_delete=models.CASCADE, related_name="audit_logs")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    section_name = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    extra_info = models.TextField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['proposal', 'timestamp']),
        ]
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.proposal} | {self.action} | {self.user}"
