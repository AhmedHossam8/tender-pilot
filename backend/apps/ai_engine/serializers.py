"""
AI Engine Serializers

Handles validation and serialization for all AI-related API operations.

These serializers provide:
1. Input validation for API requests
2. Output formatting for API responses
3. Type safety and documentation
4. Custom validation logic

Architecture:
- Request serializers validate incoming data
- Response serializers format outgoing data
- Each major operation has its own serializer pair
"""

from rest_framework import serializers
from decimal import Decimal


# ============================================================================
# Project ANALYSIS SERIALIZERS
# ============================================================================

class ProjectAnalysisRequestSerializer(serializers.Serializer):
    """
    Validates input for project analysis requests.

    Example:
        {
            "force_refresh": false,
            "analysis_depth": "standard",
            "include_documents": true
        }
    """
    force_refresh = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Force re-analysis even if cached result exists"
    )
    
    analysis_depth = serializers.ChoiceField(
        choices=['quick', 'standard', 'detailed'],
        default='standard',
        required=False,
        help_text="Level of detail in analysis. Quick uses fewer tokens."
    )
    
    include_documents = serializers.BooleanField(
        default=True,
        required=False,
        help_text="Include analysis of individual documents"
    )
    
    def validate_analysis_depth(self, value):
        """
        Custom validation for analysis depth.
        
        Detailed analysis requires higher permissions.
        """
        if value == 'detailed':
            # Check user quota and permissions
            user = self.context.get('user')
            if user:
                # Import here to avoid circular imports
                from .permissions import check_ai_quota, check_feature_access
                
                # Check if user has access to detailed analysis
                if not check_feature_access(user, 'analysis'):
                    raise serializers.ValidationError(
                        "Your role does not have access to AI analysis features"
                    )
                
                # Check quota (currently returns True, ready for future integration)
                has_quota, message = check_ai_quota(user)
                if not has_quota:
                    raise serializers.ValidationError(message)
        
        return value


class KeyRequirementSerializer(serializers.Serializer):
    """Serializer for individual requirement items."""
    requirement = serializers.CharField()
    category = serializers.CharField()
    priority = serializers.CharField()


class DeadlineInfoSerializer(serializers.Serializer):
    """Serializer for deadline information."""
    submission_deadline = serializers.CharField(allow_null=True)
    clarification_deadline = serializers.CharField(allow_null=True)
    contract_start_date = serializers.CharField(allow_null=True)


class BudgetInfoSerializer(serializers.Serializer):
    """Serializer for budget information."""
    estimated_value = serializers.CharField(allow_null=True)
    currency = serializers.CharField(allow_null=True)


class AnalysisDataSerializer(serializers.Serializer):
    """Serializer for the analysis result structure."""
    summary = serializers.CharField()
    key_requirements = KeyRequirementSerializer(many=True)
    deadline_info = DeadlineInfoSerializer(required=False)
    estimated_complexity = serializers.CharField()
    budget_info = BudgetInfoSerializer(required=False)
    recommended_actions = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class ProjectAnalysisResponseSerializer(serializers.Serializer):
    """
    Formats project analysis output for API response.
    
    Example response:
        {
            "request_id": "uuid",
            "analysis": {...},
            "tokens_used": 1234,
            "cost": 0.0037,
            "cached": false,
            "processing_time_ms": 3456
        }
    """
    request_id = serializers.UUIDField(
        help_text="Unique ID for this AI request, used for tracking"
    )
    
    analysis = serializers.JSONField(
        help_text="Structured analysis result with summary, requirements, etc."
    )
    
    tokens_used = serializers.IntegerField(
        help_text="Total tokens consumed (input + output)"
    )
    
    cost = serializers.DecimalField(
        max_digits=10,
        decimal_places=6,
        help_text="Estimated cost in USD"
    )
    
    cached = serializers.BooleanField(
        help_text="Whether this result was retrieved from cache"
    )
    
    processing_time_ms = serializers.IntegerField(
        help_text="Processing time in milliseconds"
    )
    
    cache_age_hours = serializers.FloatField(
        required=False,
        help_text="Age of cached result in hours (only if cached=true)"
    )
    
    model_used = serializers.CharField(
        required=False,
        help_text="AI model that generated this response"
    )


# ============================================================================
# COMPLIANCE CHECK SERIALIZERS
# ============================================================================

