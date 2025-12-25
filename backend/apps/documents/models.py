from django.db import models
from django.contrib.auth import get_user_model
from apps.tenders.models import Tender
from django.contrib.postgres.indexes import GinIndex
import pdfplumber
import docx
import os

User = get_user_model()

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
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_documents', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["ai_processed"]),
            models.Index(fields=["tender", "is_active"]),
            models.Index(fields=["created_by"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["tender", "file"], name="unique_document_per_tender_docs")
        ]

    def __str__(self):
        return f"{self.tender.title} - {self.file.name}"

    def extract_text(self):
        """Extract text from the uploaded file."""
        if not self.file:
            return ""
        
        file_path = self.file.path
        if not os.path.exists(file_path):
            return ""
        
        try:
            if self.document_type == "pdf":
                return self._extract_pdf_text(file_path)
            elif self.document_type in ["word", "docx"]:
                return self._extract_docx_text(file_path)
            else:
                return ""
        except Exception as e:
            # Log error but don't fail
            print(f"Error extracting text from {file_path}: {e}")
            return ""
    
    def _extract_pdf_text(self, file_path):
        """Extract text from PDF using pdfplumber."""
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return text.strip()
    
    def _extract_docx_text(self, file_path):
        """Extract text from DOCX using python-docx."""
        doc = docx.Document(file_path)
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text.strip()
