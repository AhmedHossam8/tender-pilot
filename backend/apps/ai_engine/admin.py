"""
AI Engine Django Admin Configuration

Provides admin interfaces for managing:
1. AI Requests and Responses
2. Prompt Versions (A/B testing, version management)
3. AI Usage Tracking
4. Performance Metrics

Features:
- Read-only views for AI requests/responses
- Full CRUD for prompt versions
- Bulk actions for activating/deactivating prompts
- Usage analytics summaries
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.db.models import Count, Sum, Avg
from .models import AIRequest, AIResponse, AIUsage, PromptVersion
from .prompts.registry import PromptRegistry


@admin.register(AIRequest)
class AIRequestAdmin(admin.ModelAdmin):
    """
    Admin interface for AI Requests.
    
    Read-only view showing all AI requests with filtering and search.
    """
    list_display = [
        'id',
        'user',
        'prompt_name',
        'prompt_version',
        'status',
        'provider',
        'model',
        'created_at',
        'token_usage',
    ]
    
    list_filter = [
        'status',
        'provider',
        'model',
        'created_at',
        'prompt_name',
    ]
    
    search_fields = [
        'id',
        'user__email',
        'user__username',
        'prompt_name',
    ]
    
    readonly_fields = [
        'id',
        'user',
        'content_type',
        'object_id',
        'prompt_name',
        'prompt_version',
        'system_prompt',
        'user_prompt',
        'provider',
        'model',
        'temperature',
        'max_tokens',
        'status',
        'error_message',
        'metadata',
        'created_at',
        'updated_at',
        'completed_at',
        'processing_time',
    ]
    
    date_hierarchy = 'created_at'
    
    def token_usage(self, obj):
        """Display token usage if available."""
        if hasattr(obj, 'response'):
            return f"{obj.response.total_tokens} tokens"
        return "N/A"
    token_usage.short_description = "Tokens"
    
    def has_add_permission(self, request):
        """Disable manual creation."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion for cleanup."""
        return request.user.is_superuser


@admin.register(AIResponse)
class AIResponseAdmin(admin.ModelAdmin):
    """
    Admin interface for AI Responses.
    
    Read-only view showing generated responses.
    """
    list_display = [
        'id',
        'request_user',
        'model_used',
        'confidence_score',
        'token_count',
        'created_at',
        'has_parent',
    ]
    
    list_filter = [
        'model_used',
        'finish_reason',
        'created_at',
    ]
    
    search_fields = [
        'id',
        'request__user__email',
        'content',
    ]
    
    readonly_fields = [
        'id',
        'request',
        'parent_response',
        'content',
        'parsed_content',
        'output_tokens',
        'total_tokens',
        'model_used',
        'finish_reason',
        'confidence_score',
        'metadata',
        'created_at',
        'regeneration_count',
    ]
    
    def request_user(self, obj):
        """Show user who made the request."""
        return obj.request.user.email
    request_user.short_description = "User"
    
    def token_count(self, obj):
        """Display token count."""
        return f"{obj.total_tokens}"
    token_count.short_description = "Tokens"
    
    def has_parent(self, obj):
        """Show if this is a regeneration."""
        return "Yes" if obj.parent_response else "No"
    has_parent.short_description = "Regenerated"
    
    def regeneration_count(self, obj):
        """Count how many times this was regenerated."""
        return obj.regenerations.count()
    regeneration_count.short_description = "# Regenerations"
    
    def has_add_permission(self, request):
        """Disable manual creation."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion for cleanup."""
        return request.user.is_superuser


