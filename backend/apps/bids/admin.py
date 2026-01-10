from django.contrib import admin
from .models import Bid, BidMilestone, BidAttachment, BidAuditLog


class BidMilestoneInline(admin.TabularInline):
    model = BidMilestone
    extra = 0
    fields = ['order', 'title', 'duration_days', 'amount']


class BidAttachmentInline(admin.TabularInline):
    model = BidAttachment
    extra = 0
    fields = ['file_name', 'file', 'description', 'created_at']
    readonly_fields = ['created_at']


class BidAuditLogInline(admin.TabularInline):
    model = BidAuditLog
    extra = 0
    fields = ['action', 'user', 'timestamp', 'extra_info']
    readonly_fields = ['action', 'user', 'timestamp', 'extra_info']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'project',
        'service_provider',
        'proposed_amount',
        'proposed_timeline',
        'status',
        'ai_score',
        'created_at',
    ]
    list_filter = ['status', 'created_at']
    search_fields = [
        'project__title',
        'service_provider__email',
        'service_provider__full_name',
        'service_provider__last_name',
        'cover_letter',
    ]
    readonly_fields = ['created_at', 'updated_at', 'ai_score', 'ai_feedback']
    inlines = [BidMilestoneInline, BidAttachmentInline, BidAuditLogInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('project', 'service_provider', 'status')
        }),
        ('Bid Details', {
            'fields': ('cover_letter', 'proposed_amount', 'proposed_timeline', 'milestones')
        }),
        ('AI Analysis', {
            'fields': ('ai_score', 'ai_feedback'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(BidMilestone)
class BidMilestoneAdmin(admin.ModelAdmin):
    list_display = ['id', 'bid', 'order', 'title', 'duration_days', 'amount']
    list_filter = ['created_at']
    search_fields = ['bid__project__title', 'title', 'description']
    ordering = ['bid', 'order']


@admin.register(BidAttachment)
class BidAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'bid', 'file_name', 'file_type', 'file_size', 'created_at']
    list_filter = ['file_type', 'created_at']
    search_fields = ['bid__project__title', 'file_name', 'description']
    readonly_fields = ['created_at']


@admin.register(BidAuditLog)
class BidAuditLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'bid', 'action', 'user', 'timestamp']
    list_filter = ['action', 'timestamp']
    search_fields = ['bid__project__title', 'user__email', 'extra_info']
    readonly_fields = ['timestamp']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
