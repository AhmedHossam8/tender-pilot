"""
Smart Recommendations Service

Provides intelligent, proactive recommendations for both clients and providers.
"""

import logging
import json
from typing import Dict, Any, List
from django.db.models import Q, Count, Avg
from django.utils import timezone
from apps.projects.models import Project
from apps.bids.models import Bid

logger = logging.getLogger(__name__)


class SmartRecommendationsService:
    """
    Generate personalized recommendations for users.
    """
    
    def get_recommendations_for_provider(self, provider, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get personalized project recommendations for a service provider.
        """
        try:
            # Get provider skills
            provider_skills = []
            if hasattr(provider, 'profile'):
                provider_skills = list(provider.profile.skills.values_list('name', flat=True))
            
            # Find matching projects
            recommendations = []
            
            # 1. Perfect skill matches
            perfect_matches = self._find_perfect_matches(provider, provider_skills)
            recommendations.extend(perfect_matches[:3])
            
            # 2. Good skill matches
            if len(recommendations) < limit:
                good_matches = self._find_good_matches(provider, provider_skills)
                recommendations.extend(good_matches[:4])
            
            # 3. Projects in provider's budget range
            if len(recommendations) < limit:
                budget_matches = self._find_budget_matches(provider)
                recommendations.extend(budget_matches[:3])
            
            # Add recommendation reasons
            for rec in recommendations:
                rec['reasons'] = self._generate_match_reasons(rec, provider, provider_skills)
                rec['confidence'] = self._calculate_confidence(rec, provider, provider_skills)
            
            # Sort by confidence and return
            recommendations.sort(key=lambda x: x['confidence'], reverse=True)
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error getting provider recommendations: {e}", exc_info=True)
            return []
    
    def get_recommendations_for_client(self, client, project_id: str) -> Dict[str, Any]:
        """
        Get recommendations for client about their project.
        """
        try:
            from apps.projects.models import Project
            project = Project.objects.get(id=project_id, created_by=client)
            
            recommendations = {
                'optimize_project': [],
                'review_bids': [],
                'next_actions': [],
            }
            
            # Check if project needs optimization
            if not project.ai_processed:
                recommendations['optimize_project'].append({
                    'type': 'analysis',
                    'priority': 'high',
                    'message': 'Get AI analysis to improve your project',
                    'action': 'analyze_project',
                    'benefit': 'Attract better bids with clearer requirements'
                })
            
            # Check project completeness
            if not project.requirements.exists():
                recommendations['optimize_project'].append({
                    'type': 'requirements',
                    'priority': 'high',
                    'message': 'Add detailed requirements',
                    'action': 'add_requirements',
                    'benefit': 'Get more accurate bids'
                })
            
            # Analyze bids if any
            bids = project.bids.all()
            if bids.count() > 0:
                # Find best bids
                top_bids = bids.filter(ai_score__gte=75).order_by('-ai_score')[:3]
                if top_bids:
                    recommendations['review_bids'].append({
                        'type': 'review',
                        'priority': 'high',
                        'message': f'You have {top_bids.count()} high-quality bids to review',
                        'action': 'review_top_bids',
                        'bid_ids': [str(bid.id) for bid in top_bids]
                    })
                
                # Check for underpriced bids
                budget = project.budget
                low_bids = bids.filter(proposed_amount__lt=budget * 0.6)
                if low_bids.exists():
                    recommendations['review_bids'].append({
                        'type': 'warning',
                        'priority': 'medium',
                        'message': f'{low_bids.count()} bids are significantly under budget',
                        'action': 'verify_quality',
                        'note': 'Very low bids might indicate quality concerns'
                    })
            else:
                # No bids yet
                days_open = (timezone.now() - project.created_at).days
                if days_open > 3:
                    recommendations['next_actions'].append({
                        'type': 'attract_bids',
                        'priority': 'high',
                        'message': 'No bids received yet',
                        'action': 'improve_visibility',
                        'suggestions': [
                            'Add more project details',
                            'Clarify requirements',
                            'Adjust budget if needed'
                        ]
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting client recommendations: {e}", exc_info=True)
            return {}
    
    def optimize_project_for_engagement(self, project) -> Dict[str, Any]:
        """
        Use AI to analyze project and provide optimization suggestions.
        Returns structured suggestions for improving project to attract better bids.
        """
        try:
            from apps.projects.models import Project
            
            # Build project context
            project_context = {
                'title': project.title,
                'description': project.description,
                'budget': float(project.budget) if project.budget else None,
                'category': project.category.name if project.category else None,
                'skills': [skill.name for skill in project.skills.all()],
                'requirements': [req.description for req in project.requirements.all()],
                'has_attachments': project.attachments.exists(),
                'bid_count': project.bids.count(),
                'days_open': (timezone.now() - project.created_at).days,
            }
            
            # Create AI prompt
            prompt = f"""Analyze this project and provide specific optimization suggestions to attract more quality bids.

Project Title: {project_context['title']}
Description: {project_context['description']}
Budget: ${project_context['budget']}
Category: {project_context['category']}
Skills Required: {', '.join(project_context['skills'])}
Requirements: {len(project_context['requirements'])} listed
Attachments: {'Yes' if project_context['has_attachments'] else 'No'}
Current Bids: {project_context['bid_count']}
Days Open: {project_context['days_open']}

Provide a JSON response with these categories:
1. missing_details: Critical information missing from the project (array of strings)
2. improvements: Ways to improve clarity and completeness (array of strings)
3. engagement_tips: Tips to attract more quality providers (array of strings)
4. optimization_score: Overall project quality score 0-10

Focus on specific, actionable suggestions. Be constructive and helpful.

Respond ONLY with valid JSON, no markdown or explanation."""

            # Call AI service
            response = self.ai_service.generate_content(prompt)
            
            if response and response.get('output_text'):
                try:
                    # Parse AI response
                    suggestions = json.loads(response['output_text'])
                    
                    # Ensure all expected fields exist
                    result = {
                        'suggestions': {
                            'missing_details': suggestions.get('missing_details', []),
                            'improvements': suggestions.get('improvements', []),
                            'engagement_tips': suggestions.get('engagement_tips', []),
                        },
                        'optimization_score': suggestions.get('optimization_score', 5),
                        'analyzed_at': timezone.now().isoformat(),
                    }
                    
                    return result
                    
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse AI response: {response['output_text']}")
                    # Return fallback suggestions
                    return self._get_fallback_optimization(project_context)
            else:
                return self._get_fallback_optimization(project_context)
                
        except Exception as e:
            logger.error(f"Error optimizing project: {e}", exc_info=True)
            return self._get_fallback_optimization({})
    
    def _get_fallback_optimization(self, project_context: Dict) -> Dict[str, Any]:
        """Provide rule-based optimization suggestions when AI is unavailable."""
        suggestions = {
            'missing_details': [],
            'improvements': [],
            'engagement_tips': [],
        }
        
        # Check for missing details
        if not project_context.get('requirements'):
            suggestions['missing_details'].append('Add detailed project requirements')
        
        if not project_context.get('skills'):
            suggestions['missing_details'].append('Specify required skills and technologies')
        
        if not project_context.get('budget'):
            suggestions['missing_details'].append('Set a clear budget range')
        
        if not project_context.get('has_attachments'):
            suggestions['improvements'].append('Consider adding reference materials or examples')
        
        # General improvements
        if project_context.get('description', '') and len(project_context['description']) < 100:
            suggestions['improvements'].append('Expand project description with more details')
        
        # Engagement tips
        suggestions['engagement_tips'].append('Respond quickly to questions from providers')
        suggestions['engagement_tips'].append('Clearly communicate your expectations and timeline')
        
        if project_context.get('bid_count', 0) == 0:
            suggestions['engagement_tips'].append("Consider reviewing your budget to ensure it's competitive")
        
        return {
            'suggestions': suggestions,
            'optimization_score': 6,
            'analyzed_at': timezone.now().isoformat(),
            'fallback': True
        }

    def get_trending_opportunities(self, user) -> List[Dict[str, Any]]:
        """
        Get trending opportunities in the marketplace.
        """
        try:
            from django.utils import timezone
            from datetime import timedelta
            
            recent = timezone.now() - timedelta(days=7)
            
            # Find projects with high activity
            trending = Project.objects.filter(
                created_at__gte=recent,
                status='open'
            ).annotate(
                bid_count=Count('bids')
            ).filter(bid_count__gte=3).order_by('-bid_count')[:5]
            
            opportunities = []
            for project in trending:
                opportunities.append({
                    'project_id': str(project.id),
                    'title': project.title,
                    'budget': float(project.budget),
                    'bid_count': project.bid_count,
                    'category': project.category.name if project.category else 'General',
                    'urgency': 'high' if project.bid_count > 5 else 'medium',
                    'competition_level': 'high' if project.bid_count > 5 else 'medium'
                })
            
            return opportunities
            
        except Exception as e:
            logger.error(f"Error getting trending opportunities: {e}", exc_info=True)
            return []
    
    # Helper methods
    
    def _find_perfect_matches(self, provider, provider_skills: List[str]) -> List[Dict[str, Any]]:
        """Find projects that perfectly match provider skills."""
        if not provider_skills:
            return []
        
        projects = Project.objects.filter(
            status='open',
            skills__name__in=provider_skills
        ).distinct().annotate(
            skill_count=Count('skills')
        )
        
        matches = []
        for project in projects:
            project_skills = list(project.skills.values_list('name', flat=True))
            matching_skills = set(provider_skills) & set(project_skills)
            
            if len(matching_skills) >= len(project_skills) * 0.8:  # 80% match
                matches.append({
                    'project': self._serialize_project(project),
                    'match_type': 'perfect',
                    'matching_skills': list(matching_skills),
                    'match_percentage': 95
                })
        
        return matches
    
    def _find_good_matches(self, provider, provider_skills: List[str]) -> List[Dict[str, Any]]:
        """Find projects with good skill match."""
        if not provider_skills:
            return []
        
        projects = Project.objects.filter(
            status='open',
            skills__name__in=provider_skills
        ).distinct()
        
        matches = []
        for project in projects:
            project_skills = list(project.skills.values_list('name', flat=True))
            matching_skills = set(provider_skills) & set(project_skills)
            
            if len(matching_skills) >= 2:  # At least 2 skills match
                match_pct = int((len(matching_skills) / len(project_skills)) * 100)
                if match_pct >= 50:
                    matches.append({
                        'project': self._serialize_project(project),
                        'match_type': 'good',
                        'matching_skills': list(matching_skills),
                        'match_percentage': match_pct
                    })
        
        return matches
    
    def _find_budget_matches(self, provider) -> List[Dict[str, Any]]:
        """Find projects matching provider's typical budget range."""
        # Get provider's average bid amount
        avg_bid = Bid.objects.filter(
            service_provider=provider
        ).aggregate(avg=Avg('proposed_amount'))['avg']
        
        if not avg_bid:
            return []
        
        # Find projects in similar budget range
        projects = Project.objects.filter(
            status='open',
            budget__gte=avg_bid * 0.7,
            budget__lte=avg_bid * 1.3
        )[:5]
        
        matches = []
        for project in projects:
            matches.append({
                'project': self._serialize_project(project),
                'match_type': 'budget',
                'matching_skills': [],
                'match_percentage': 70
            })
        
        return matches
    
    def _serialize_project(self, project) -> Dict[str, Any]:
        """Serialize project for recommendations."""
        description = project.description or ""
        safe_budget = float(project.budget) if project.budget is not None else 0.0

        return {
            'id': str(project.id),
            'title': project.title,
            'description': description[:200] + '...' if len(description) > 200 else description,
            'budget': safe_budget,
            'category': project.category.name if project.category else 'General',
            'skills': list(project.skills.values_list('name', flat=True)),
            'bid_count': project.bids.count(),
            'created_at': project.created_at.isoformat()
        }
    
    def _generate_match_reasons(self, recommendation: Dict, provider, provider_skills: List[str]) -> List[str]:
        """Generate reasons why this project is recommended."""
        reasons = []
        
        match_type = recommendation.get('match_type')
        matching_skills = recommendation.get('matching_skills', [])
        
        if match_type == 'perfect':
            reasons.append('Perfect match for your skills')
        elif match_type == 'good':
            reasons.append(f'Strong match: {len(matching_skills)} matching skills')
        elif match_type == 'budget':
            reasons.append('Budget matches your typical projects')
        
        if matching_skills:
            reasons.append(f'Required skills: {", ".join(matching_skills[:3])}')
        
        project_data = recommendation.get('project', {})
        bid_count = project_data.get('bid_count', 0)
        if bid_count < 3:
            reasons.append('Low competition - act fast!')
        
        return reasons
    
    def _calculate_confidence(self, recommendation: Dict, provider, provider_skills: List[str]) -> float:
        """Calculate confidence score for recommendation."""
        confidence = recommendation.get('match_percentage', 50)
        
        # Adjust based on factors
        match_type = recommendation.get('match_type')
        if match_type == 'perfect':
            confidence *= 1.1
        
        # Reduce confidence if high competition
        project_data = recommendation.get('project', {})
        bid_count = project_data.get('bid_count', 0)
        if bid_count > 10:
            confidence *= 0.9
        
        return min(confidence, 100)
