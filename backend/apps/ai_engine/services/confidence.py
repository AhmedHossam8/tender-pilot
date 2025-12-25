"""
AI Confidence Scoring Service

This module provides confidence scoring for AI-generated outputs, helping users
understand how reliable and trustworthy each AI response is.

The confidence scoring system analyzes multiple factors to produce an overall
confidence level (low/medium/high) and a numerical score (0-1), along with
detailed factor breakdowns.

Key Features:
- Multi-factor confidence analysis
- Input quality assessment
- Model certainty evaluation
- Historical accuracy consideration
- Response consistency checking

Architecture:
- Modular scoring components
- Extensible factor system
- Transparent score breakdown
- Ready for ML model integration

Example:
    scorer = AIConfidenceScorer()
    confidence = scorer.calculate_confidence(
        ai_response=response,
        input_quality=0.85,
        model='gpt-4'
    )
    # Returns: {'score': 0.87, 'level': 'high', 'factors': {...}}
"""

import logging
import re
from typing import Dict, Any, Optional, List
from decimal import Decimal

logger = logging.getLogger(__name__)


class AIConfidenceScorer:
    """
    Calculate confidence scores for AI-generated outputs.
    
    Confidence Factors:
    1. Model Certainty (0-1) - From AI model's own confidence
    2. Input Quality (0-1) - Quality of the input text/data
    3. Response Completeness (0-1) - How complete the response is
    4. Response Consistency (0-1) - Internal consistency of response
    5. Historical Accuracy (0-1) - Past performance for similar tasks
    
    Final Confidence Score = weighted_average(all_factors)
    Confidence Level = low (<0.6) | medium (0.6-0.8) | high (>0.8)
    """
    
    # Weights for different confidence factors
    WEIGHTS = {
        'model_certainty': 0.30,       # AI's own confidence
        'input_quality': 0.25,         # Quality of input
        'completeness': 0.20,          # Response completeness
        'consistency': 0.15,           # Internal consistency
        'historical_accuracy': 0.10,   # Past performance
    }
    
    # Confidence level thresholds
    LEVELS = {
        'low': (0.0, 0.6),
        'medium': (0.6, 0.8),
        'high': (0.8, 1.0),
    }
    
    def __init__(self):
        """Initialize the confidence scorer."""
        self.weights = self.WEIGHTS.copy()
    
    def calculate_confidence(
        self,
        ai_response: Dict[str, Any],
        input_text: str = "",
        model: str = "unknown",
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive confidence score for an AI response.
        
        Args:
            ai_response: The AI response object containing:
                - 'content': The generated text
                - 'finish_reason': Why the model stopped
                - 'model_confidence': Optional model confidence score
            input_text: The input text that generated this response
            model: The AI model used
            context: Optional additional context
        
        Returns:
            Dict containing:
                - 'score': Overall confidence score (0-1)
                - 'level': Confidence level ('low', 'medium', 'high')
                - 'factors': Breakdown of individual factor scores
                - 'explanation': Human-readable explanation
                - 'recommendations': Suggestions if confidence is low
        
        Example:
            confidence = scorer.calculate_confidence(
                ai_response={'content': 'Analysis...', 'finish_reason': 'stop'},
                input_text='Tender document text...',
                model='gpt-4'
            )
            # Returns:
            # {
            #     'score': 0.87,
            #     'level': 'high',
            #     'factors': {
            #         'model_certainty': 0.90,
            #         'input_quality': 0.85,
            #         ...
            #     },
            #     'explanation': 'High confidence based on...',
            #     'recommendations': []
            # }
        """
        context = context or {}
        factors = {}
        
        # 1. Model Certainty
        factors['model_certainty'] = self._assess_model_certainty(
            ai_response, model
        )
        
        # 2. Input Quality
        factors['input_quality'] = self._assess_input_quality(
            input_text, context
        )
        
        # 3. Response Completeness
        factors['completeness'] = self._assess_completeness(
            ai_response
        )
        
        # 4. Response Consistency
        factors['consistency'] = self._assess_consistency(
            ai_response
        )
        
        # 5. Historical Accuracy
        factors['historical_accuracy'] = self._assess_historical_accuracy(
            model, context
        )
        
        # Calculate weighted average
        overall_score = sum(
            factors[factor] * self.weights[factor]
            for factor in self.weights
        )
        
        # Determine confidence level
        confidence_level = self._determine_level(overall_score)
        
        # Generate explanation
        explanation = self._generate_explanation(
            overall_score, confidence_level, factors
        )
        
        # Generate recommendations if needed
        recommendations = self._generate_recommendations(
            overall_score, factors
        )
        
        result = {
            'score': round(overall_score, 3),
            'level': confidence_level,
            'factors': {k: round(v, 3) for k, v in factors.items()},
            'explanation': explanation,
            'recommendations': recommendations,
        }
        
        logger.debug(
            f"Calculated confidence: {overall_score:.3f} ({confidence_level}) "
            f"for model {model}"
        )
        
        return result
    
    def _assess_model_certainty(
        self,
        ai_response: Dict[str, Any],
        model: str
    ) -> float:
        """
        Assess the AI model's certainty in its response.
        
        Indicators:
        - Model-provided confidence score
        - Finish reason (stop = good, length = uncertain)
        - Presence of hedging language
        - Model type reliability
        """
        score = 0.7  # Base score
        
        # Check if model provided confidence
        model_confidence = ai_response.get('model_confidence')
        if model_confidence is not None:
            return float(model_confidence)
        
        # Check finish reason
        finish_reason = ai_response.get('finish_reason', 'stop')
        if finish_reason == 'stop':
            score += 0.2  # Clean completion
        elif finish_reason == 'length':
            score -= 0.2  # Might be incomplete
        elif finish_reason in ['content_filter', 'error']:
            score -= 0.4  # Problems during generation
        
        # Check for hedging language in response
        content = ai_response.get('content', '')
        hedging_phrases = [
            'might', 'maybe', 'possibly', 'perhaps', 'could be',
            'unclear', 'uncertain', 'not sure', 'difficult to determine'
        ]
        
        content_lower = content.lower()
        hedging_count = sum(
            1 for phrase in hedging_phrases
            if phrase in content_lower
        )
        
        # Reduce score based on hedging (but not too much)
        score -= min(0.2, hedging_count * 0.05)
        
        # Model-specific reliability
        high_reliability_models = ['gpt-4', 'gpt-4o', 'claude-3-opus']
        if any(m in model.lower() for m in high_reliability_models):
            score += 0.1
        
        return max(0.0, min(1.0, score))
    
    def _assess_input_quality(
        self,
        input_text: str,
        context: Dict[str, Any]
    ) -> float:
        """
        Assess the quality of the input text.
        
        Quality indicators:
        - Length (too short = low quality)
        - Structure (paragraphs, formatting)
        - Language quality
        - Information density
        """
        if not input_text:
            return 0.3  # Very low if no input
        
        score = 0.5  # Base score
        
        # Length assessment
        char_count = len(input_text)
        word_count = len(input_text.split())
        
        if word_count < 50:
            score -= 0.2  # Very short
        elif word_count < 200:
            score -= 0.1  # Short
        elif word_count > 500:
            score += 0.2  # Good length
        elif word_count > 1000:
            score += 0.3  # Comprehensive
        
        # Structure assessment
        paragraphs = input_text.split('\n\n')
        if len(paragraphs) > 2:
            score += 0.1  # Well-structured
        
        # Check for special characters/numbers (indicates structured data)
        has_numbers = bool(re.search(r'\d+', input_text))
        has_special = bool(re.search(r'[$€£%]', input_text))
        
        if has_numbers:
            score += 0.05
        if has_special:
            score += 0.05
        
        # Check for complete sentences
        sentences = re.split(r'[.!?]+', input_text)
        complete_sentences = [s for s in sentences if len(s.split()) > 3]
        
        if len(complete_sentences) >= 3:
            score += 0.1
        
        return max(0.0, min(1.0, score))
    
    def _assess_completeness(
        self,
        ai_response: Dict[str, Any]
    ) -> float:
        """
        Assess how complete the AI response is.
        
        Completeness indicators:
        - Response length
        - Structural elements present
        - Finish reason
        - Truncation indicators
        """
        content = ai_response.get('content', '')
        
        if not content:
            return 0.0
        
        score = 0.6  # Base score
        
        # Length check
        word_count = len(content.split())
        if word_count < 50:
            score -= 0.3  # Very short, likely incomplete
        elif word_count > 200:
            score += 0.2  # Comprehensive
        
        # Check for truncation indicators
        truncation_indicators = ['...', '[truncated]', '[continued]']
        if any(ind in content for ind in truncation_indicators):
            score -= 0.3
        
        # Check if ends properly
        if content.strip().endswith(('.', '!', '?')):
            score += 0.1
        else:
            score -= 0.1  # Might be cut off
        
        # Check finish reason
        finish_reason = ai_response.get('finish_reason', 'stop')
        if finish_reason == 'stop':
            score += 0.1
        elif finish_reason == 'length':
            score -= 0.2  # Definitely incomplete
        
        return max(0.0, min(1.0, score))
    
    def _assess_consistency(
        self,
        ai_response: Dict[str, Any]
    ) -> float:
        """
        Assess internal consistency of the response.
        
        Consistency checks:
        - No contradictions
        - Coherent structure
        - Consistent terminology
        - Logical flow
        """
        content = ai_response.get('content', '')
        
        if not content:
            return 0.5
        
        score = 0.7  # Base score
        
        # Check for obvious contradictions
        contradiction_patterns = [
            ('yes', 'no'),
            ('always', 'never'),
            ('required', 'not required'),
            ('must', 'must not'),
        ]
        
        content_lower = content.lower()
        for pos, neg in contradiction_patterns:
            if pos in content_lower and neg in content_lower:
                # Check if they're close together (might be explaining contrast)
                pos_idx = content_lower.find(pos)
                neg_idx = content_lower.find(neg)
                if abs(pos_idx - neg_idx) < 100:
                    score -= 0.1
        
        # Check for structural consistency
        # Count list items, if present
        numbered_items = re.findall(r'^\d+[\.)]\s', content, re.MULTILINE)
        bullet_items = re.findall(r'^[•\-\*]\s', content, re.MULTILINE)
        
        if numbered_items or bullet_items:
            score += 0.1  # Has structure
        
        # Check for repeated phrases (might indicate generation issues)
        words = content.split()
        if len(words) > 20:
            # Simple check for repetition
            unique_words = len(set(words))
            if unique_words / len(words) < 0.5:
                score -= 0.2  # Too much repetition
        
        return max(0.0, min(1.0, score))
    
    def _assess_historical_accuracy(
        self,
        model: str,
        context: Dict[str, Any]
    ) -> float:
        """
        Assess historical accuracy for this type of task.
        
        In a full implementation, this would query historical data
        to see how accurate this model has been for similar tasks.
        """
        # TODO: Implement when historical tracking is available
        # This would query AIResponse model to find:
        # - Past responses from this model
        # - For similar task types
        # - Their accuracy ratings
        # - User feedback scores
        
        # For now, return model-based estimates
        model_reliability = {
            'gpt-4': 0.85,
            'gpt-4o': 0.85,
            'gpt-4-turbo': 0.82,
            'gpt-3.5-turbo': 0.75,
            'claude-3-opus': 0.85,
            'claude-3-sonnet': 0.80,
            'gemini-1.5-pro': 0.80,
            'gemini-2.5-flash': 0.75,
        }
        
        for model_name, reliability in model_reliability.items():
            if model_name in model.lower():
                return reliability
        
        return 0.75  # Default
    
    def _determine_level(self, score: float) -> str:
        """
        Determine confidence level from score.
        
        Args:
            score: Confidence score (0-1)
        
        Returns:
            'low', 'medium', or 'high'
        """
        for level, (min_score, max_score) in self.LEVELS.items():
            if min_score <= score < max_score:
                return level
        return 'high'  # If >= 0.8
    
    def _generate_explanation(
        self,
        score: float,
        level: str,
        factors: Dict[str, float]
    ) -> str:
        """
        Generate human-readable explanation of confidence score.
        """
        # Find the strongest and weakest factors
        sorted_factors = sorted(
            factors.items(),
            key=lambda x: x[1],
            reverse=True
        )
        strongest = sorted_factors[0]
        weakest = sorted_factors[-1]
        
        explanations = {
            'high': (
                f"High confidence (score: {score:.2f}). "
                f"The analysis is well-supported with strong {strongest[0].replace('_', ' ')} "
                f"({strongest[1]:.2f}) and reliable across all factors."
            ),
            'medium': (
                f"Medium confidence (score: {score:.2f}). "
                f"The analysis is generally reliable, though {weakest[0].replace('_', ' ')} "
                f"could be improved ({weakest[1]:.2f}). Consider verifying key points."
            ),
            'low': (
                f"Low confidence (score: {score:.2f}). "
                f"The analysis has limitations, particularly in {weakest[0].replace('_', ' ')} "
                f"({weakest[1]:.2f}). We recommend manual review and verification."
            ),
        }
        
        return explanations.get(level, f"Confidence score: {score:.2f}")
    
    def _generate_recommendations(
        self,
        score: float,
        factors: Dict[str, float]
    ) -> List[str]:
        """
        Generate recommendations for improving confidence or handling low confidence.
        """
        recommendations = []
        
        # Overall low confidence
        if score < 0.6:
            recommendations.append(
                "Review and verify the AI analysis manually before use"
            )
            recommendations.append(
                "Consider providing more detailed input for better results"
            )
        
        # Specific factor recommendations
        if factors.get('input_quality', 1.0) < 0.6:
            recommendations.append(
                "Input quality is low - try providing more detailed information"
            )
        
        if factors.get('completeness', 1.0) < 0.6:
            recommendations.append(
                "Response may be incomplete - consider regenerating or requesting more detail"
            )
        
        if factors.get('consistency', 1.0) < 0.6:
            recommendations.append(
                "Response has internal inconsistencies - verify conflicting points"
            )
        
        if factors.get('model_certainty', 1.0) < 0.6:
            recommendations.append(
                "Model shows uncertainty - cross-check critical information"
            )
        
        return recommendations
    
    def calculate_batch_confidence(
        self,
        responses: List[Dict[str, Any]],
        input_texts: List[str] = None,
        model: str = "unknown"
    ) -> List[Dict[str, Any]]:
        """
        Calculate confidence for multiple responses efficiently.
        
        Args:
            responses: List of AI responses
            input_texts: Optional list of corresponding input texts
            model: The AI model used
        
        Returns:
            List of confidence results
        """
        if input_texts is None:
            input_texts = [""] * len(responses)
        
        results = []
        for response, input_text in zip(responses, input_texts):
            confidence = self.calculate_confidence(
                ai_response=response,
                input_text=input_text,
                model=model
            )
            results.append(confidence)
        
        logger.info(
            f"Calculated confidence for {len(responses)} responses. "
            f"Average: {sum(r['score'] for r in results) / len(results):.3f}"
        )
        
        return results
