"""
Bid Comparison Service

Provides AI-powered comparison and analysis of multiple bids.
Helps clients make informed decisions by comparing bids side-by-side.
"""

from typing import List, Dict, Any
from decimal import Decimal
from django.db.models import Avg, Count, Q


class BidComparisonService:
    """
    Service for comparing multiple bids with AI insights.
    
    This service analyzes and compares bids to help clients:
    1. Identify the best match for their project
    2. Compare pricing, timelines, and quality
    3. See AI confidence scores for each bid
    4. Get recommendations based on multiple factors
    """
    
    @staticmethod
    def compare_bids(bid_ids: List[int]) -> Dict[str, Any]:
        """
        Compare multiple bids and provide insights.
        
        Args:
            bid_ids: List of bid IDs to compare
            
        Returns:
            Dictionary with comparison data and recommendations
        """
        from apps.bids.models import Bid
        
        # Get all bids
        bids = Bid.objects.filter(id__in=bid_ids).select_related(
            'project', 'service_provider'
        )
        
        if not bids.exists():
            return {
                'bids': [],
                'comparison': {},
                'recommendation': None
            }
        
        # Gather comparison data
        comparison_data = []
        for bid in bids:
            bid_data = {
                'id': bid.id,
                'provider_id': bid.service_provider.id,
                'provider_name': bid.service_provider.get_full_name(),
                'provider_email': bid.service_provider.email,
                'cover_letter': bid.cover_letter,
                'proposed_amount': float(bid.proposed_amount) if bid.proposed_amount else 0,
                'proposed_timeline': bid.proposed_timeline,
                'ai_score': bid.ai_score or 0,
                'ai_feedback': bid.ai_feedback or {},
                'status': bid.status,
                'created_at': bid.created_at.isoformat(),
                
                # Calculate additional metrics
                'value_score': BidComparisonService._calculate_value_score(bid),
                'experience_score': BidComparisonService._calculate_experience_score(bid),
                'reliability_score': BidComparisonService._calculate_reliability_score(bid),
            }
            
            comparison_data.append(bid_data)
        
        # Calculate comparison metrics
        comparison_metrics = BidComparisonService._calculate_comparison_metrics(comparison_data)
        
        # Generate AI recommendation
        recommendation = BidComparisonService._generate_recommendation(
            comparison_data, 
            comparison_metrics
        )
        
        return {
            'bids': comparison_data,
            'comparison': comparison_metrics,
            'recommendation': recommendation
        }
    
    @staticmethod
    def _calculate_value_score(bid) -> int:
        """
        Calculate value-for-money score (0-100).
        
        Considers:
        - Price competitiveness
        - AI match score
        - Timeline feasibility
        """
        score = 0
        
        # Base on AI score (40 points)
        if bid.ai_score:
            score += (bid.ai_score * 0.4)
        
        # Timeline factor (30 points)
        if bid.proposed_timeline:
            # Assuming reasonable timeline is 30-60 days
            if 30 <= bid.proposed_timeline <= 60:
                score += 30
            elif bid.proposed_timeline < 30:
                score += 20  # Too fast might be risky
            else:
                score += 15  # Too long is less ideal
        
        # Pricing factor (30 points)
        if bid.proposed_amount:
            # Middle range pricing gets higher score
            # This is simplified - in production, compare against market rates
            score += 30
        
        return min(100, int(score))
    
    @staticmethod
    def _calculate_experience_score(bid) -> int:
        """
        Calculate provider experience score (0-100).
        
        Based on:
        - Number of completed projects
        - Average rating
        - Years of experience
        """
        # This is a simplified version
        # In production, query actual provider stats
        
        score = 60  # Base score
        
        # Add points based on AI score (proxy for experience match)
        if bid.ai_score:
            score += (bid.ai_score * 0.4)
        
        return min(100, int(score))
    
    @staticmethod
    def _calculate_reliability_score(bid) -> int:
        """
        Calculate provider reliability score (0-100).
        
        Based on:
        - Response time
        - Past project completion rate
        - Review ratings
        """
        # Simplified version
        score = 70  # Base reliability score
        
        # Adjust based on bid quality factors
        if bid.cover_letter and len(bid.cover_letter) > 200:
            score += 10  # Detailed cover letter = more reliable
        
        if bid.proposed_amount and bid.proposed_timeline:
            score += 10  # Complete bid = more reliable
        
        return min(100, int(score))
    
    @staticmethod
    def _calculate_comparison_metrics(bids_data: List[Dict]) -> Dict[str, Any]:
        """
        Calculate overall comparison metrics.
        
        Returns:
            - Price range
            - Timeline range
            - Average AI scores
            - Best/worst in each category
        """
        if not bids_data:
            return {}
        
        prices = [b['proposed_amount'] for b in bids_data if b['proposed_amount']]
        timelines = [b['proposed_timeline'] for b in bids_data if b['proposed_timeline']]
        ai_scores = [b['ai_score'] for b in bids_data if b['ai_score']]
        value_scores = [b['value_score'] for b in bids_data]
        
        return {
            'price': {
                'min': min(prices) if prices else 0,
                'max': max(prices) if prices else 0,
                'avg': sum(prices) / len(prices) if prices else 0,
                'range': max(prices) - min(prices) if prices else 0
            },
            'timeline': {
                'min': min(timelines) if timelines else 0,
                'max': max(timelines) if timelines else 0,
                'avg': sum(timelines) / len(timelines) if timelines else 0
            },
            'ai_score': {
                'min': min(ai_scores) if ai_scores else 0,
                'max': max(ai_scores) if ai_scores else 0,
                'avg': sum(ai_scores) / len(ai_scores) if ai_scores else 0
            },
            'value_score': {
                'avg': sum(value_scores) / len(value_scores) if value_scores else 0
            },
            'total_bids': len(bids_data)
        }
    
    @staticmethod
    def _generate_recommendation(
        bids_data: List[Dict], 
        metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate AI-powered recommendation for best bid.
        
        Considers:
        - AI match score
        - Value score
        - Experience score
        - Reliability score
        """
        if not bids_data:
            return None
        
        # Calculate composite score for each bid
        for bid in bids_data:
            bid['composite_score'] = (
                bid['ai_score'] * 0.3 +
                bid['value_score'] * 0.3 +
                bid['experience_score'] * 0.2 +
                bid['reliability_score'] * 0.2
            )
        
        # Find top bid
        top_bid = max(bids_data, key=lambda x: x['composite_score'])
        
        # Generate reasons
        reasons = []
        
        if top_bid['ai_score'] >= 80:
            reasons.append("Excellent AI match score")
        
        if top_bid['value_score'] >= 75:
            reasons.append("Great value for money")
        
        if top_bid['experience_score'] >= 75:
            reasons.append("Strong experience in relevant areas")
        
        if top_bid['reliability_score'] >= 80:
            reasons.append("High reliability score")
        
        # Check if clearly better than others
        other_bids = [b for b in bids_data if b['id'] != top_bid['id']]
        if other_bids:
            avg_other_score = sum(b['composite_score'] for b in other_bids) / len(other_bids)
            if top_bid['composite_score'] > avg_other_score + 10:
                confidence = 'high'
            elif top_bid['composite_score'] > avg_other_score + 5:
                confidence = 'medium'
            else:
                confidence = 'low'
        else:
            confidence = 'medium'
        
        return {
            'recommended_bid_id': top_bid['id'],
            'provider_name': top_bid['provider_name'],
            'composite_score': round(top_bid['composite_score'], 1),
            'confidence': confidence,
            'reasons': reasons,
            'summary': f"Based on AI analysis, {top_bid['provider_name']} offers the best "
                      f"overall value with a composite score of {top_bid['composite_score']:.1f}/100."
        }
    
    @staticmethod
    def get_bid_comparison_insights(project_id: int) -> Dict[str, Any]:
        """
        Get comparison insights for all bids on a project.
        
        Args:
            project_id: Project ID
            
        Returns:
            Comparison insights and statistics
        """
        from apps.bids.models import Bid
        
        bids = Bid.objects.filter(project_id=project_id)
        
        total_bids = bids.count()
        avg_amount = bids.aggregate(avg=Avg('proposed_amount'))['avg'] or 0
        avg_timeline = bids.aggregate(avg=Avg('proposed_timeline'))['avg'] or 0
        avg_ai_score = bids.aggregate(avg=Avg('ai_score'))['avg'] or 0
        
        # Status breakdown
        status_counts = bids.values('status').annotate(count=Count('id'))
        
        return {
            'total_bids': total_bids,
            'avg_amount': float(avg_amount),
            'avg_timeline': float(avg_timeline),
            'avg_ai_score': float(avg_ai_score),
            'status_breakdown': list(status_counts),
            'has_bids': total_bids > 0
        }