class ComplianceCheckRequestSerializer(serializers.Serializer):
    """
    Validates input for compliance check requests.
    
    User must provide either proposal_id OR proposal_content.
    
    Example:
        {
            "proposal_id": "uuid",
            "sections_to_check": ["technical", "financial"]
        }
    
    Or:
        {
            "proposal_content": "Full proposal text here...",
            "check_format": true
        }
    """
    proposal_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="UUID of existing proposal to check"
    )
    
    proposal_content = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Raw proposal text to check (if not using proposal_id)"
    )
    
    sections_to_check = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Specific sections to focus on (e.g., ['technical', 'financial'])"
    )
    
    check_format = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Also check formatting and structure compliance"
    )
    
    def validate(self, data):
        """
        Validate that either proposal_id or proposal_content is provided.
        """
        proposal_id = data.get('proposal_id')
        proposal_content = data.get('proposal_content')
        
        if not proposal_id and not proposal_content:
            raise serializers.ValidationError({
                'error': 'Either proposal_id or proposal_content must be provided',
                'code': 'missing_proposal_data'
            })
        
        if proposal_id and proposal_content:
            raise serializers.ValidationError({
                'error': 'Provide either proposal_id or proposal_content, not both',
                'code': 'conflicting_proposal_data'
            })
        
        return data


class ComplianceGapSerializer(serializers.Serializer):
    """Serializer for individual compliance gaps."""
    requirement = serializers.CharField()
    requirement_id = serializers.CharField(required=False, allow_null=True)
    status = serializers.CharField()  # 'not_met', 'partially_met', 'met'
    severity = serializers.CharField()  # 'critical', 'high', 'medium', 'low'
    found_in_proposal = serializers.BooleanField()
    suggestion = serializers.CharField()
    reference_section = serializers.CharField(required=False, allow_null=True)


class ComplianceCheckResponseSerializer(serializers.Serializer):
    """
    Formats compliance check output for API response.
    
    Example response:
        {
            "request_id": "uuid",
            "compliance_score": 85,
            "gaps": [...],
            "recommendations": [...]
        }
    """
    request_id = serializers.UUIDField(
        help_text="Unique ID for this compliance check"
    )
    
    compliance_score = serializers.IntegerField(
        min_value=0,
        max_value=100,
        help_text="Overall compliance score (0-100)"
    )
    
    total_requirements = serializers.IntegerField(
        required=False,
        help_text="Total number of requirements checked"
    )
    
    fully_met = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="List of fully met requirements"
    )
    
    gaps = ComplianceGapSerializer(
        many=True,
        help_text="List of compliance gaps found"
    )
    
    recommendations = serializers.ListField(
        child=serializers.CharField(),
        help_text="Actionable recommendations to improve compliance"
    )
    
    tokens_used = serializers.IntegerField(
        help_text="Total tokens consumed"
    )
    
    cost = serializers.DecimalField(
        max_digits=10,
        decimal_places=6,
        help_text="Estimated cost in USD"
    )
    
    processing_time_ms = serializers.IntegerField(
        help_text="Processing time in milliseconds"
    )


# ============================================================================
# PROPOSAL OUTLINE SERIALIZERS
# ============================================================================

class ProposalOutlineRequestSerializer(serializers.Serializer):
    """
    Validates input for proposal outline generation.
    
    Example:
        {
            "style": "detailed",
            "include_examples": true,
            "target_length": "30-40 pages"
        }
    """
    style = serializers.ChoiceField(
        choices=['brief', 'standard', 'detailed', 'comprehensive'],
        default='standard',
        required=False,
        help_text="Outline detail level"
    )
    
    include_examples = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Include example content for each section"
    )
    
    target_length = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        help_text="Target document length (e.g., '20-30 pages', '50 pages')"
    )
    
    custom_sections = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Custom sections to include beyond standard structure"
    )


