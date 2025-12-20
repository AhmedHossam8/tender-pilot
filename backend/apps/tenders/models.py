from django.db import models

class Tender(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("open", "Open"),
        ("closed", "Closed"),
    ]

    title = models.CharField(max_length=255)
    issuing_entity = models.CharField(max_length=255)
    deadline = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class TenderDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ("pdf", "PDF"),
        ("word", "Word"),
        ("excel", "Excel"),
        ("other", "Other"),
    ]

    tender = models.ForeignKey(Tender, on_delete=models.CASCADE, related_name="documents")
    file_url = models.URLField(max_length=500)  # Supabase Storage path / URL
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES, default="pdf")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tender.title} - {self.document_type}"