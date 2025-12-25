from django.db import models
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.contrib.postgres.indexes import GinIndex

User = get_user_model()

class Tender(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("open", "Open"),
        ("closed", "Closed"),
    ]

    title = models.CharField(max_length=255)
    issuing_entity = models.CharField(max_length=255)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft", db_index=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tenders', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "deadline"]),
        ]

    def __str__(self):
        return self.title


class TenderDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ("pdf", "PDF"),
        ("word", "Word"),
        ("excel", "Excel"),
        ("other", "Other"),
    ]

    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="tender_documents_tenders"
    )

    file_url = models.URLField(max_length=500)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default="pdf")

    extracted_text = models.TextField(blank=True, null=True)
    ai_summary = models.TextField(blank=True, null=True)
    ai_processed = models.BooleanField(default=False)
    ai_processed_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tender_documents', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["tender", "file_url"],
                name="unique_document_per_tender_tenders"
            ),
        ]
        indexes = [
            models.Index(fields=["ai_processed"]),
        ]

    def __str__(self):
        return f"{self.tender.title} - {self.document_type}"


class TenderRequirement(models.Model):
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name="requirements")

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_mandatory = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tender_requirements', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["tender", "title"],
                name="unique_requirement_per_tender"
            ),
        ]

    def __str__(self):
        return f"{self.tender.title} - {self.title}"
