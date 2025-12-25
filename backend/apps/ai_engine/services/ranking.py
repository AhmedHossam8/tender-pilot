"""
AI Recommendation Ranking Service

This module provides intelligent ranking of AI-generated recommendations
based on multiple factors including relevance, confidence, historical accuracy,
and user feedback.

The ranking system ensures that users see the most valuable and actionable
recommendations first, improving the overall effectiveness of AI suggestions.

Architecture:
- Multi-factor scoring algorithm
- Historical performance tracking
- User feedback integration (ready for future)
- Context-aware ranking

Example:
    ranker = AIRecommendationRanker()
    ranked_recommendations = ranker.rank_recommendations(
        recommendations=[...],
        context={'tender_complexity': 'high'}
    )
"""

import logging
from typing import List, Dict, Any, Optional
from decimal import Decimal
from django.db.models import Avg, Count

logger = logging.getLogger(__name__)


class AIRecommendationRanker:
    """
    Ranks AI-generated recommendations using a multi-factor scoring system.
    
    Scoring Factors:
    1. Relevance Score (0-1) - From AI model's confidence
    2. Specificity Score (0-1) - How specific/actionable the recommendation is
    3. Historical Accuracy (0-1) - Past performance of similar recommendations
    4. User Feedback Weight (0-1) - Based on past user acceptance
    5. Priority Boost - Context-based priority adjustments
    
    Final Score = weighted_average(all_factors) * priority_boost
    """
    
    # Weights for different scoring factors
    WEIGHTS = {
        'relevance': 0.35,      # AI's confidence in the recommendation
        'specificity': 0.25,    # How actionable/specific it is
        'historical': 0.20,     # Past performance
        'feedback': 0.15,       # User feedback history
        'recency': 0.05,        # Prefer recent patterns
    }
    
    def __init__(self):
        """Initialize the ranker with default configuration."""
        self.weights = self.WEIGHTS.copy()
    
    def rank_recommendations(
        self,
        recommendations: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Rank a list of recommendations.
        
        Args:
            recommendations: List of recommendation dictionaries
                Each should have at minimum:
                - 'text': The recommendation text
                - 'relevance_score': AI's confidence (0-1)
            context: Optional context for ranking
                - 'tender_complexity': low|medium|high
                - 'user_role': Role of requesting user
                - 'analysis_type': Type of analysis
        
        Returns:
            List of recommendations with added fields:
                - 'rank': Integer rank (1 = best)
                - 'score': Overall score (0-1)
                - 'score_breakdown': Dict of individual scores
        
        Example:
            recommendations = [
                {'text': 'Add ISO certification', 'relevance_score': 0.85},
                {'text': 'Include timeline', 'relevance_score': 0.92}
            ]
            ranked = ranker.rank_recommendations(recommendations)
            # ranked[0] will be the highest-scoring recommendation
        """
        if not recommendations:
            return []
        
        context = context or {}
        
        # Score each recommendation
        scored_recommendations = []
        for rec in recommendations:
            score_data = self._calculate_score(rec, context)
            
            # Add score information to recommendation
            rec_with_score = rec.copy()
            rec_with_score['score'] = score_data['total_score']
            rec_with_score['score_breakdown'] = score_data['breakdown']
            
            scored_recommendations.append(rec_with_score)
        
        # Sort by score (highest first)
        scored_recommendations.sort(
            key=lambda x: x['score'],
            reverse=True
        )
        
        # Add rank numbers
        for rank, rec in enumerate(scored_recommendations, start=1):
            rec['rank'] = rank
        
        logger.info(
            f"Ranked {len(recommendations)} recommendations. "
            f"Top score: {scored_recommendations[0]['score']:.3f}"
        )
        
        return scored_recommendations
    
    def _calculate_score(
        self,
        recommendation: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate overall score for a single recommendation.
        
        Returns:
            Dict with 'total_score' and 'breakdown' of individual scores
        """
        breakdown = {}
        
        # 1. Relevance Score (from AI)
        breakdown['relevance'] = float(
            recommendation.get('relevance_score', 0.5)
        )
        
        # 2. Specificity Score
        breakdown['specificity'] = self._calculate_specificity_score(
            recommendation
        )
        
        # 3. Historical Accuracy
        breakdown['historical'] = self._calculate_historical_score(
            recommendation, context
        )
        
        # 4. User Feedback Score
        breakdown['feedback'] = self._calculate_feedback_score(
            recommendation, context
        )
        
        # 5. Recency Score
        breakdown['recency'] = self._calculate_recency_score(
            recommendation
        )
        
        # Calculate weighted average
        total_score = sum(
            breakdown[factor] * self.weights[factor]
            for factor in self.weights
        )
        
        # Apply context-based priority boost
        priority_boost = self._calculate_priority_boost(
            recommendation, context
        )
        total_score *= priority_boost
        
        # Ensure score is in [0, 1] range
        total_score = max(0.0, min(1.0, total_score))
        
        return {
            'total_score': total_score,
            'breakdown': breakdown,
            'priority_boost': priority_boost
        }
    
    def _calculate_specificity_score(
        self,
        recommendation: Dict[str, Any]
    ) -> float:
        """
        Calculate how specific and actionable a recommendation is.
        
        Higher scores for:
        - Specific numbers/metrics mentioned
        - Clear action verbs
        - Concrete examples
        - Detailed explanations
        """
        text = recommendation.get('text', '')
        
        if not text:
            return 0.0
        
        score = 0.5  # Base score
        
        # Check for specific indicators
        indicators = {
            'numbers': ['%', 'percent', 'dollar', '$', '€', '£'],
            'action_verbs': ['add', 'include', 'remove', 'update', 'change',
                           'create', 'implement', 'specify', 'define'],
            'specificity_words': ['specifically', 'exactly', 'precisely',
                                'particular', 'detailed'],
            'examples': ['example', 'for instance', 'such as', 'e.g.'],
        }
        
        text_lower = text.lower()
        
        # Check for numbers/metrics
        if any(ind in text_lower for ind in indicators['numbers']):
            score += 0.15
        
        # Check for action verbs
        if any(verb in text_lower for verb in indicators['action_verbs']):
            score += 0.15
        
        # Check for specificity words
        if any(word in text_lower for word in indicators['specificity_words']):
            score += 0.10
        
        # Check for examples
        if any(word in text_lower for word in indicators['examples']):
            score += 0.10
        
        # Length factor (longer = more detailed, but diminishing returns)
        word_count = len(text.split())
        if word_count > 50:
            score += 0.10
        elif word_count > 20:
            score += 0.05
        
        return min(1.0, score)
    
    def _calculate_historical_score(
        self,
        recommendation: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """
        Calculate score based on historical performance of similar recommendations.
        
        In a full implementation, this would:
        1. Find similar past recommendations
        2. Check their acceptance rate
        3. Check their effectiveness (if measured)
        
        For now, returns a baseline score that can be enhanced later.
        """
        # TODO: Implement when recommendation feedback system is ready
        # This would query a RecommendationFeedback model to find:
        # - How often similar recommendations were accepted
        # - How often they led to successful proposals
        # - User ratings for similar recommendations
        
        # Default to neutral score until historical data is available
        return 0.7
    
    def _calculate_feedback_score(
        self,
        recommendation: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """
        Calculate score based on user feedback patterns.
        
        Future implementation will track:
        - User acceptance rate for recommendation types
        - User role preferences
        - Domain-specific feedback
        """
        # TODO: Implement when user feedback system is ready
        # This would consider:
        # - User's past interactions with similar recommendations
        # - Team's historical preferences
        # - Industry-specific patterns
        
        # Default to neutral score
        return 0.7
    
    def _calculate_recency_score(
        self,
        recommendation: Dict[str, Any]
    ) -> float:
        """
        Calculate score based on recommendation recency/freshness.
        
        Newer AI models and patterns might be more relevant.
        """
        # Check if recommendation has a creation timestamp
        created_at = recommendation.get('created_at')
        
        if not created_at:
            return 0.7  # Neutral if no timestamp
        
        # TODO: Calculate age-based score when timestamps are available
        # Newer recommendations get slightly higher scores
        
        return 0.75
    
    def _calculate_priority_boost(
        self,
        recommendation: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """
        Calculate priority boost based on context.
        
        Certain recommendations are more important in specific contexts.
        Returns a multiplier (0.8 - 1.2)
        """
        boost = 1.0
        
        # Check recommendation category/type
        rec_type = recommendation.get('category', '').lower()
        rec_priority = recommendation.get('priority', 'medium').lower()
        
        # Priority-based boost
        priority_boosts = {
            'critical': 1.2,
            'high': 1.1,
            'medium': 1.0,
            'low': 0.9,
        }
        boost *= priority_boosts.get(rec_priority, 1.0)
        
        # Context-based boost
        tender_complexity = context.get('tender_complexity', 'medium')
        
        # For high complexity tenders, boost detailed recommendations
        if tender_complexity == 'high':
            if recommendation.get('detail_level') == 'detailed':
                boost *= 1.1
        
        # For low complexity, boost quick-win recommendations
        if tender_complexity == 'low':
            if rec_type in ['quick-win', 'simple']:
                boost *= 1.1
        
        # Boost mandatory requirements over optional ones
        if recommendation.get('is_mandatory', False):
            boost *= 1.15
        
        # Ensure boost stays in reasonable range
        return max(0.8, min(1.2, boost))
    
    def rank_by_category(
        self,
        recommendations: List[Dict[str, Any]],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Rank recommendations and group them by category.
        
        Args:
            recommendations: List of recommendations
            context: Optional context for ranking
        
        Returns:
            Dict mapping category names to ranked recommendation lists
        
        Example:
            {
                'compliance': [ranked_recommendations],
                'technical': [ranked_recommendations],
                'pricing': [ranked_recommendations]
            }
        """
        # First, rank all recommendations
        ranked = self.rank_recommendations(recommendations, context)
        
        # Group by category
        categorized = {}
        for rec in ranked:
            category = rec.get('category', 'general')
            if category not in categorized:
                categorized[category] = []
            categorized[category].append(rec)
        
        # Re-rank within each category (assign local ranks)
        for category, recs in categorized.items():
            for local_rank, rec in enumerate(recs, start=1):
                rec['category_rank'] = local_rank
        
        return categorized
    
    def get_top_n(
        self,
        recommendations: List[Dict[str, Any]],
        n: int = 5,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get top N recommendations.
        
        Args:
            recommendations: List of recommendations
            n: Number of top recommendations to return
            context: Optional context for ranking
        
        Returns:
            List of top N recommendations
        """
        ranked = self.rank_recommendations(recommendations, context)
        return ranked[:n]


class RecommendationFilter:
    """
    Filters recommendations based on various criteria.
    
    Useful for removing duplicates, filtering by relevance threshold,
    or applying business rules.
    """
    
    @staticmethod
    def remove_duplicates(
        recommendations: List[Dict[str, Any]],
        similarity_threshold: float = 0.85
    ) -> List[Dict[str, Any]]:
        """
        Remove duplicate or very similar recommendations.
        
        Args:
            recommendations: List of recommendations
            similarity_threshold: How similar (0-1) to consider duplicate
        
        Returns:
            Filtered list with duplicates removed
        """
        if not recommendations:
            return []
        
        filtered = []
        
        for rec in recommendations:
            is_duplicate = False
            rec_text = rec.get('text', '').lower()
            
            for existing in filtered:
                existing_text = existing.get('text', '').lower()
                
                # Simple similarity check (can be enhanced with NLP)
                similarity = RecommendationFilter._simple_similarity(
                    rec_text, existing_text
                )
                
                if similarity >= similarity_threshold:
                    is_duplicate = True
                    # Keep the one with higher score
                    if rec.get('score', 0) > existing.get('score', 0):
                        filtered.remove(existing)
                        filtered.append(rec)
                    break
            
            if not is_duplicate:
                filtered.append(rec)
        
        logger.info(
            f"Filtered {len(recommendations) - len(filtered)} duplicate "
            f"recommendations"
        )
        
        return filtered
    
    @staticmethod
    def _simple_similarity(text1: str, text2: str) -> float:
        """
        Calculate simple text similarity.
        
        Returns:
            Similarity score (0-1)
        """
        if text1 == text2:
            return 1.0
        
        # Split into words
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if not words1 or not words2:
            return 0.0
        
        # Jaccard similarity
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    @staticmethod
    def filter_by_threshold(
        recommendations: List[Dict[str, Any]],
        min_score: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Filter out recommendations below a score threshold.
        
        Args:
            recommendations: List of recommendations
            min_score: Minimum score to keep (0-1)
        
        Returns:
            Filtered list
        """
        filtered = [
            rec for rec in recommendations
            if rec.get('score', 0) >= min_score
        ]
        
        logger.info(
            f"Filtered to {len(filtered)}/{len(recommendations)} "
            f"recommendations above {min_score} threshold"
        )
        
        return filtered
