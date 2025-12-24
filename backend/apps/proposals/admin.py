from django.contrib import admin
from .models import Proposal, ProposalSection, ProposalDocument


@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'tender', 'status', 'created_by', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'tender__title']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('tender', 'created_by', 'title', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProposalSection)
class ProposalSectionAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'proposal', 'ai_generated', 'content_preview']
    list_filter = ['ai_generated', 'proposal']
    search_fields = ['name', 'content', 'proposal__title']
    readonly_fields = ['id']
    
    def content_preview(self, obj):
        """Show first 50 characters of content"""
        if obj.content:
            return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
        return '(empty)'
    content_preview.short_description = 'Content Preview'


@admin.register(ProposalDocument)
class ProposalDocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'proposal', 'type', 'file', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['proposal__title']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
