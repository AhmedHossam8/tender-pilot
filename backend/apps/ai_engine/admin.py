"""
AI Engine Django Admin Configuration

Provides admin interfaces for managing:
1. AI Requests and Responses
2. Prompt Versions (A/B testing, version management)
3. AI Usage Tracking
4. Performance Metrics
"""

from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Avg
from .models import AIRequest, AIResponse, AIUsage, PromptVersion, AIUsageLog, MatchSuccessLog, AIAnalyticsSummary
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
        'completed_at',
        'processing_time_ms',
    ]
    
    date_hierarchy = 'created_at'
    
    def token_usage(self, obj):
        """Display token usage if available."""
        if hasattr(obj, 'response'):
            return f"{obj.response.total_tokens} tokens"
        return "N/A"
    token_usage.short_description = "Tokens"
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
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
        'created_at',
        'regeneration_count',
    ]
    
    def request_user(self, obj):
        return obj.request.user.email
    request_user.short_description = "User"
    
    def token_count(self, obj):
        return f"{obj.total_tokens}"
    token_count.short_description = "Tokens"
    
    def has_parent(self, obj):
        return "Yes" if obj.parent_response else "No"
    has_parent.short_description = "Regenerated"
    
    def regeneration_count(self, obj):
        return obj.regenerations.count()
    regeneration_count.short_description = "# Regenerations"
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
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
        if obj.is_active:
            return format_html('<span style="color: green; font-weight: bold;">✓ Active</span>')
        return format_html('<span style="color: gray;">○ Inactive</span>')
    is_active_badge.short_description = "Status"
    
    def usage_count_display(self, obj):
        count = AIRequest.objects.filter(prompt_name=obj.name, prompt_version=obj.version).count()
        return count
    usage_count_display.short_description = "Usage Count"
    
    def avg_confidence_display(self, obj):
        avg = AIResponse.objects.filter(
            request__prompt_name=obj.name,
            request__prompt_version=obj.version,
            confidence_score__isnull=False
        ).aggregate(Avg('confidence_score'))['confidence_score__avg']
        return f"{avg:.2f}" if avg else "N/A"
    avg_confidence_display.short_description = "Avg Confidence"
    
    def actions_column(self, obj):
        buttons = []
        if not obj.is_active:
            buttons.append(f'<a class="button" href="?action=activate&id={obj.id}">Activate</a>')
        buttons.append(f'<a class="button" href="?action=duplicate&id={obj.id}">Duplicate</a>')
        return format_html(' '.join(buttons))
    actions_column.short_description = "Actions"
    
    def usage_stats(self, obj):
        if not obj.id:
            return "N/A (save first)"
        requests = AIRequest.objects.filter(prompt_name=obj.name, prompt_version=obj.version)
        total_requests = requests.count()
        successful = requests.filter(status='completed').count()
        failed = requests.filter(status='failed').count()
        responses = AIResponse.objects.filter(request__prompt_name=obj.name, request__prompt_version=obj.version)
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
        for prompt in queryset:
            PromptVersion.objects.filter(name=prompt.name).update(is_active=False)
            prompt.is_active = True
            prompt.save()
            PromptRegistry.clear_cache(prompt.name)
        self.message_user(request, f"Activated {queryset.count()} prompt(s)")
    activate_prompts.short_description = "Activate selected prompts"
    
    def deactivate_prompts(self, request, queryset):
        queryset.update(is_active=False)
        for prompt in queryset:
            PromptRegistry.clear_cache(prompt.name)
        self.message_user(request, f"Deactivated {queryset.count()} prompt(s)")
    deactivate_prompts.short_description = "Deactivate selected prompts"
    
    def duplicate_prompt(self, request, queryset):
        count = 0
        for prompt in queryset:
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
        if not change:
            obj.created_by = request.user
        if obj.is_active:
            PromptVersion.objects.filter(name=obj.name).exclude(id=obj.id).update(is_active=False)
        super().save_model(request, obj, form, change)
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
        'timestamp',
    ]
    
    list_filter = [
        'provider',
        'model',
        'timestamp',
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
        'timestamp',
    ]
    
    date_hierarchy = 'timestamp'
    
    def token_display(self, obj):
        return f"{obj.total_tokens} ({obj.input_tokens} in + {obj.output_tokens} out)"
    token_display.short_description = "Tokens"
    
    def has_add_permission(self, request):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(AIUsageLog)
class AIUsageLogAdmin(admin.ModelAdmin):
    """Admin interface for AI Usage Logs."""
    
    list_display = [
        'id',
        'user',
        'feature',
        'cached',
        'success',
        'execution_time',
        'tokens_used',
        'cost',
        'created_at',
    ]
    
    list_filter = [
        'feature',
        'cached',
        'success',
        'created_at',
    ]
    
    search_fields = [
        'user__email',
        'user__username',
        'error_message',
    ]
    
    readonly_fields = [
        'user',
        'feature',
        'project_id',
        'bid_id',
        'execution_time',
        'tokens_used',
        'cost',
        'cached',
        'success',
        'error_message',
        'confidence_score',
        'created_at',
    ]
    
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        return False


@admin.register(MatchSuccessLog)
class MatchSuccessLogAdmin(admin.ModelAdmin):
    """Admin interface for Match Success Logs."""
    
    list_display = [
        'id',
        'project_id',
        'provider_id',
        'predicted_match_score',
        'predicted_success',
        'actual_success',
        'prediction_accuracy',
        'prediction_date',
    ]
    
    list_filter = [
        'predicted_success',
        'actual_success',
        'bid_submitted',
        'bid_accepted',
        'prediction_date',
    ]
    
    search_fields = [
        'project_id',
        'provider_id',
    ]
    
    readonly_fields = [
        'project_id',
        'provider_id',
        'predicted_match_score',
        'predicted_success',
        'bid_submitted',
        'bid_accepted',
        'actual_success',
        'prediction_date',
        'outcome_date',
        'prediction_accuracy',
    ]
    
    date_hierarchy = 'prediction_date'
    
    def has_add_permission(self, request):
        return False


@admin.register(AIAnalyticsSummary)
class AIAnalyticsSummaryAdmin(admin.ModelAdmin):
    """Admin interface for AI Analytics Summary."""
    
    list_display = [
        'date',
        'total_requests',
        'cache_hit_rate_display',
        'success_rate_display',
        'total_cost',
        'match_prediction_accuracy',
    ]
    
    list_filter = [
        'date',
    ]
    
    readonly_fields = [
        'date',
        'total_requests',
        'cached_requests',
        'failed_requests',
        'match_score_requests',
        'bid_generation_requests',
        'price_suggestion_requests',
        'quality_score_requests',
        'avg_execution_time',
        'total_tokens_used',
        'total_cost',
        'match_prediction_accuracy',
        'bid_success_rate',
        'created_at',
        'updated_at',
        'cache_hit_rate',
        'success_rate',
    ]
    
    date_hierarchy = 'date'
    
    def cache_hit_rate_display(self, obj):
        return f"{obj.cache_hit_rate:.1f}%"
    cache_hit_rate_display.short_description = "Cache Hit Rate"
    
    def success_rate_display(self, obj):
        return f"{obj.success_rate:.1f}%"
    success_rate_display.short_description = "Success Rate"
    
    def has_add_permission(self, request):
        return False
