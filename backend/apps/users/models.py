from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver

# ----------------------------
# Custom User Manager
# ----------------------------
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        extra_fields.setdefault("role", "USER")
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", "ADMIN")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("role") != "ADMIN":
            raise ValueError("Superuser must have role=ADMIN")
        if not extra_fields.get("is_staff"):
            raise ValueError("Superuser must have is_staff=True")
        if not extra_fields.get("is_superuser"):
            raise ValueError("Superuser must have is_superuser=True")

        return self.create_user(email, password, **extra_fields)


# ----------------------------
# User model
# ----------------------------
class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        USER = "USER", "User"

    class UserType(models.TextChoices):
        CLIENT = "client", "Client"
        PROVIDER = "provider", "Service Provider"
        BOTH = "both", "Both"
        ADMIN = "admin", "Admin"

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER
    )
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.CLIENT
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN


# ----------------------------
# Skill model
# ----------------------------
class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


# ----------------------------
# UserProfile model
# ----------------------------
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(blank=True)
    headline = models.CharField(max_length=200, blank=True)
    skills = models.ManyToManyField(Skill, blank=True, related_name='user_profiles')
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    location = models.CharField(max_length=255, blank=True)
    languages = models.JSONField(default=list, blank=True)
    portfolio_url = models.URLField(blank=True)
    verified = models.BooleanField(default=False)
    ai_profile_score = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile: {self.user.email}"

    def calculate_profile_completeness(self):
        score = 0
        fields_to_check = {'bio': 15, 'headline': 10, 'location': 10, 'portfolio_url': 10, 'avatar': 15}
        for field, points in fields_to_check.items():
            if getattr(self, field):
                score += points
        score += min(self.skills.count() * 5, 20)
        score += min(len(self.languages) * 5, 10) if self.languages else 0
        if self.user.user_type in ['provider', 'both'] and self.hourly_rate:
            score += 10
        return min(score, 100)


@receiver(post_save, sender=UserProfile)
def update_profile_score(sender, instance, **kwargs):
    score = instance.calculate_profile_completeness()
    if instance.ai_profile_score != score:
        instance.ai_profile_score = score
        instance.save(update_fields=['ai_profile_score'])


# ----------------------------
# Review & Response models
# ----------------------------
class Review(models.Model):
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    booking = models.ForeignKey('services.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    ai_sentiment = models.FloatField(null=True, blank=True, validators=[MinValueValidator(-1.0), MaxValueValidator(1.0)])
    ai_sentiment_label = models.CharField(max_length=20, null=True, blank=True, choices=[('positive','Positive'),('neutral','Neutral'),('negative','Negative')])
    is_public = models.BooleanField(default=True)
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['reviewer', 'project'], condition=models.Q(project__isnull=False), name='unique_project_review'),
            models.UniqueConstraint(fields=['reviewer', 'booking'], condition=models.Q(booking__isnull=False), name='unique_booking_review'),
        ]

    def __str__(self):
        return f"Review by {self.reviewer} for {self.reviewee} - {self.rating}★"


class ReviewResponse(models.Model):
    review = models.OneToOneField(Review, on_delete=models.CASCADE, related_name='response')
    responder = models.ForeignKey(User, on_delete=models.CASCADE)
    response_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Response by {self.responder} to review #{self.review.id}"