class OutlineSectionSerializer(serializers.Serializer):
    """Serializer for individual outline sections."""
    section_number = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    suggested_length = serializers.CharField()
    key_points = serializers.ListField(child=serializers.CharField())
    priority = serializers.CharField()
    examples = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class OutlineDataSerializer(serializers.Serializer):
    """Serializer for the complete outline structure."""
    title = serializers.CharField()
    sections = OutlineSectionSerializer(many=True)
    estimated_total_pages = serializers.IntegerField(required=False)
    cover_page_required = serializers.BooleanField(required=False)
    appendices_suggested = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class ProposalOutlineResponseSerializer(serializers.Serializer):
    """
    Formats proposal outline output for API response.
    
    Example response:
        {
            "request_id": "uuid",
            "outline": {
                "title": "...",
                "sections": [...]
            },
            "tokens_used": 1876,
            "cost": 0.0053
        }
    """
    request_id = serializers.UUIDField(
        help_text="Unique ID for this outline generation"
    )
    
    outline = serializers.JSONField(
        help_text="Structured proposal outline with sections and guidance"
    )
    
    tokens_used = serializers.IntegerField(
        help_text="Total tokens consumed"
    )
    
    cost = serializers.DecimalField(
        max_digits=10,
        decimal_places=6,
        help_text="Estimated cost in USD"
    )
    
    processing_time_ms = serializers.IntegerField(
        help_text="Processing time in milliseconds"
    )


# ============================================================================
# GENERIC/LEGACY SERIALIZERS (kept for backward compatibility)
# ============================================================================

class AIExecuteSerializer(serializers.Serializer):
    """
    Generic AI execution serializer (legacy).
    
    NOTE: Prefer using specific serializers above for new code.
    """
    task = serializers.ChoiceField(choices=[
        "project_analysis",
        "compliance_check",
        "proposal_outline",
    ])
    entity_type = serializers.ChoiceField(choices=[
        "project",
        "document",
        "proposal",
    ])
    entity_id = serializers.UUIDField()
    regenerate = serializers.BooleanField(default=False)
    params = serializers.JSONField(required=False)


class AIResultSerializer(serializers.Serializer):
    """
    Generic AI result serializer (legacy).
    
    NOTE: Prefer using specific response serializers above for new code.
    """
    task = serializers.CharField()
    entity_id = serializers.UUIDField()
    result = serializers.JSONField()


# ============================================================================
# ERROR RESPONSE SERIALIZERS
# ============================================================================

class AIErrorResponseSerializer(serializers.Serializer):
    """
    Standard error response format for AI operations.
    
    Example:
        {
            "error": "Project not found",
            "code": "project_not_found",
            "details": {...},
            "retry_after": 60
        }
    """
    error = serializers.CharField(help_text="Human-readable error message")
    code = serializers.CharField(help_text="Machine-readable error code")
    details = serializers.JSONField(required=False, help_text="Additional error context")
    retry_after = serializers.IntegerField(
        required=False,
        help_text="Seconds to wait before retrying (for rate limits)"
    )


# ============================================================================
# REGENERATION SERIALIZERS
# ============================================================================

class RegenerateRequestSerializer(serializers.Serializer):
    """
    Validates input for regenerating AI responses.
    
    Example:
        {
            "feedback": "Make it more concise and focus on key risks",
            "temperature": 0.7,
            "max_tokens": 2000,
            "style": "concise"
        }
    """
    feedback = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text="Feedback on what to improve in the regenerated response"
    )
    
    temperature = serializers.FloatField(
        required=False,
        min_value=0.0,
        max_value=2.0,
        help_text="Creativity level (0.0 = focused, 2.0 = very creative)"
    )
    
    max_tokens = serializers.IntegerField(
        required=False,
        min_value=100,
        max_value=8000,
        help_text="Maximum tokens in the response"
    )
    
    style = serializers.ChoiceField(
        choices=['concise', 'detailed', 'formal', 'casual'],
        required=False,
        help_text="Desired style for the regenerated response"
    )
    
    def validate(self, data):
        """Ensure at least one parameter is provided."""
        if not any([
            data.get('feedback'),
            data.get('temperature') is not None,
            data.get('max_tokens') is not None,
            data.get('style')
        ]):
            raise serializers.ValidationError(
                "Please provide at least one of: feedback, temperature, max_tokens, or style"
            )
        return data


class RegenerateResponseSerializer(serializers.Serializer):
    """
    Formats output for regeneration responses.
    
    Example:
        {
            "new_response_id": "uuid",
            "new_request_id": "uuid",
            "content": "...",
            "parsed_content": {...},
            "improvements": ["Applied feedback: ...", "Adjusted creativity"],
            "confidence": {...},
            "parent_response_id": "uuid",
            "tokens_used": 1234,
            "model": "gpt-4",
            "regeneration_count": 2
        }
    """
    new_response_id = serializers.UUIDField(
        help_text="ID of the newly generated response"
    )
    new_request_id = serializers.UUIDField(
        help_text="ID of the new AI request"
    )
    content = serializers.CharField(
        help_text="Raw content of the regenerated response"
    )
    parsed_content = serializers.JSONField(
        help_text="Structured/parsed content (if applicable)"
    )
    improvements = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of improvements applied"
    )
    confidence = serializers.JSONField(
        help_text="Confidence score and details for the new response"
    )
    parent_response_id = serializers.UUIDField(
        help_text="ID of the original response that was regenerated"
    )
    tokens_used = serializers.IntegerField(
        help_text="Total tokens used for regeneration"
    )
    model = serializers.CharField(
        help_text="AI model used for regeneration"
    )
    regeneration_count = serializers.IntegerField(
        help_text="Number of times this response has been regenerated (depth in chain)"
    )


