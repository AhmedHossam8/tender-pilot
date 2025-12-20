from django.contrib import admin
from .models import Tender, TenderDocument

@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = ("title", "issuing_entity", "deadline", "status")
    list_filter = ("status",)
    search_fields = ("title", "issuing_entity")

 

@admin.register(TenderDocument)
class TenderDocumentAdmin(admin.ModelAdmin):
    list_display = ("tender", "document_type", "file_url", "created_at")
    list_filter = ("document_type", "tender")
    search_fields = ("file_url", "tender__title")
