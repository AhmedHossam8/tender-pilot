from django.contrib import admin
from .models import Tender, TenderDocument, TenderRequirement , TenderUser


############# Tender admin Table ###############################
@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = ("title", "issuing_entity", "deadline", "status")
    list_filter = ("status",)
    search_fields = ("title", "issuing_entity")

 

################ TenderDocuments admin table #########################
@admin.register(TenderDocument)
class TenderDocumentAdmin(admin.ModelAdmin):
    list_display = (
        "tender",
        "document_type",
        "ai_processed",
        "created_at"
    )

    list_filter = (
        "document_type",
        "ai_processed",
        "tender"
    )

    search_fields = (
        "file_url",
        "tender__title",
        "extracted_text",
        "ai_summary"
    )

    readonly_fields = (
        "extracted_text",
        "ai_summary",
    )


################TenderRequirements admin table#########################
@admin.register(TenderRequirement)
class TenderRequirementAdmin(admin.ModelAdmin):
    list_display = ("tender", "title", "is_mandatory", "created_at")
    list_filter = ("is_mandatory", "tender")
    search_fields = ("title", "tender__title")



@admin.register(TenderUser)
class TenderUserAdmin(admin.ModelAdmin):
    list_display = ('tender','user','assigned_at')