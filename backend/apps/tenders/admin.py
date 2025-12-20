from django.contrib import admin
from .models import Tender

@admin.register(Tender)
class TenderAdmin(admin.ModelAdmin):
    list_display = ("title", "issuing_entity", "deadline", "status")
    list_filter = ("status",)
    search_fields = ("title", "issuing_entity")
