from django.db import models
from django.contrib.auth import get_user_model
from apps.tenders.models import Tender

User = get_user_model()

class Proposal(models.Model):
    tender = models.ForeignKey(Tender, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    status = models.CharField(
        max_length=50,
        choices=[('draft', 'Draft'), ('final', 'Final')],
        default='draft'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.tender.title})"

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
