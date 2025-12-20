from django.db import models


########### Tender Table ###############3
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

########### TenderDocument Table###############
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
        related_name="documents"
    )

    file_url = models.URLField(max_length=500)
    document_type = models.CharField(
        max_length=20,
        choices=DOCUMENT_TYPE_CHOICES,
        default="pdf"
    )

    # AI-related fields
    extracted_text = models.TextField(
        blank=True,
        null=True,
        help_text="Raw text extracted from the document using OCR / parsing"
    )

    ai_summary = models.TextField(
        blank=True,
        null=True,
        help_text="AI-generated summary of the document"
    )

    ai_processed = models.BooleanField(
        default=False,
        help_text="Indicates whether AI processing is completed"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tender.title} - {self.document_type}"



########### TenderRequirements Table ###############
class TenderRequirement(models.Model):
    tender = models.ForeignKey(
        Tender,
        on_delete=models.CASCADE,
        related_name="requirements"
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    is_mandatory = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tender.title} - {self.title}"