@admin.register(PromptVersion)
class PromptVersionAdmin(admin.ModelAdmin):
    """
    Admin interface for Prompt Versions.
    
    Full CRUD interface for managing prompt templates.
    Supports A/B testing and version management.
    """
    list_display = [
        'name',
        'version',
        'is_active_badge',
        'created_by',
        'created_at',
        'usage_count_display',
        'avg_confidence_display',
        'actions_column',
    ]
    
    list_filter = [
        'is_active',
        'created_at',
        'name',
    ]
    
    search_fields = [
        'name',
        'version',
        'description',
    ]
    
    readonly_fields = [
        'created_at',
        'updated_at',
        'usage_stats',
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'version', 'description', 'is_active')
        }),
        ('Templates', {
            'fields': ('system_template', 'user_template'),
            'classes': ('wide',),
        }),
        ('Metadata', {
            'fields': ('created_by', 'metadata'),
        }),
        ('Statistics', {
            'fields': ('created_at', 'updated_at', 'usage_stats'),
            'classes': ('collapse',),
        }),
    )
    
    actions = [
        'activate_prompts',
        'deactivate_prompts',
        'duplicate_prompt',
    ]
    
    def is_active_badge(self, obj):
        """Show active status as badge."""
        if obj.is_active:
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Active</span>'
            )
        return format_html(
            '<span style="color: gray;">○ Inactive</span>'
        )
    is_active_badge.short_description = "Status"
    
    def usage_count_display(self, obj):
        """Show how many times this prompt was used."""
        count = AIRequest.objects.filter(
            prompt_name=obj.name,
            prompt_version=obj.version
        ).count()
        return count
    usage_count_display.short_description = "Usage Count"
    
    def avg_confidence_display(self, obj):
        """Show average confidence score."""
        avg = AIResponse.objects.filter(
            request__prompt_name=obj.name,
            request__prompt_version=obj.version,
            confidence_score__isnull=False
        ).aggregate(Avg('confidence_score'))['confidence_score__avg']
        
        if avg:
            return f"{avg:.2f}"
        return "N/A"
    avg_confidence_display.short_description = "Avg Confidence"
    
    def actions_column(self, obj):
        """Quick action buttons."""
        buttons = []
        
        if not obj.is_active:
            buttons.append(
                f'<a class="button" href="?action=activate&id={obj.id}">Activate</a>'
            )
        
        buttons.append(
            f'<a class="button" href="?action=duplicate&id={obj.id}">Duplicate</a>'
        )
        
        return format_html(' '.join(buttons))
    actions_column.short_description = "Actions"
    
    def usage_stats(self, obj):
        """Detailed usage statistics."""
        if not obj.id:
            return "N/A (save first)"
        
        requests = AIRequest.objects.filter(
            prompt_name=obj.name,
            prompt_version=obj.version
        )
        
        total_requests = requests.count()
        successful = requests.filter(status='completed').count()
        failed = requests.filter(status='failed').count()
        
        responses = AIResponse.objects.filter(
            request__prompt_name=obj.name,
            request__prompt_version=obj.version
        )
        
        avg_tokens = responses.aggregate(Avg('total_tokens'))['total_tokens__avg'] or 0
        avg_confidence = responses.aggregate(Avg('confidence_score'))['confidence_score__avg'] or 0
        
        return format_html(
            '<div style="line-height: 1.8;">'
            '<strong>Total Requests:</strong> {}<br>'
            '<strong>Successful:</strong> {} ({:.1f}%)<br>'
            '<strong>Failed:</strong> {} ({:.1f}%)<br>'
            '<strong>Avg Tokens:</strong> {:.0f}<br>'
            '<strong>Avg Confidence:</strong> {:.2f}<br>'
            '</div>',
            total_requests,
            successful,
            (successful / total_requests * 100) if total_requests > 0 else 0,
            failed,
            (failed / total_requests * 100) if total_requests > 0 else 0,
            avg_tokens,
            avg_confidence,
        )
    usage_stats.short_description = "Usage Statistics"
    
    def activate_prompts(self, request, queryset):
        """Activate selected prompts."""
        for prompt in queryset:
            # Deactivate other versions with same name
            PromptVersion.objects.filter(name=prompt.name).update(is_active=False)
            # Activate this one
            prompt.is_active = True
            prompt.save()
            # Clear cache
            PromptRegistry.clear_cache(prompt.name)
        
        self.message_user(request, f"Activated {queryset.count()} prompt(s)")
    activate_prompts.short_description = "Activate selected prompts"
    
    def deactivate_prompts(self, request, queryset):
        """Deactivate selected prompts."""
        queryset.update(is_active=False)
        for prompt in queryset:
            PromptRegistry.clear_cache(prompt.name)
        
        self.message_user(request, f"Deactivated {queryset.count()} prompt(s)")
    deactivate_prompts.short_description = "Deactivate selected prompts"
    
    def duplicate_prompt(self, request, queryset):
        """Duplicate selected prompts."""
        count = 0
        for prompt in queryset:
            # Create new version
            new_version = f"{prompt.version}.copy"
            prompt.pk = None
            prompt.version = new_version
            prompt.is_active = False
            prompt.created_by = request.user
            prompt.save()
            count += 1
        
        self.message_user(request, f"Duplicated {count} prompt(s)")
    duplicate_prompt.short_description = "Duplicate selected prompts"
    
    def save_model(self, request, obj, form, change):
        """Auto-set created_by on new prompts."""
        if not change:  # New object
            obj.created_by = request.user
        
        # If activating, deactivate others
        if obj.is_active:
            PromptVersion.objects.filter(name=obj.name).exclude(id=obj.id).update(is_active=False)
        
        super().save_model(request, obj, form, change)
        
        # Clear cache for this prompt
        PromptRegistry.clear_cache(obj.name)


@admin.register(AIUsage)
class AIUsageAdmin(admin.ModelAdmin):
    """
    Admin interface for AI Usage tracking.
    
    Read-only view for monitoring token consumption.
    """
    list_display = [
        'user',
        'request',
        'provider',
        'model',
        'token_display',
        'created_at',
    ]
    
    list_filter = [
        'provider',
        'model',
        'created_at',
    ]
    
    search_fields = [
        'user__email',
        'request__id',
    ]
    
    readonly_fields = [
        'user',
        'request',
        'input_tokens',
        'output_tokens',
        'total_tokens',
        'provider',
        'model',
        'created_at',
    ]
    
    date_hierarchy = 'created_at'
    
    def token_display(self, obj):
        """Display token breakdown."""
        return f"{obj.total_tokens} ({obj.input_tokens} in + {obj.output_tokens} out)"
    token_display.short_description = "Tokens"
    
    def has_add_permission(self, request):
        """Disable manual creation."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion for cleanup."""
        return request.user.is_superuser