class RegenerationHistorySerializer(serializers.Serializer):
    """
    Formats regeneration history output.
    
    Example:
        {
            "root": {...},
            "chain": [{...}, {...}],
            "current": {...},
            "total_regenerations": 3
        }
    """
    root = serializers.JSONField(
        help_text="Original response (root of the regeneration chain)"
    )
    chain = serializers.ListField(
        child=serializers.JSONField(),
        help_text="Full chain of responses from original to latest"
    )
    current = serializers.JSONField(
        help_text="The specific response that was requested"
    )
    total_regenerations = serializers.IntegerField(
        help_text="Total number of regenerations in the chain"
    )


# ============================================================================
# AI ANALYTICS SERIALIZERS
# ============================================================================

class AIUsageLogSerializer(serializers.Serializer):
    """Serializer for AI usage log data."""
    id = serializers.IntegerField(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    feature = serializers.CharField()
    project_id = serializers.IntegerField(allow_null=True)
    bid_id = serializers.IntegerField(allow_null=True)
    execution_time = serializers.FloatField()
    tokens_used = serializers.IntegerField()
    cost = serializers.DecimalField(max_digits=10, decimal_places=6)
    cached = serializers.BooleanField()
    success = serializers.BooleanField()
    confidence_score = serializers.FloatField(allow_null=True)
    created_at = serializers.DateTimeField()


class AIAnalyticsSummarySerializer(serializers.Serializer):
    """Serializer for AI analytics summary data."""
    date = serializers.DateField()
    total_requests = serializers.IntegerField()
    cached_requests = serializers.IntegerField()
    failed_requests = serializers.IntegerField()
    match_score_requests = serializers.IntegerField()
    bid_generation_requests = serializers.IntegerField()
    price_suggestion_requests = serializers.IntegerField()
    quality_score_requests = serializers.IntegerField()
    avg_execution_time = serializers.FloatField()
    total_tokens_used = serializers.IntegerField()
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2)
    cache_hit_rate = serializers.FloatField()
    success_rate = serializers.FloatField()
    match_prediction_accuracy = serializers.FloatField(allow_null=True)


class AIAnalyticsStatsSerializer(serializers.Serializer):
    """Serializer for aggregated AI statistics."""
    total_requests = serializers.IntegerField()
    cached_requests = serializers.IntegerField()
    failed_requests = serializers.IntegerField()
    successful_requests = serializers.IntegerField()
    cache_hit_rate = serializers.FloatField()
    success_rate = serializers.FloatField()
    feature_breakdown = serializers.ListField()
    total_tokens_used = serializers.IntegerField()
    total_cost = serializers.FloatField()
    avg_execution_time = serializers.FloatField()
    avg_confidence = serializers.FloatField()
    date_range = serializers.DictField()


class MatchAccuracyStatsSerializer(serializers.Serializer):
    """Serializer for match prediction accuracy statistics."""
    total_predictions = serializers.IntegerField()
    correct_predictions = serializers.IntegerField()
    accuracy_rate = serializers.FloatField()
    precision = serializers.FloatField()
    recall = serializers.FloatField()
    true_positives = serializers.IntegerField()
    false_positives = serializers.IntegerField()
    false_negatives = serializers.IntegerField()


class CostTrendSerializer(serializers.Serializer):
    """Serializer for cost trend data."""
    date = serializers.DateField()
    total_cost = serializers.FloatField()
    total_requests = serializers.IntegerField()
    cache_hit_rate = serializers.FloatField()
    success_rate = serializers.FloatField()


class FeatureUsageBreakdownSerializer(serializers.Serializer):
    """Serializer for feature usage breakdown."""
    total_requests = serializers.IntegerField()
    features = serializers.ListField()
    period_days = serializers.IntegerField()
