from django.db import models
from django.contrib.auth import get_user_model
from apps.tenders.models import Tender
from django.conf import settings

User = get_user_model()

class Proposal(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("in_review", "In Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("submitted", "Submitted"),
    ]
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    status = models.CharField(
        max_length=50,
        choices=STATUS_CHOICES,
        default='draft'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_by', 'status']),
        ]

class ProposalSection(models.Model):
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=100)  # e.g., Background, Methodology
    content = models.TextField(blank=True)
    ai_generated = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.proposal.title}"

class ProposalDocument(models.Model):
    proposal = models.ForeignKey(Proposal, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='proposals/')
    type = models.CharField(max_length=10, choices=[('docx','DOCX'),('pdf','PDF')])
    created_at = models.DateTimeField(auto_now_add=True)

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
    section_name = models.CharField(max_length=255, blank=True, null=True)  # optional for sections
    timestamp = models.DateTimeField(auto_now_add=True)
    extra_info = models.TextField(blank=True, null=True)  # optional for any notes

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.proposal} | {self.action} | {self.user}"