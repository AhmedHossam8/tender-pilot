"""
Review Models
For user ratings and reviews on projects and bookings
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg


class Review(models.Model):
    """
    Review model for rating users after project/booking completion
    """
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        help_text='User who wrote the review'
    )
    reviewee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
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
        ).aggregate(Avg('rating'))
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
        settings.AUTH_USER_MODEL,
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
