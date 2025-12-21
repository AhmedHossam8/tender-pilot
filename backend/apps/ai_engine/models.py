"""
AI Engine Models

Database models for tracking AI requests, responses, usage, and prompt versions.
These models provide:
1. Complete audit trail of all AI interactions
2. Token usage and cost tracking
3. Prompt version management
4. Performance metrics
"""

import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class AIRequestStatus(models.TextChoices):
    """Status choices for AI requests."""
    PENDING = 'pending', 'Pending'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'


class AIRequest(models.Model):
    """
    Tracks individual AI generation requests.
    
    Each request represents a single call to an AI provider,
    storing the input, configuration, and status.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the AI request"
    )
    
    # Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='ai_requests',
        help_text="User who initiated the request"
    )
    
    # For linking to specific resources (generic approach)
    # Can be linked to Tender, Proposal, etc.
    content_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Type of content being analyzed (e.g., 'tender', 'proposal')"
    )
    object_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="ID of the content being analyzed"
    )
    
    # Prompt information
    prompt_name = models.CharField(
        max_length=100,
        help_text="Name of the prompt template used"
    )
    prompt_version = models.CharField(
        max_length=20,
        help_text="Version of the prompt template"
    )
    
    # Input data
    system_prompt = models.TextField(
        blank=True,
        null=True,
        help_text="System prompt sent to the AI"
    )
    user_prompt = models.TextField(
        help_text="User prompt sent to the AI"
    )
    input_tokens = models.IntegerField(
        default=0,
        help_text="Number of input tokens"
    )
    
    # AI Configuration
    provider = models.CharField(
        max_length=50,
        default='openai',
        help_text="AI provider used (openai, anthropic, etc.)"
    )
    model = models.CharField(
        max_length=100,
        help_text="AI model used"
    )
    temperature = models.FloatField(
        default=0.7,
        help_text="Temperature setting for generation"
    )
    max_tokens = models.IntegerField(
        default=2000,
        help_text="Maximum tokens for response"
    )
    
    # Status tracking
    status = models.CharField(
        max_length=20,
        choices=AIRequestStatus.choices,
        default=AIRequestStatus.PENDING,
        help_text="Current status of the request"
    )
    error_message = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if request failed"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When processing started"
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When processing completed"
    )
    
    # Metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata for the request"
    )
    
    class Meta:
        db_table = 'ai_requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['content_type', 'object_id']),
        ]
    
    def __str__(self):
        return f"AIRequest {self.id} - {self.prompt_name} ({self.status})"
    
    @property
    def processing_time_ms(self):
        """Calculate processing time in milliseconds."""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return int(delta.total_seconds() * 1000)
        return None
    
    def mark_processing(self):
        """Mark request as processing."""
        self.status = AIRequestStatus.PROCESSING
        self.started_at = timezone.now()
        self.save(update_fields=['status', 'started_at'])
    
    def mark_completed(self):
        """Mark request as completed."""
        self.status = AIRequestStatus.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])
    
    def mark_failed(self, error_message: str):
        """Mark request as failed."""
        self.status = AIRequestStatus.FAILED
        self.error_message = error_message
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'error_message', 'completed_at'])


class AIResponse(models.Model):
    """
    Stores AI generation responses.
    
    Each response is linked to a request and contains
    the generated content and metadata.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    # Link to request
    request = models.OneToOneField(
        AIRequest,
        on_delete=models.CASCADE,
        related_name='response',
        help_text="The request this response belongs to"
    )
    
    # Response content
    content = models.TextField(
        help_text="Raw response content from the AI"
    )
    parsed_content = models.JSONField(
        default=dict,
        blank=True,
        help_text="Parsed JSON content if applicable"
    )
    
    # Token usage
    output_tokens = models.IntegerField(
        default=0,
        help_text="Number of output tokens"
    )
    total_tokens = models.IntegerField(
        default=0,
        help_text="Total tokens (input + output)"
    )
    
    # Model info
    model_used = models.CharField(
        max_length=100,
        help_text="Actual model that generated the response"
    )
    finish_reason = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Reason for completion (stop, length, etc.)"
    )
    
    # Quality metrics
    confidence_score = models.FloatField(
        blank=True,
        null=True,
        help_text="Confidence score for the response (0-1)"
    )
    
    # Regeneration tracking
    parent_response = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='regenerations',
        help_text="Parent response if this is a regeneration"
    )
    regeneration_count = models.IntegerField(
        default=0,
        help_text="Number of times this response has been regenerated"
    )
    
    # User feedback
    user_rating = models.IntegerField(
        blank=True,
        null=True,
        help_text="User rating (1-5)"
    )
    user_feedback = models.TextField(
        blank=True,
        null=True,
        help_text="User feedback text"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Raw response storage
    raw_response = models.JSONField(
        default=dict,
        blank=True,
        help_text="Raw API response for debugging"
    )
    
    class Meta:
        db_table = 'ai_responses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"AIResponse {self.id} for Request {self.request_id}"


class AIUsage(models.Model):
    """
    Aggregated AI usage tracking for billing and analytics.
    
    Provides daily/monthly rollups of AI usage per user.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    # User tracking
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_usage',
        help_text="User this usage belongs to"
    )
    
    # Request reference (optional - for per-request tracking)
    request = models.ForeignKey(
        AIRequest,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='usage_records',
        help_text="Related AI request"
    )
    
    # Token usage
    input_tokens = models.IntegerField(
        default=0,
        help_text="Input tokens used"
    )
    output_tokens = models.IntegerField(
        default=0,
        help_text="Output tokens used"
    )
    total_tokens = models.IntegerField(
        default=0,
        help_text="Total tokens used"
    )
    
    # Cost tracking
    estimated_cost = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        default=0,
        help_text="Estimated cost in USD"
    )
    
    # Provider and model info
    provider = models.CharField(
        max_length=50,
        help_text="AI provider"
    )
    model = models.CharField(
        max_length=100,
        help_text="AI model used"
    )
    
    # Time tracking
    date = models.DateField(
        default=timezone.now,
        help_text="Date of usage"
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="Exact timestamp"
    )
    
    class Meta:
        db_table = 'ai_usage'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'date']),
            models.Index(fields=['provider', 'model', 'date']),
        ]
    
    def __str__(self):
        return f"AIUsage {self.user_id} - {self.date} - {self.total_tokens} tokens"


class PromptVersion(models.Model):
    """
    Database storage for prompt versions.
    
    Allows dynamic management of prompts without code deployment.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    
    # Identification
    name = models.CharField(
        max_length=100,
        help_text="Unique name for the prompt"
    )
    version = models.CharField(
        max_length=20,
        help_text="Semantic version (e.g., 1.0.0)"
    )
    
    # Content
    description = models.TextField(
        blank=True,
        help_text="Description of what this prompt does"
    )
    system_prompt = models.TextField(
        blank=True,
        null=True,
        help_text="System prompt text"
    )
    template_text = models.TextField(
        help_text="The prompt template with variable placeholders"
    )
    variables = models.JSONField(
        default=list,
        help_text="List of required variables"
    )
    output_schema = models.JSONField(
        default=dict,
        blank=True,
        help_text="Expected output schema"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this version is active"
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Whether this is the default version for this prompt name"
    )
    
    # Performance tracking
    usage_count = models.IntegerField(
        default=0,
        help_text="Number of times this prompt has been used"
    )
    success_rate = models.FloatField(
        default=0.0,
        help_text="Success rate (0-1)"
    )
    average_rating = models.FloatField(
        default=0.0,
        help_text="Average user rating"
    )
    
    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='created_prompts',
        help_text="User who created this version"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prompt_versions'
        unique_together = ['name', 'version']
        ordering = ['name', '-version']
        indexes = [
            models.Index(fields=['name', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} v{self.version}"
    
    def increment_usage(self):
        """Increment usage counter."""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])
