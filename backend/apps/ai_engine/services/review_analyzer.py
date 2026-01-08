"""
AI Review Analyzer Service
Provides sentiment analysis and content moderation for user reviews
"""
import logging
from typing import Dict, Optional, Tuple
from .base import AIService

logger = logging.getLogger(__name__)


class AIReviewAnalyzer(AIService):
    """
    AI-powered review analysis service
    Analyzes review sentiment and detects inappropriate content
    """
    
    def analyze_review(self, review_text: str, rating: int) -> Dict[str, any]:
        """
        Comprehensive review analysis
        
        Args:
            review_text: The review content
            rating: Star rating (1-5)
            
        Returns:
            Dictionary with sentiment score, label, and moderation flags
        """
        try:
            sentiment_score, sentiment_label = self.detect_sentiment(review_text, rating)
            is_flagged = self.detect_inappropriate_content(review_text)
            
            return {
                'sentiment_score': sentiment_score,
                'sentiment_label': sentiment_label,
                'is_flagged': is_flagged,
                'confidence': 0.85  # Placeholder confidence score
            }
        except Exception as e:
            logger.error(f"Review analysis error: {str(e)}")
            return {
                'sentiment_score': 0.0,
                'sentiment_label': 'neutral',
                'is_flagged': False,
                'confidence': 0.0
            }
    
    def detect_sentiment(self, text: str, rating: int) -> Tuple[float, str]:
        """
        Detect sentiment from review text and rating
        
        Args:
            text: Review content
            rating: Star rating (1-5)
            
        Returns:
            Tuple of (sentiment_score: float -1 to 1, sentiment_label: str)
        """
        try:
            prompt = f"""Analyze the sentiment of this review and provide a score from -1 (very negative) to 1 (very positive).
Consider both the text content and the {rating}-star rating.

Review: {text}
Rating: {rating}/5 stars

Respond with ONLY a number between -1 and 1, nothing else."""

            response = self.generate(prompt)
            
            # Parse sentiment score
            try:
                score = float(response.strip())
                score = max(-1.0, min(1.0, score))  # Clamp between -1 and 1
            except ValueError:
                # Fallback: derive from rating if AI response fails
                score = (rating - 3) / 2  # Convert 1-5 to -1 to 1
            
            # Determine label
            if score > 0.3:
                label = 'positive'
            elif score < -0.3:
                label = 'negative'
            else:
                label = 'neutral'
            
            return score, label
            
        except Exception as e:
            logger.error(f"Sentiment detection error: {str(e)}")
            # Fallback to rating-based sentiment
            score = (rating - 3) / 2
            label = 'positive' if score > 0.3 else ('negative' if score < -0.3 else 'neutral')
            return score, label
    
    def detect_inappropriate_content(self, text: str) -> bool:
        """
        Detect inappropriate, offensive, or spam content
        
        Args:
            text: Review content to analyze
            
        Returns:
            True if content should be flagged for moderation
        """
        try:
            prompt = f"""Analyze this review for inappropriate content including:
- Offensive language
- Personal attacks
- Spam or promotional content
- Harassment or threats
- Irrelevant content

Review: {text}

Respond with ONLY 'YES' if the content should be flagged for moderation, or 'NO' if it's appropriate."""

            response = self.generate(prompt)
            return response.strip().upper() == 'YES'
            
        except Exception as e:
            logger.error(f"Content moderation error: {str(e)}")
            # Conservative fallback: don't flag if uncertain
            return False
    
    def generate_review_summary(self, reviews: list) -> str:
        """
        Generate a concise summary of multiple reviews
        
        Args:
            reviews: List of review dicts with 'comment' and 'rating' keys
            
        Returns:
            AI-generated summary text
        """
        if not reviews:
            return "No reviews yet."
        
        try:
            # Prepare reviews text
            reviews_text = "\n".join([
                f"Rating: {r['rating']}/5 - {r['comment'][:200]}"
                for r in reviews[:10]  # Limit to 10 most recent
            ])
            
            prompt = f"""Summarize these customer reviews in 2-3 sentences, highlighting key themes and overall sentiment.

Reviews:
{reviews_text}

Summary:"""

            summary = self.generate(prompt, max_tokens=150)
            return summary.strip()
            
        except Exception as e:
            logger.error(f"Review summary generation error: {str(e)}")
            # Fallback to basic stats
            avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
            return f"Average rating: {avg_rating:.1f}/5 based on {len(reviews)} reviews."
    
    def suggest_response(self, review_text: str, rating: int) -> str:
        """
        Generate suggested response to a review
        
        Args:
            review_text: The review content
            rating: Star rating (1-5)
            
        Returns:
            Suggested response text
        """
        try:
            tone = "grateful and professional" if rating >= 4 else "empathetic and constructive"
            
            prompt = f"""Write a brief, {tone} response to this {rating}-star review.
Keep it professional, personalized, and under 100 words.

Review: {review_text}

Response:"""

            response = self.generate(prompt, max_tokens=150)
            return response.strip()
            
        except Exception as e:
            logger.error(f"Response suggestion error: {str(e)}")
            # Generic fallback
            if rating >= 4:
                return "Thank you for your positive feedback! We're glad you had a great experience and look forward to working with you again."
            else:
                return "Thank you for your feedback. We appreciate your input and are committed to improving. Please reach out if you'd like to discuss further."
