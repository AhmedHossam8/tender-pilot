from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from .models import UserProfile, Skill

User = get_user_model()


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'user_type', 'role', 'is_active', 'is_staff')
    list_filter = ('user_type', 'role', 'is_active', 'is_staff')
    search_fields = ('email', 'full_name')
    ordering = ('-id',)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'headline', 'location', 'hourly_rate', 'verified', 'ai_profile_score', 'updated_at')
    list_filter = ('verified', 'created_at')
    search_fields = ('user__email', 'user__full_name', 'headline', 'bio')
    readonly_fields = ('ai_profile_score', 'created_at', 'updated_at')
    filter_horizontal = ('skills',)
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Professional Info', {
            'fields': ('headline', 'bio', 'skills', 'hourly_rate')
        }),
        ('Location & Contact', {
            'fields': ('location', 'languages', 'portfolio_url')
        }),
        ('Profile Status', {
            'fields': ('verified', 'ai_profile_score', 'avatar')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('name', 'category')
    ordering = ('name',)