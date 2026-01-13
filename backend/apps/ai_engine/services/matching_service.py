"""
AI Matching Service for ServiceHub marketplace.

This service provides intelligent matching between projects and service providers,
AI-powered bid assistance, and competitive pricing suggestions.
"""

import json
import logging
from typing import Dict, List, Optional, Tuple
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from django.utils import timezone
from django.utils.translation import get_language, gettext as _, override
from datetime import timedelta

from apps.ai_engine.services.provider import get_ai_provider as get_provider
from apps.ai_engine.services.matching_cache import MatchingCache
from apps.ai_engine.prompts.matching import (
    get_match_score_prompt,
    get_rank_providers_prompt,
    get_cover_letter_prompt,
    get_pricing_suggestion_prompt,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class AIMatchingService:
    """
    Service for AI-powered matching between projects and service providers.
    
    This service uses AI to:
    - Calculate compatibility scores between projects and providers
    - Rank multiple providers for a project
    - Generate cover letters for bids
    - Suggest competitive pricing
    """
    
    def __init__(self, provider_name: str = "gemini"):
        """
        Initialize the matching service.
        
        Args:
            provider_name: Name of the AI provider to use ("gemini" or "openai")
        """
        self.ai_provider = get_provider(provider_name)
        self.logger = logger
    
    def match_providers_to_project(self, project, limit: int = 10, use_cache: bool = True, provider_ids: Optional[List[int]] = None) -> List[Dict]:
        """
        Find and rank the best matching service providers for a project.
        
        Args:
            project: The project/tender instance to match providers for
            limit: Maximum number of providers to return
            use_cache: Whether to use cached results (default: True)
            
        Returns:
            List of dictionaries containing provider info and match scores, ranked by score
            
        Example return:
        [
            {
                'provider_id': 123,
                'provider_name': 'John Doe',
                'match_score': 95,
                'matching_skills': ['Python', 'Django'],
                'recommendation': 'Strong Match',
                'reasoning': 'Excellent skill match...',
                'cached': False
            },
            ...
        ]
        """
        try:
            language_code = get_language() or 'en'
            cache_enabled = use_cache and language_code.startswith('en')
            # Check cache first
            if cache_enabled:
                cached_results = MatchingCache.get_project_matches(project.id)
                if cached_results:
                    self.logger.info(f"Using cached matches for project {project.id}")
                    # Mark results as cached and return
                    for result in cached_results[:limit]:
                        result['cached'] = True
                    return cached_results[:limit]
            
            # Get project data
            project_data = self._extract_project_data(project)
            
            # Find potential service providers
            # For now, get all users who could be providers
            # TODO: Filter by user_type='provider' once user profiles are implemented
            # Get potential providers
            if provider_ids:
                potential_providers = User.objects.filter(id__in=provider_ids)[:50]
            else:
                potential_providers = User.objects.all()[:50]
            
            results = []
            
            # Calculate match score for each provider
            for provider in potential_providers:
                try:
                    # Check individual provider cache
                    if cache_enabled:
                        cached_match = MatchingCache.get_match_score(project.id, provider.id)
                        if cached_match:
                            cached_match['provider_id'] = provider.id
                            cached_match['provider_name'] = provider.full_name or provider.email
                            cached_match['provider_email'] = provider.email
                            cached_match['cached'] = True
                            results.append(cached_match)
                            continue
                    
                    provider_data = self._extract_provider_data(provider)
                    match_result = self.calculate_compatibility_score(
                        project_data,
                        provider_data,
                        language=language_code
                    )
                    
                    # Check if we got fallback response indicating AI is unavailable
                    if match_result and match_result.get('reasoning') == 'Basic rule-based scoring used (AI unavailable)':
                        # AI is unavailable, don't return random matches
                        self.logger.warning("AI matching service unavailable")
                        return []
                    elif match_result:
                        match_result['cached'] = False
                        result = {
                            'provider_id': provider.id,
                            'provider_name': provider.full_name or provider.email,
                            'provider_email': provider.email,
                            **match_result
                        }
                        results.append(result)
                        
                        # Cache individual match
                        if cache_enabled:
                            MatchingCache.set_match_score(project.id, provider.id, match_result)
                        
                except Exception as e:
                    self.logger.error(f"Error matching provider {provider.id}: {str(e)}")
                    continue
            
            # Sort by match score (descending)
            results.sort(key=lambda x: x.get('match_score', 0), reverse=True)
            
            # Cache the full ranking
            if cache_enabled and results:
                MatchingCache.set_project_matches(project.id, results)
            
            return results[:limit]
            
        except Exception as e:
            self.logger.error(f"Error in match_providers_to_project: {str(e)}")
            return []
    
    def calculate_compatibility_score(
        self,
        project_data: Dict,
        provider_data: Dict,
        language: str = 'en'
    ) -> Optional[Dict]:
        """
        Calculate a detailed compatibility score between a project and provider.
        
        Args:
            project_data: Dictionary containing project information
            provider_data: Dictionary containing provider profile information
            
        Returns:
            Dictionary containing match score and detailed analysis, or None if error
            
        Example return:
        {
            'match_score': 85,
            'matching_skills': ['Python', 'Django', 'React'],
            'skill_gaps': ['Docker'],
            'budget_compatible': True,
            'budget_assessment': 'Provider rate fits well within budget',
            'experience_assessment': 'Strong experience level',
            'potential_concerns': [],
            'recommendation': 'Strong Match',
            'reasoning': 'Excellent technical skills match...'
        }
        """
        try:
            # Normalize language to descriptive name for the prompt
            lang = language or 'en'
            lang_name = 'Arabic' if lang.lower().startswith('ar') else 'English'

            # Generate the prompt
            prompt = get_match_score_prompt(project_data, provider_data, language=lang_name)
            
            # Call AI provider
            response = self.ai_provider.generate(
                prompt=prompt,
                temperature=0.3,  # Lower temperature for more consistent scoring
                max_tokens=1000
            )
            
            # Parse JSON response
            result = self._parse_json_response(response)
            
            if result:
                # Validate the response has required fields
                required_fields = ['match_score', 'recommendation', 'reasoning']
                if all(field in result for field in required_fields):
                    return result
                else:
                    self.logger.warning("AI response missing required fields")
                    return self._fallback_scoring(project_data, provider_data)
            
            return self._fallback_scoring(project_data, provider_data, language=lang)
            
        except Exception as e:
            self.logger.error(f"Error calculating compatibility score: {str(e)}")
            return self._fallback_scoring(project_data, provider_data, language=lang)
    
    def generate_cover_letter(
        self,
        project_data: Dict,
        provider_data: Dict
    ) -> Optional[str]:
        """
        Generate an AI-powered cover letter for a bid.
        
        Args:
            project_data: Dictionary containing project information
            provider_data: Dictionary containing provider profile information
            
        Returns:
            Generated cover letter text, or None if error
        """
        try:
            prompt = get_cover_letter_prompt(project_data, provider_data)
            
            response = self.ai_provider.generate(
                prompt=prompt,
                temperature=0.7,  # Higher temperature for more creative writing
                max_tokens=800
            )
            
            return response.strip()
            
        except Exception as e:
            self.logger.error(f"Error generating cover letter: {str(e)}")
            return None
    
    def suggest_pricing(
        self,
        project_data: Dict,
        provider_data: Dict,
        market_data: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Suggest competitive pricing for a bid.
        
        Args:
            project_data: Dictionary containing project information
            provider_data: Dictionary containing provider profile information
            market_data: Optional dictionary containing market pricing data
            
        Returns:
            Dictionary containing pricing suggestions and analysis
            
        Example return:
        {
            'suggested_amount': 5000,
            'pricing_strategy': 'Competitive positioning...',
            'min_acceptable': 4000,
            'max_justifiable': 6000,
            'win_probability': 'High',
            'justification': 'This price is competitive...',
            'alternative_approaches': [...]
        }
        """
        try:
            # Use default market data if not provided
            if market_data is None:
                market_data = self._get_default_market_data(project_data)
            
            prompt = get_pricing_suggestion_prompt(
                project_data,
                provider_data,
                market_data
            )
            
            response = self.ai_provider.generate(
                prompt=prompt,
                temperature=0.3,
                max_tokens=800
            )
            
            result = self._parse_json_response(response)
            
            if result and 'suggested_amount' in result:
                return result
            
            # Fallback: simple calculation
            return self._fallback_pricing(project_data, provider_data, language=lang)
            
        except Exception as e:
            self.logger.error(f"Error suggesting pricing: {str(e)}")
            return self._fallback_pricing(project_data, provider_data, language=lang)
    
    # Helper methods
    
    def _extract_project_data(self, project) -> Dict:
        """
        Extract relevant data from a project/tender object.
        
        Args:
            project: Project/Tender model instance
            
        Returns:
            Dictionary of project data for AI processing
        """
        return {
            'title': project.title,
            'description': getattr(project, 'description', ''),
            'required_skills': [],  # TODO: Extract from project when skills implemented
            'budget_min': getattr(project, 'budget_min', 0),
            'budget_max': getattr(project, 'budget_max', 0),
            'deadline': str(project.deadline) if hasattr(project, 'deadline') else 'Not specified',
            'category': getattr(project, 'category', 'General'),
        }
    
    def _extract_provider_data(self, provider) -> Dict:
        """
        Extract relevant data from a provider/user object.
        
        Args:
            provider: User model instance
            
        Returns:
            Dictionary of provider data for AI processing
        """
        # TODO: Extract from UserProfile once implemented
        return {
            'name': provider.full_name or provider.email,
            'bio': '',  # TODO: Get from profile
            'skills': [],  # TODO: Get from profile
            'hourly_rate': 0,  # TODO: Get from profile
            'experience_level': 'Intermediate',
            'completed_projects': 0,  # TODO: Calculate from bids
            'average_rating': 0,  # TODO: Calculate from reviews
            'languages': ['English'],
            'location': 'Not specified',
            'portfolio_summary': 'No portfolio available'
        }
    
    def _parse_json_response(self, response: str) -> Optional[Dict]:
        """
        Parse JSON from AI response, handling various formats.
        
        Args:
            response: Raw response text from AI
            
        Returns:
            Parsed dictionary or None if parsing fails
        """
        try:
            # Try direct JSON parse
            return json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            if '```json' in response:
                json_start = response.find('```json') + 7
                json_end = response.find('```', json_start)
                if json_end != -1:
                    try:
                        return json.loads(response[json_start:json_end].strip())
                    except json.JSONDecodeError:
                        pass
            
            # Try to extract JSON from any code block
            if '```' in response:
                json_start = response.find('```') + 3
                json_end = response.find('```', json_start)
                if json_end != -1:
                    try:
                        return json.loads(response[json_start:json_end].strip())
                    except json.JSONDecodeError:
                        pass
            
            self.logger.warning("Could not parse JSON from AI response")
            return None
    
    def _fallback_scoring(
        self,
        project_data: Dict,
        provider_data: Dict,
        language: str = 'en'
    ) -> Dict:
        """
        Provide a basic fallback scoring when AI is unavailable.
        
        Args:
            project_data: Project information
            provider_data: Provider information
            
        Returns:
            Basic match score dictionary
        """
        # Simple rule-based scoring
        score = 50  # Base score
        
        # Adjust based on available data
        if provider_data.get('skills'):
            # Check skill overlap (would be implemented when skills are available)
            score += 20
        
        if provider_data.get('completed_projects', 0) > 5:
            score += 15
        
        if provider_data.get('average_rating', 0) >= 4.0:
            score += 15
        
        with override(language or 'en'):
            return {
                'match_score': min(score, 100),
                'matching_skills': [],
                'skill_gaps': [],
                'budget_compatible': True,
                'budget_assessment': _('Unable to assess without AI'),
                'experience_assessment': _('Unable to assess without AI'),
                'potential_concerns': [_('AI matching unavailable')],
                'recommendation': _('Fair Match'),
                'reasoning': _('Basic rule-based scoring used (AI unavailable)')
            }
    
    def _fallback_pricing(
        self,
        project_data: Dict,
        provider_data: Dict,
        language: str = 'en'
    ) -> Dict:
        """
        Provide basic fallback pricing when AI is unavailable.
        
        Args:
            project_data: Project information
            provider_data: Provider information
            
        Returns:
            Basic pricing suggestion dictionary
        """
        budget_mid = (
            project_data.get('budget_min', 0) + 
            project_data.get('budget_max', 0)
        ) / 2
        
        suggested = budget_mid * 0.9  # Suggest 90% of midpoint
        
        with override(language or 'en'):
            return {
                'suggested_amount': suggested,
                'pricing_strategy': _('Budget-based estimate (AI unavailable)'),
                'min_acceptable': budget_mid * 0.7,
                'max_justifiable': budget_mid * 1.1,
                'win_probability': _('Medium'),
                'justification': _('Basic calculation based on project budget'),
                'alternative_approaches': []
            }
    
    def _get_default_market_data(self, project_data: Dict) -> Dict:
        """
        Generate default market data for pricing calculations.
        
        Args:
            project_data: Project information
            
        Returns:
            Dictionary of market data
        """
        budget_avg = (
            project_data.get('budget_min', 0) + 
            project_data.get('budget_max', 0)
        ) / 2
        
        return {
            'average': budget_avg,
            'min': budget_avg * 0.7,
            'max': budget_avg * 1.3,
            'competitor_count': 5
        }


class AIBidAssistant:
    """
    Helper service for assisting service providers with bid creation.
    Wraps AIMatchingService for bid-specific operations.
    """
    
    def __init__(self):
        self.matching_service = AIMatchingService()
    
    def generate_cover_letter(self, project, provider) -> Optional[str]:
        """
        Generate a cover letter for a provider bidding on a project.
        
        Args:
            project: Project/Tender instance
            provider: User instance (service provider)
            
        Returns:
            Generated cover letter text
        """
        project_data = self.matching_service._extract_project_data(project)
        provider_data = self.matching_service._extract_provider_data(provider)
        
        return self.matching_service.generate_cover_letter(
            project_data,
            provider_data
        )
    
    def suggest_pricing(self, project, provider) -> Optional[Dict]:
        """
        Suggest competitive pricing for a bid.
        
        Args:
            project: Project/Tender instance
            provider: User instance (service provider)
            
        Returns:
            Pricing suggestion dictionary
        """
        project_data = self.matching_service._extract_project_data(project)
        provider_data = self.matching_service._extract_provider_data(provider)
        
        return self.matching_service.suggest_pricing(
            project_data,
            provider_data
        )
    
    def improve_bid(self, bid) -> Dict:
        """
        Analyze a bid and suggest improvements.
        
        Args:
            bid: Bid instance to analyze
            
        Returns:
            Dictionary of improvement suggestions
        """
        # TODO: Implement bid improvement analysis
        return {
            'overall_score': 75,
            'cover_letter_improvements': [],
            'pricing_feedback': 'Competitive pricing',
            'timeline_feedback': 'Timeline seems reasonable',
            'milestone_suggestions': [],
            'strengths': ['Clear cover letter'],
            'weaknesses': [],
            'priority_changes': []
        }
