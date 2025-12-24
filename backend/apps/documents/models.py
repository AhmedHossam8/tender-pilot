from django.db import models
from apps.tenders.models import Tender

DOCUMENT_TYPE_CHOICES = [
    ("pdf", "PDF"),
    ("word", "Word"),
    ("excel", "Excel"),
    ("other", "Other"),
]

class TenderDocument(models.Model):
    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="tender_documents_docs"
    )
    file = models.FileField(upload_to="tender_documents/")
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default="pdf")

    extracted_text = models.TextField(blank=True, null=True)
    ai_summary = models.TextField(blank=True, null=True)
    ai_processed = models.BooleanField(default=False)
    ai_processed_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["ai_processed"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["tender", "file"], name="unique_document_per_tender_docs")
        ]

    def __str__(self):
        return f"{self.tender.title} - {self.file.name}"
