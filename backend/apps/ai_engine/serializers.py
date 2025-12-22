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
# TENDER ANALYSIS SERIALIZERS
# ============================================================================

class TenderAnalysisRequestSerializer(serializers.Serializer):
    """
    Validates input for tender analysis requests.
    
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
            # TODO: Check user quota/permissions when governance APIs ready
            # user = self.context.get('user')
            # if not user.has_ai_quota_for_detailed():
            #     raise serializers.ValidationError(
            #         "Insufficient quota for detailed analysis"
            #     )
            pass
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


class TenderAnalysisResponseSerializer(serializers.Serializer):
    """
    Formats tender analysis output for API response.
    
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
        "tender_analysis",
        "compliance_check",
        "proposal_outline",
    ])
    entity_type = serializers.ChoiceField(choices=[
        "tender",
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
            "error": "Tender not found",
            "code": "tender_not_found",
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
