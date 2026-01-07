from django.conf import settings
from django.db import models
from apps.core.models import Category, Skill


class Project(models.Model):
    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("private", "Private"),
    ]

    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("deleted", "Deleted"),  # Added for soft-delete
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="projects"
    )

    skills = models.ManyToManyField(
        Skill,
        related_name="projects",
        blank=True
    )

    visibility = models.CharField(
        max_length=10,
        choices=VISIBILITY_CHOICES,
        default="public"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="open"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="projects"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    
    # AI-related fields
    ai_summary = models.TextField(
        blank=True, 
        null=True,
        help_text='AI-generated summary'
    )
    ai_processed = models.BooleanField(
        default=False,
        help_text='Whether AI analysis has been performed'
    )
    ai_processed_at = models.DateTimeField(
        blank=True, 
        null=True,
        help_text='When AI analysis was last performed'
    )
    ai_complexity = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        help_text='AI-determined complexity'
    )
    ai_data = models.JSONField(
        blank=True,
        null=True,
        default=dict,
        help_text='Structured AI analysis data'
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["visibility"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.title


class ProjectRequirement(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="requirements"
    )
    description = models.TextField()

    def __str__(self):
        return self.description[:50]


class ProjectAttachment(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="attachments"
    )
    file = models.FileField(upload_to="project_attachments/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name
