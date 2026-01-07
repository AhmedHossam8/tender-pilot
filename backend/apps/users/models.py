from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.core.validators import MinValueValidator, MaxValueValidator


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("user_type", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(email, password, **extra_fields)


class Skill(models.Model):
    """Skills that can be associated with users and projects"""
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(
        max_length=50,
        blank=True,
        help_text="Skill category (e.g., 'Programming', 'Design', 'Marketing')"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Skill"
        verbose_name_plural = "Skills"

    def __str__(self):
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        PROPOSAL_MANAGER = "PROPOSAL_MANAGER", "Proposal Manager"
        REVIEWER = "REVIEWER", "Reviewer"
        WRITER = "WRITER", "Writer"

    class UserType(models.TextChoices):
        CLIENT = 'client', 'Client'
        PROVIDER = 'provider', 'Service Provider'
        BOTH = 'both', 'Both'
        ADMIN = 'admin', 'Admin'

    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.REVIEWER
    )

    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.CLIENT,
        help_text="User type in the marketplace"
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role"]),
            models.Index(fields=["user_type"]),
        ]


class UserProfile(models.Model):
    """Extended profile information for users"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    bio = models.TextField(
        blank=True,
        help_text="About me / Professional bio"
    )
    headline = models.CharField(
        max_length=200,
        blank=True,
        help_text="Professional tagline (e.g., 'Full-Stack Developer')"
    )
    skills = models.ManyToManyField(
        Skill,
        blank=True,
        related_name='user_profiles'
    )
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Hourly rate for service providers (USD)"
    )
    location = models.CharField(
        max_length=255,
        blank=True,
        help_text="City, Country"
    )
    languages = models.JSONField(
        default=list,
        blank=True,
        help_text="List of languages spoken"
    )
    portfolio_url = models.URLField(
        blank=True,
        help_text="External portfolio or website URL"
    )
    verified = models.BooleanField(
        default=False,
        help_text="Identity verified by platform"
    )
    ai_profile_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="AI-calculated profile completeness score (0-100)"
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text="Profile picture"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"Profile: {self.user.email}"

    def calculate_profile_completeness(self):
        """Calculate profile completeness score"""
        score = 0
        fields_to_check = {
            'bio': 15,
            'headline': 10,
            'location': 10,
            'portfolio_url': 10,
            'avatar': 15,
        }
        
        for field, points in fields_to_check.items():
            if getattr(self, field):
                score += points
        
        # Skills (20 points max, 5 per skill up to 4)
        skill_count = self.skills.count()
        score += min(skill_count * 5, 20)
        
        # Languages (10 points max)
        if self.languages and len(self.languages) > 0:
            score += min(len(self.languages) * 5, 10)
        
        # Hourly rate (for providers, 10 points)
        if self.user.user_type in ['provider', 'both'] and self.hourly_rate:
            score += 10
        
        return min(score, 100)

    def save(self, *args, **kwargs):
        """Auto-calculate profile score on save"""
        self.ai_profile_score = self.calculate_profile_completeness()
        super().save(*args, **kwargs)