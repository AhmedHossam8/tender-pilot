from rest_framework import serializers
from common.serializers import BaseModelSerializer
from apps.projects.models import Project, ProjectRequirement, ProjectAttachment
from apps.core.models import Category, Skill


# -------------------------
# Nested serializers
# -------------------------
class CategorySerializer(BaseModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class SkillSerializer(BaseModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name"]


class ProjectRequirementSerializer(BaseModelSerializer):
    class Meta:
        model = ProjectRequirement
        fields = ["id", "description"]


class ProjectAttachmentSerializer(BaseModelSerializer):
    class Meta:
        model = ProjectAttachment
        fields = ["id", "file", "uploaded_at"]


# -------------------------
# Main Project Serializer
# -------------------------
class ProjectSerializer(BaseModelSerializer):
    category = CategorySerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    requirements = ProjectRequirementSerializer(many=True, read_only=True)
    attachments = ProjectAttachmentSerializer(many=True, read_only=True)

    # Write-only fields for updates
    category_id = serializers.IntegerField(write_only=True, required=False)
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )

    # frontend-friendly fields
    category_name = serializers.SerializerMethodField()
    skills_names = serializers.SerializerMethodField()
    bids_count = serializers.SerializerMethodField()
    
    def validate_status(self, value):
        current = self.instance.status if self.instance else None
        if current == "open" and value != "in_progress":
            raise serializers.ValidationError("Open projects can only move to In Progress.")
        if current == "in_progress" and value != "completed":
            raise serializers.ValidationError("In Progress projects can only move to Completed.")
        return value

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "description",
            "budget",
            "category",
            "category_name",
            "skills",
            "skills_names",
            "bids_count",
            "visibility",
            "status",
            "created_by",
            "requirements",
            "attachments",
            "created_at",
            "category_id",
            "skill_ids",
        ]
        read_only_fields = ("created_by",)

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_skills_names(self, obj):
        return [skill.name for skill in obj.skills.all()]

    def get_bids_count(self, obj):
        return obj.bids.count()

    def update(self, instance, validated_data):
        category_id = validated_data.pop("category_id", None)
        skill_ids = validated_data.pop("skill_ids", None)

        # Update category if provided
        if category_id is not None:
            instance.category = Category.objects.get(id=category_id)

        # Update skills if provided
        if skill_ids is not None:
            instance.skills.set(Skill.objects.filter(id__in=skill_ids))

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# -------------------------
# Create Serializer
# -------------------------
class ProjectCreateSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(write_only=True)
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Project
        fields = ["title", "description", "budget", "category_id", "skill_ids"]

    def create(self, validated_data):
        category_id = validated_data.pop("category_id")
        skill_ids = validated_data.pop("skill_ids", [])

        category = Category.objects.get(id=category_id)
        project = Project.objects.create(category=category, **validated_data)

        if skill_ids:
            project.skills.set(Skill.objects.filter(id__in=skill_ids))

        return project

class ProjectAIInsightsSerializer(serializers.Serializer):
    """Serializer for AI insights about a project"""
    has_analysis = serializers.BooleanField()
    analyzed_at = serializers.DateTimeField(required=False, allow_null=True)
    summary = serializers.CharField(required=False, allow_blank=True)
    key_requirements = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    estimated_complexity = serializers.CharField(required=False)
    recommended_actions = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )
    confidence_score = serializers.FloatField(required=False, allow_null=True)

class ProviderMatchSerializer(serializers.Serializer):
    """Serializer for provider match results"""
    provider_id = serializers.IntegerField()
    provider_name = serializers.CharField()
    match_score = serializers.IntegerField()
    matching_skills = serializers.ListField(child=serializers.CharField())
    skill_gaps = serializers.ListField(child=serializers.CharField())
    budget_compatible = serializers.BooleanField()
    budget_assessment = serializers.CharField(required=False)
    experience_assessment = serializers.CharField(required=False)
    potential_concerns = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    recommendation = serializers.CharField()
    reasoning = serializers.CharField()
    cached = serializers.BooleanField(default=False)


class ProjectWithAISerializer(serializers.ModelSerializer):
    """
    Enhanced Project serializer with AI-related fields
    """
    category = CategorySerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    
    # AI-related fields
    has_ai_analysis = serializers.SerializerMethodField()
    ai_summary = serializers.CharField(read_only=True, allow_null=True)
    ai_complexity = serializers.SerializerMethodField()
    ai_analyzed_at = serializers.SerializerMethodField()
    
    # Stats
    bids_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id',
            'title',
            'description',
            'budget',
            'category',
            'skills',
            'visibility',
            'status',
            'created_by',
            'created_at',
            # AI fields
            'has_ai_analysis',
            'ai_summary',
            'ai_complexity',
            'ai_analyzed_at',
            # Stats
            'bids_count',
        ]
        read_only_fields = ['created_by', 'created_at']
    
    def get_has_ai_analysis(self, obj):
        """Check if project has AI analysis"""
        from apps.ai_engine.models import AIRequest, AIRequestStatus
        
        return AIRequest.objects.filter(
            content_type='project',
            object_id=str(obj.id),
            status=AIRequestStatus.COMPLETED,
            prompt_name='project_analysis'
        ).exists()
    
    def get_ai_complexity(self, obj):
        """Get AI-determined complexity"""
        from apps.ai_engine.models import AIRequest, AIRequestStatus
        import json
        
        latest = (
            AIRequest.objects
            .filter(
                content_type='project',
                object_id=str(obj.id),
                status=AIRequestStatus.COMPLETED,
                prompt_name='project_analysis'
            )
            .select_related('response')
            .order_by('-created_at')
            .first()
        )
        
        if not latest:
            return None
        
        try:
            analysis = json.loads(latest.response.content)
            return analysis.get('estimated_complexity', None)
        except:
            return None
    
    def get_ai_analyzed_at(self, obj):
        """Get when AI analysis was performed"""
        from apps.ai_engine.models import AIRequest, AIRequestStatus
        
        latest = (
            AIRequest.objects
            .filter(
                content_type='project',
                object_id=str(obj.id),
                status=AIRequestStatus.COMPLETED,
                prompt_name='project_analysis'
            )
            .order_by('-created_at')
            .first()
        )
        
        return latest.created_at if latest else None
    
    def get_bids_count(self, obj):
        """Get number of bids on this project"""
        return obj.bids.count()
    
class ProjectAnalysisRequestSerializer(serializers.Serializer):
    """Serializer for AI analysis request"""
    force_refresh = serializers.BooleanField(default=False, required=False)
    analysis_depth = serializers.ChoiceField(
        choices=['quick', 'standard', 'detailed'],
        default='standard',
        required=False
    )
    include_documents = serializers.BooleanField(default=True, required=False)


class ProjectAnalysisResponseSerializer(serializers.Serializer):
    """Serializer for AI analysis response"""
    request_id = serializers.UUIDField()
    analysis = serializers.DictField()
    tokens_used = serializers.IntegerField()
    cost = serializers.DecimalField(max_digits=10, decimal_places=6)
    cached = serializers.BooleanField()
    processing_time_ms = serializers.IntegerField()
    cache_age_hours = serializers.FloatField(required=False)


class ProjectMatchProvidersResponseSerializer(serializers.Serializer):
    """Serializer for provider matching response"""
    project_id = serializers.UUIDField()
    project_title = serializers.CharField()
    matches_count = serializers.IntegerField()
    matches = ProviderMatchSerializer(many=True)