from django.contrib import admin
from .models import (
    Project,
    ProjectAttachment,
    ProjectRequirement,
)

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "status",
        "visibility",
        "budget",
        "created_at",
    )
    search_fields = ("title",)
    list_filter = ("status", "visibility")
    ordering = ("-created_at",)


@admin.register(ProjectRequirement)
class ProjectRequirementAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "description")
    search_fields = ("description",)
    list_filter = ("project",)


@admin.register(ProjectAttachment)
class ProjectAttachmentAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "file", "uploaded_at")
    list_filter = ("project",)
