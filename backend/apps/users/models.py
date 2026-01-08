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


class Review(models.Model):
    """
    Review model for rating users after project/booking completion
    """
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        help_text='User who wrote the review'
    )
    reviewee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_received',
        help_text='User being reviewed'
    )
    
    # Context (optional - one of these)
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews',
        help_text='Related project if applicable'
    )
    booking = models.ForeignKey(
        'services.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews',
        help_text='Related booking if applicable'
    )
    
    # Review content
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Rating from 1-5 stars'
    )
    comment = models.TextField(
        help_text='Review text'
    )
    
    # AI analysis
    ai_sentiment = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(-1.0), MaxValueValidator(1.0)],
        help_text='AI-analyzed sentiment score (-1 to 1)'
    )
    ai_sentiment_label = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=[
            ('positive', 'Positive'),
            ('neutral', 'Neutral'),
            ('negative', 'Negative'),
        ],
        help_text='AI sentiment classification'
    )
    
    # Visibility
    is_public = models.BooleanField(
        default=True,
        help_text='Whether review is publicly visible'
    )
    is_flagged = models.BooleanField(
        default=False,
        help_text='Flagged for moderation'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reviewee', '-created_at']),
            models.Index(fields=['reviewer', '-created_at']),
            models.Index(fields=['rating']),
        ]
        # Prevent multiple reviews for same project/booking
        constraints = [
            models.UniqueConstraint(
                fields=['reviewer', 'project'],
                condition=models.Q(project__isnull=False),
                name='unique_project_review'
            ),
            models.UniqueConstraint(
                fields=['reviewer', 'booking'],
                condition=models.Q(booking__isnull=False),
                name='unique_booking_review'
            ),
        ]
    
    def __str__(self):
        return f"Review by {self.reviewer} for {self.reviewee} - {self.rating}★"
    
    @classmethod
    def get_user_average_rating(cls, user_id):
        """Calculate average rating for a user"""
        result = cls.objects.filter(
            reviewee_id=user_id,
            is_public=True
        ).aggregate(models.Avg('rating'))
        return result['rating__avg'] or 0.0
    
    @classmethod
    def get_user_review_count(cls, user_id):
        """Get total number of reviews for a user"""
        return cls.objects.filter(
            reviewee_id=user_id,
            is_public=True
        ).count()
    
    @classmethod
    def get_rating_distribution(cls, user_id):
        """Get distribution of ratings (1-5 stars) for a user"""
        reviews = cls.objects.filter(
            reviewee_id=user_id,
            is_public=True
        ).values('rating').annotate(count=models.Count('rating'))
        
        distribution = {i: 0 for i in range(1, 6)}
        for item in reviews:
            distribution[item['rating']] = item['count']
        
        return distribution


class ReviewResponse(models.Model):
    """
    Response to a review by the reviewee
    """
    review = models.OneToOneField(
        Review,
        on_delete=models.CASCADE,
        related_name='response',
        help_text='Review being responded to'
    )
    responder = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        help_text='User responding (usually the reviewee)'
    )
    response_text = models.TextField(
        help_text='Response content'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Response by {self.responder} to review #{self.review.id}"
