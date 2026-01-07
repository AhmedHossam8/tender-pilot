from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserProfile, Skill

User = get_user_model()


class SkillSerializer(serializers.ModelSerializer):
    """Serializer for Skill model"""
    class Meta:
        model = Skill
        fields = ('id', 'name', 'category')
        read_only_fields = ('id',)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Skill.objects.all(),
        source='skills',
        write_only=True,
        required=False
    )
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            'id',
            'user_email',
            'user_full_name',
            'user_type',
            'bio',
            'headline',
            'skills',
            'skill_ids',
            'hourly_rate',
            'location',
            'languages',
            'portfolio_url',
            'verified',
            'ai_profile_score',
            'avatar',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'verified', 'ai_profile_score', 'created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer with profile data"""
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'role',
            'user_type',
            'is_active',
            'profile',
        )
        read_only_fields = ('id', 'email')


class PublicProfileSerializer(serializers.ModelSerializer):
    """Public-facing profile serializer (limited data)"""
    skills = SkillSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_type = serializers.CharField(source='user.user_type', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            'user_id',
            'user_email',
            'user_full_name',
            'user_type',
            'bio',
            'headline',
            'skills',
            'hourly_rate',
            'location',
            'languages',
            'portfolio_url',
            'verified',
            'ai_profile_score',
            'avatar',
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    user_type = serializers.ChoiceField(
        choices=User.UserType.choices,
        required=False,
        default=User.UserType.CLIENT
    )

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'user_type')

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
            user_type=validated_data.get('user_type', User.UserType.CLIENT),
            role=User.Role.REVIEWER
        )
        # Create empty profile for the user
        UserProfile.objects.create(user=user)
        return user
    
class LoginSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['user_type'] = user.user_type

        return token


class AdminUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "role",
            "user_type",
            "is_active",
            "profile",
        )
