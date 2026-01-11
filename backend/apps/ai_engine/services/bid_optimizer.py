"""
AI Bid Optimizer Service

Provides real-time suggestions and optimization for bids.
Analyzes pricing, timeline, content quality, and competitive positioning.
"""

import logging
from typing import Dict, Any, List, Optional
from django.db.models import Avg, Count, Min, Max
from apps.bids.models import Bid
from apps.ai_engine.services.factory import get_ai_provider
from apps.ai_engine.services.matching_service import AIMatchingService

logger = logging.getLogger(__name__)


class BidOptimizerService:
    """
    Real-time bid optimization and suggestions.
    """
    
    def __init__(self):
        self.ai_provider = get_ai_provider()
        self.matching_service = AIMatchingService()
    
    def analyze_bid_strength(self, bid_data: Dict[str, Any], project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze overall bid strength and provide actionable insights.
        
        Returns comprehensive analysis including:
        - Overall strength score
        - Pricing analysis
        - Timeline analysis
        - Content quality
        - Competitive positioning
        - Specific improvement suggestions
        """
        try:
            # Get market context
            market_data = self._get_market_context(project_data)
            
            # Analyze each dimension
            pricing_analysis = self._analyze_pricing(
                bid_data.get('proposed_amount', 0),
                project_data.get('budget', 0),
                market_data
            )
            
            timeline_analysis = self._analyze_timeline(
                bid_data.get('proposed_timeline', 0),
                project_data,
                market_data
            )
            
            content_quality = self._analyze_content_quality(
                bid_data.get('cover_letter', '')
            )
            
            competitive_position = self._analyze_competitive_position(
                bid_data,
                project_data,
                market_data
            )
            
            # Calculate overall strength
            overall_score = self._calculate_overall_strength(
                pricing_analysis['score'],
                timeline_analysis['score'],
                content_quality['score'],
                competitive_position['score']
            )
            
            # Generate improvement suggestions
            suggestions = self._generate_improvement_suggestions(
                pricing_analysis,
                timeline_analysis,
                content_quality,
                competitive_position
            )
            
            return {
                'overall_strength': overall_score,
                'dimensions': {
                    'pricing': pricing_analysis,
                    'timeline': timeline_analysis,
                    'content_quality': content_quality,
                    'competitive_position': competitive_position
                },
                'suggestions': suggestions,
                'win_probability': self._estimate_win_probability(overall_score, market_data),
                'market_insights': market_data,
            }
            
        except Exception as e:
            logger.error(f"Error analyzing bid strength: {e}", exc_info=True)
            return self._fallback_analysis()
    
    def get_realtime_suggestions(self, partial_bid: Dict[str, Any], project_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Provide real-time suggestions as user types bid.
        """
        suggestions = []
        
        # Check pricing if provided
        if 'proposed_amount' in partial_bid:
            price = partial_bid['proposed_amount']
            budget = project_data.get('budget', 0)
            
            if price > budget * 1.2:
                suggestions.append({
                    'type': 'warning',
                    'category': 'pricing',
                    'message': f'Your bid is {int((price/budget - 1) * 100)}% over budget. Consider reducing to improve chances.',
                    'suggestion': f'Recommended range: ${budget * 0.85:.0f} - ${budget * 1.05:.0f}',
                    'priority': 'high'
                })
            elif price < budget * 0.5:
                suggestions.append({
                    'type': 'warning',
                    'category': 'pricing',
                    'message': 'Your bid seems unusually low. This might raise concerns about quality.',
                    'suggestion': f'Consider pricing closer to ${budget * 0.75:.0f}',
                    'priority': 'medium'
                })
        
        # Check timeline
        if 'proposed_timeline' in partial_bid:
            timeline = partial_bid['proposed_timeline']
            
            if timeline < 7:
                suggestions.append({
                    'type': 'warning',
                    'category': 'timeline',
                    'message': 'Very aggressive timeline. Ensure you can realistically deliver.',
                    'suggestion': 'Add buffer time for testing and revisions',
                    'priority': 'high'
                })
        
        # Check cover letter quality
        if 'cover_letter' in partial_bid:
            cover_letter = partial_bid['cover_letter']
            word_count = len(cover_letter.split())
            
            if word_count < 50:
                suggestions.append({
                    'type': 'info',
                    'category': 'content',
                    'message': 'Cover letter seems brief. Add more details about your approach.',
                    'suggestion': 'Aim for 150-300 words to make a strong impression',
                    'priority': 'medium'
                })
            elif word_count > 500:
                suggestions.append({
                    'type': 'info',
                    'category': 'content',
                    'message': 'Cover letter is quite long. Consider being more concise.',
                    'suggestion': 'Focus on key qualifications and unique value',
                    'priority': 'low'
                })
            
            # Check for key elements
            if 'experience' not in cover_letter.lower() and 'worked' not in cover_letter.lower():
                suggestions.append({
                    'type': 'tip',
                    'category': 'content',
                    'message': 'Highlight your relevant experience',
                    'suggestion': 'Mention specific projects or years of experience in this area',
                    'priority': 'medium'
                })
        
        return suggestions
    
    def optimize_pricing(self, project_data: Dict[str, Any], provider_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Suggest optimal pricing strategy based on project and market data.
        """
        budget = project_data.get('budget', 0)
        market_data = self._get_market_context(project_data)
        
        # Calculate recommended price range
        if market_data['avg_winning_bid']:
            base_price = market_data['avg_winning_bid']
        else:
            base_price = budget * 0.9
        
        # Adjust based on provider experience
        experience_multiplier = 1.0 + (provider_data.get('experience_years', 0) * 0.02)
        
        return {
            'recommended_price': base_price * experience_multiplier,
            'competitive_range': {
                'min': base_price * 0.85,
                'max': base_price * 1.15
            },
            'strategy': self._determine_pricing_strategy(budget, base_price, provider_data),
            'market_position': self._calculate_market_position(base_price, market_data),
            'confidence': 0.75
        }
    
    def predict_success_probability(self, bid_data: Dict[str, Any], project_data: Dict[str, Any], provider_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict probability of winning based on bid characteristics.
        """
        # Factors that influence success
        factors = {
            'pricing_competitiveness': 0,
            'timeline_feasibility': 0,
            'skill_match': 0,
            'experience_level': 0,
            'proposal_quality': 0,
        }
        
        # Analyze each factor (0-100)
        factors['pricing_competitiveness'] = self._score_pricing_competitiveness(
            bid_data.get('proposed_amount', 0),
            project_data.get('budget', 0)
        )
        
        factors['timeline_feasibility'] = self._score_timeline_feasibility(
            bid_data.get('proposed_timeline', 0),
            project_data
        )
        
        factors['skill_match'] = self._score_skill_match(
            provider_data.get('skills', []),
            project_data.get('skills', [])
        )
        
        factors['experience_level'] = min(provider_data.get('experience_years', 0) * 10, 100)
        
        factors['proposal_quality'] = self._score_proposal_quality(
            bid_data.get('cover_letter', '')
        )
        
        # Calculate weighted average
        weights = {
            'pricing_competitiveness': 0.25,
            'timeline_feasibility': 0.15,
            'skill_match': 0.30,
            'experience_level': 0.15,
            'proposal_quality': 0.15,
        }
        
        probability = sum(factors[k] * weights[k] for k in factors.keys())
        
        return {
            'probability': round(probability, 1),
            'confidence': 'high' if probability > 70 else 'medium' if probability > 50 else 'low',
            'factors': factors,
            'key_strengths': self._identify_key_strengths(factors),
            'improvement_areas': self._identify_improvement_areas(factors),
        }
    
    # Helper methods
    
    def _get_market_context(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get market context for similar projects."""
        category = project_data.get('category', '')
        budget = project_data.get('budget', 0)
        
        # Query similar projects
        similar_projects = Bid.objects.filter(
            project__category__name=category,
            status='accepted'
        ).aggregate(
            avg_bid=Avg('proposed_amount'),
            min_bid=Min('proposed_amount'),
            max_bid=Max('proposed_amount'),
            avg_timeline=Avg('proposed_timeline'),
            total_bids=Count('id')
        )
        
        return {
            'avg_winning_bid': similar_projects['avg_bid'],
            'bid_range': {
                'min': similar_projects['min_bid'],
                'max': similar_projects['max_bid']
            },
            'avg_timeline': similar_projects['avg_timeline'],
            'competition_level': 'high' if similar_projects['total_bids'] > 20 else 'medium'
        }
    
    def _analyze_pricing(self, proposed_amount: float, budget: float, market_data: Dict) -> Dict[str, Any]:
        """Analyze pricing competitiveness."""
        if budget == 0:
            return {'score': 50, 'status': 'unknown', 'message': 'No budget data available'}
        
        ratio = proposed_amount / budget
        
        if ratio <= 0.85:
            score = 90
            status = 'excellent'
            message = 'Very competitive pricing'
        elif ratio <= 1.0:
            score = 80
            status = 'good'
            message = 'Competitive pricing within budget'
        elif ratio <= 1.15:
            score = 60
            status = 'fair'
            message = 'Slightly over budget but reasonable'
        else:
            score = 30
            status = 'high'
            message = 'Significantly over budget - may reduce chances'
        
        return {
            'score': score,
            'status': status,
            'message': message,
            'budget_ratio': ratio,
            'market_position': 'below_average' if proposed_amount < market_data.get('avg_winning_bid', 0) else 'above_average'
        }
    
    def _analyze_timeline(self, proposed_timeline: int, project_data: Dict, market_data: Dict) -> Dict[str, Any]:
        """Analyze timeline feasibility."""
        avg_market_timeline = market_data.get('avg_timeline', 30)
        
        if proposed_timeline < avg_market_timeline * 0.6:
            score = 50
            status = 'aggressive'
            message = 'Very tight timeline - ensure deliverability'
        elif proposed_timeline <= avg_market_timeline:
            score = 90
            status = 'excellent'
            message = 'Competitive and realistic timeline'
        elif proposed_timeline <= avg_market_timeline * 1.3:
            score = 70
            status = 'good'
            message = 'Reasonable timeline with buffer'
        else:
            score = 40
            status = 'slow'
            message = 'Timeline may be too long compared to competition'
        
        return {
            'score': score,
            'status': status,
            'message': message,
            'market_comparison': f"{int((proposed_timeline / avg_market_timeline) * 100)}% of market average"
        }
    
    def _analyze_content_quality(self, cover_letter: str) -> Dict[str, Any]:
        """Analyze cover letter quality."""
        word_count = len(cover_letter.split())
        
        # Check for key elements
        has_experience = any(word in cover_letter.lower() for word in ['experience', 'worked', 'developed', 'built'])
        has_approach = any(word in cover_letter.lower() for word in ['approach', 'methodology', 'process', 'plan'])
        has_call_to_action = any(word in cover_letter.lower() for word in ['discuss', 'contact', 'meeting', 'call'])
        
        score = 50
        if 150 <= word_count <= 300:
            score += 20
        if has_experience:
            score += 10
        if has_approach:
            score += 10
        if has_call_to_action:
            score += 10
        
        return {
            'score': min(score, 100),
            'word_count': word_count,
            'has_experience': has_experience,
            'has_approach': has_approach,
            'has_call_to_action': has_call_to_action,
            'message': 'Well-structured proposal' if score > 70 else 'Could be improved'
        }
    
    def _analyze_competitive_position(self, bid_data: Dict, project_data: Dict, market_data: Dict) -> Dict[str, Any]:
        """Analyze competitive positioning."""
        # Simplified competitive analysis
        score = 70  # Base score
        
        return {
            'score': score,
            'market_position': 'competitive',
            'message': 'Good positioning in the market',
            'competition_level': market_data.get('competition_level', 'medium')
        }
    
    def _calculate_overall_strength(self, *scores) -> float:
        """Calculate overall strength from dimension scores."""
        return round(sum(scores) / len(scores), 1)
    
    def _generate_improvement_suggestions(self, pricing, timeline, content, competitive) -> List[Dict[str, str]]:
        """Generate specific improvement suggestions."""
        suggestions = []
        
        if pricing['score'] < 70:
            suggestions.append({
                'category': 'pricing',
                'priority': 'high',
                'message': pricing['message'],
                'action': 'Adjust pricing to be more competitive'
            })
        
        if timeline['score'] < 70:
            suggestions.append({
                'category': 'timeline',
                'priority': 'medium',
                'message': timeline['message'],
                'action': 'Revise timeline based on market standards'
            })
        
        if content['score'] < 70:
            suggestions.append({
                'category': 'content',
                'priority': 'high',
                'message': 'Improve cover letter quality',
                'action': 'Add more details about experience and approach'
            })
        
        return suggestions
    
    def _estimate_win_probability(self, overall_score: float, market_data: Dict) -> float:
        """Estimate probability of winning."""
        base_probability = (overall_score / 100) * 0.8
        
        # Adjust based on competition
        competition_level = market_data.get('competition_level', 'medium')
        if competition_level == 'high':
            base_probability *= 0.7
        elif competition_level == 'low':
            base_probability *= 1.2
        
        return min(round(base_probability * 100, 1), 95)
    
    def _determine_pricing_strategy(self, budget: float, market_price: float, provider_data: Dict) -> str:
        """Determine optimal pricing strategy."""
        experience = provider_data.get('experience_years', 0)
        
        if experience >= 5:
            return 'premium' if market_price < budget else 'competitive'
        elif experience >= 2:
            return 'market_rate'
        else:
            return 'competitive'
    
    def _calculate_market_position(self, price: float, market_data: Dict) -> str:
        """Calculate market position."""
        avg_price = market_data.get('avg_winning_bid', 0)
        if not avg_price:
            return 'unknown'
        
        ratio = price / avg_price
        if ratio < 0.85:
            return 'budget'
        elif ratio < 1.15:
            return 'competitive'
        else:
            return 'premium'
    
    def _score_pricing_competitiveness(self, proposed: float, budget: float) -> float:
        """Score pricing competitiveness 0-100."""
        if budget == 0:
            return 50
        
        ratio = proposed / budget
        if ratio <= 0.85:
            return 90
        elif ratio <= 1.0:
            return 80
        elif ratio <= 1.15:
            return 60
        else:
            return 30
    
    def _score_timeline_feasibility(self, timeline: int, project_data: Dict) -> float:
        """Score timeline feasibility 0-100."""
        if 14 <= timeline <= 45:
            return 90
        elif timeline < 7:
            return 40
        elif timeline > 90:
            return 50
        else:
            return 70
    
    def _score_skill_match(self, provider_skills: List[str], project_skills: List[str]) -> float:
        """Score skill match 0-100."""
        if not project_skills:
            return 70
        
        matching = len(set(provider_skills) & set(project_skills))
        total = len(project_skills)
        
        return min((matching / total) * 100, 100)
    
    def _score_proposal_quality(self, cover_letter: str) -> float:
        """Score proposal quality 0-100."""
        word_count = len(cover_letter.split())
        
        if 150 <= word_count <= 300:
            return 85
        elif 100 <= word_count < 150:
            return 70
        elif word_count < 50:
            return 40
        else:
            return 60
    
    def _identify_key_strengths(self, factors: Dict[str, float]) -> List[str]:
        """Identify key strengths."""
        strengths = []
        for key, value in factors.items():
            if value >= 75:
                strengths.append(key.replace('_', ' ').title())
        return strengths[:3]
    
    def _identify_improvement_areas(self, factors: Dict[str, float]) -> List[str]:
        """Identify areas for improvement."""
        areas = []
        for key, value in factors.items():
            if value < 60:
                areas.append(key.replace('_', ' ').title())
        return areas
    
    def _fallback_analysis(self) -> Dict[str, Any]:
        """Fallback analysis when AI fails."""
        return {
            'overall_strength': 70,
            'dimensions': {
                'pricing': {'score': 70, 'status': 'unknown', 'message': 'Unable to analyze'},
                'timeline': {'score': 70, 'status': 'unknown', 'message': 'Unable to analyze'},
                'content_quality': {'score': 70, 'score': 'unknown', 'message': 'Unable to analyze'},
                'competitive_position': {'score': 70, 'status': 'unknown', 'message': 'Unable to analyze'}
            },
            'suggestions': [],
            'win_probability': 50,
            'market_insights': {}
        }
