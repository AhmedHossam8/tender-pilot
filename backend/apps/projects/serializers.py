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

    category_id = serializers.IntegerField(write_only=True, required=False)
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )

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
            "id", "title", "description", "budget", "category", "category_name",
            "skills", "skills_names", "bids_count", "visibility", "status",
            "created_by", "requirements", "attachments", "created_at",
            "category_id", "skill_ids",
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

        if category_id is not None:
            instance.category = Category.objects.get(id=category_id)
        if skill_ids is not None:
            instance.skills.set(Skill.objects.filter(id__in=skill_ids))

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
