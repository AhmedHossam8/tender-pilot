from rest_framework import serializers
from common.serializers import BaseModelSerializer
from apps.projects.models import Project, ProjectRequirement, ProjectAttachment
from apps.core.models import Category, Skill

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
        fields = ["id", "project", "description"]

class ProjectAttachmentSerializer(BaseModelSerializer):
    class Meta:
        model = ProjectAttachment
        fields = ["id", "project", "file", "uploaded_at"]

class ProjectSerializer(BaseModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    requirements = ProjectRequirementSerializer(many=True, read_only=True)
    attachments = ProjectAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "title",
            "description",
            "budget",
            "category",
            "skills",
            "visibility",
            "status",
            "created_by",
            "requirements",
            "attachments",
            "created_at",
        ]