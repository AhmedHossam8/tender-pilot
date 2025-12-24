from django.contrib import admin
from .models import Tender, TenderDocument as TenderDocumentTender, TenderRequirement

@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = ("title", "issuing_entity", "deadline", "status", "is_active")
    search_fields = ("title", "issuing_entity")
    list_filter = ("status",)

@admin.register(TenderDocumentTender)
class TenderDocumentTenderAdmin(admin.ModelAdmin):
    list_display = ("tender", "document_type", "ai_processed", "created_at")
    search_fields = ("tender__title", "document_type")

@admin.register(TenderRequirement)
class TenderRequirementAdmin(admin.ModelAdmin):
    list_display = ("tender", "title", "is_mandatory", "created_at")
    list_filter = ("is_mandatory", "tender")
    search_fields = ("title", "tender__title")