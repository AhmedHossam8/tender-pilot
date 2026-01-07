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
        indexes = [
            models.Index(fields=['request']),
            models.Index(fields=['created_at']),
        ]
    
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
            models.Index(fields=['usage_count']),
        ]
    
    def __str__(self):
        return f"{self.name} v{self.version}"
    
    def increment_usage(self):
        """Increment usage counter."""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class AIUsageLog(models.Model):
    """
    Track all AI feature usage for analytics and cost monitoring.
    """
    FEATURE_CHOICES = [
        ('match_score', 'Match Score Calculation'),
        ('bid_generation', 'Bid Generation'),
        ('price_suggestion', 'Price Suggestion'),
        ('quality_score', 'Bid Quality Score'),
        ('project_analysis', 'Project Analysis'),
        ('service_optimization', 'Service Description Optimization'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    feature = models.CharField(max_length=50, choices=FEATURE_CHOICES)
    project_id = models.IntegerField(null=True, blank=True)
    bid_id = models.IntegerField(null=True, blank=True)
    
    # Performance metrics
    execution_time = models.FloatField(help_text="Execution time in seconds")
    tokens_used = models.IntegerField(default=0)
    cost = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    
    # Result metadata
    cached = models.BooleanField(default=False)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    
    # AI response quality
    confidence_score = models.FloatField(null=True, blank=True, help_text="AI confidence in result (0-1)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_usage_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['feature', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['cached', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_feature_display()} - {self.created_at}"


class MatchSuccessLog(models.Model):
    """
    Track the success rate of AI match predictions.
    This helps improve the matching algorithm over time.
    """
    project_id = models.IntegerField()
    provider_id = models.IntegerField()
    
    # AI prediction
    predicted_match_score = models.IntegerField(help_text="AI predicted score (0-100)")
    predicted_success = models.BooleanField(help_text="AI predicted success")
    
    # Actual outcome
    bid_submitted = models.BooleanField(default=False)
    bid_accepted = models.BooleanField(default=False)
    actual_success = models.BooleanField(null=True, blank=True)
    
    # Timing
    prediction_date = models.DateTimeField(auto_now_add=True)
    outcome_date = models.DateTimeField(null=True, blank=True)
    
    # Accuracy metrics
    prediction_accuracy = models.FloatField(null=True, blank=True, help_text="How accurate was the prediction")
    
    class Meta:
        db_table = 'match_success_logs'
        ordering = ['-prediction_date']
        indexes = [
            models.Index(fields=['project_id', 'provider_id']),
            models.Index(fields=['predicted_success', 'actual_success']),
        ]
    
    def calculate_accuracy(self):
        """Calculate how accurate the AI prediction was."""
        if self.actual_success is None:
            return None
        
        # Perfect prediction
        if self.predicted_success == self.actual_success:
            return 1.0
        
        # Wrong prediction
        return 0.0
    
    def __str__(self):
        return f"Match Log: Project {self.project_id} - Provider {self.provider_id}"


class AIAnalyticsSummary(models.Model):
    """
    Daily summary of AI usage statistics.
    Aggregated data for faster dashboard queries.
    """
    date = models.DateField(unique=True)
    
    # Usage stats
    total_requests = models.IntegerField(default=0)
    cached_requests = models.IntegerField(default=0)
    failed_requests = models.IntegerField(default=0)
    
    # Feature breakdown
    match_score_requests = models.IntegerField(default=0)
    bid_generation_requests = models.IntegerField(default=0)
    price_suggestion_requests = models.IntegerField(default=0)
    quality_score_requests = models.IntegerField(default=0)
    
    # Performance
    avg_execution_time = models.FloatField(default=0)
    total_tokens_used = models.IntegerField(default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Success metrics
    match_prediction_accuracy = models.FloatField(null=True, blank=True)
    bid_success_rate = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_analytics_summary'
        ordering = ['-date']
    
    def __str__(self):
        return f"AI Analytics - {self.date}"
    
    @property
    def cache_hit_rate(self):
        """Calculate cache hit rate percentage."""
        if self.total_requests == 0:
            return 0
        return (self.cached_requests / self.total_requests) * 100
    
    @property
    def success_rate(self):
        """Calculate success rate percentage."""
        if self.total_requests == 0:
            return 0
        successful = self.total_requests - self.failed_requests
        return (successful / self.total_requests) * 100
