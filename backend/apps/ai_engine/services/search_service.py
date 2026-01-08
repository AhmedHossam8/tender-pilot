"""
AI Search Service
Provides semantic search, unified search, and auto-categorization
"""
from typing import List, Dict, Any, Optional
from django.db.models import Q, QuerySet
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from .ai_base import AIService
import logging

logger = logging.getLogger(__name__)


class AISearchService(AIService):
    """
    AI-powered search service for projects, services, and providers
    """
    
    def __init__(self, provider_type: str = "gemini"):
        super().__init__(provider_type)
        self.max_results = 50
    
    def semantic_search(
        self, 
        query: str, 
        search_types: List[str] = None,
        filters: Dict[str, Any] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Perform semantic search across multiple content types
        
        Args:
            query: Search query string
            search_types: List of types to search ['projects', 'services', 'providers']
            filters: Additional filters (category, budget, skills, etc.)
            limit: Maximum results per type
            
        Returns:
            Dictionary with results per type and metadata
        """
        if not search_types:
            search_types = ['projects', 'services', 'providers']
        
        filters = filters or {}
        results = {}
        
        try:
            # Enhance query with AI understanding
            enhanced_query = self._enhance_search_query(query)
            
            # Search each content type
            if 'projects' in search_types:
                results['projects'] = self._search_projects(
                    enhanced_query, filters, limit
                )
            
            if 'services' in search_types:
                results['services'] = self._search_services(
                    enhanced_query, filters, limit
                )
            
            if 'providers' in search_types:
                results['providers'] = self._search_providers(
                    enhanced_query, filters, limit
                )
            
            # Add search metadata
            results['metadata'] = {
                'query': query,
                'enhanced_query': enhanced_query,
                'search_types': search_types,
                'total_results': sum(
                    len(results.get(t, [])) for t in search_types
                )
            }
            
            return results
            
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return {
                'projects': [],
                'services': [],
                'providers': [],
                'metadata': {
                    'query': query,
                    'error': str(e)
                }
            }
    
    def _enhance_search_query(self, query: str) -> str:
        """
        Use AI to enhance search query with synonyms and related terms
        """
        try:
            prompt = f"""Enhance this search query for better semantic matching.
            Add relevant synonyms and related terms.
            
            Original query: "{query}"
            
            Return ONLY the enhanced query terms, separated by spaces.
            Keep it concise (max 10 words).
            """
            
            response = self.provider.generate(prompt, max_tokens=50)
            enhanced = response.strip()
            
            # Fallback to original if AI returns nonsense
            if not enhanced or len(enhanced.split()) > 15:
                return query
                
            return enhanced
            
        except Exception as e:
            logger.warning(f"Query enhancement failed: {e}")
            return query
    
    def _search_projects(
        self, 
        query: str, 
        filters: Dict[str, Any], 
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search projects with filters"""
        from apps.projects.models import Project
        
        # Base queryset
        qs = Project.objects.filter(
            status__in=['open', 'in_progress']
        ).select_related('client')
        
        # Apply text search
        if query:
            search_vector = SearchVector('title', weight='A') + \
                          SearchVector('description', weight='B')
            search_query = SearchQuery(query)
            
            qs = qs.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(search=search_query).order_by('-rank')
        
        # Apply filters
        if filters.get('category'):
            qs = qs.filter(category=filters['category'])
        
        if filters.get('budget_min'):
            qs = qs.filter(budget_max__gte=filters['budget_min'])
        
        if filters.get('budget_max'):
            qs = qs.filter(budget_min__lte=filters['budget_max'])
        
        if filters.get('skills'):
            qs = qs.filter(skills_required__name__in=filters['skills'])
        
        # Limit results
        qs = qs[:limit]
        
        # Serialize results
        return [
            {
                'id': p.id,
                'type': 'project',
                'title': p.title,
                'description': p.description[:200] if p.description else '',
                'client': p.client.get_full_name() if p.client else None,
                'budget_range': f"${p.budget_min}-${p.budget_max}" if p.budget_min and p.budget_max else None,
                'deadline': p.deadline.isoformat() if p.deadline else None,
                'status': p.status,
                'created_at': p.created_at.isoformat(),
            }
            for p in qs
        ]
    
    def _search_services(
        self, 
        query: str, 
        filters: Dict[str, Any], 
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search services with filters"""
        from apps.services.models import Service
        
        # Base queryset
        qs = Service.objects.filter(
            is_active=True
        ).select_related('provider')
        
        # Apply text search
        if query:
            search_vector = SearchVector('title', weight='A') + \
                          SearchVector('description', weight='B')
            search_query = SearchQuery(query)
            
            qs = qs.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(search=search_query).order_by('-rank')
        
        # Apply filters
        if filters.get('category'):
            qs = qs.filter(category=filters['category'])
        
        if filters.get('price_min'):
            qs = qs.filter(base_price__gte=filters['price_min'])
        
        if filters.get('price_max'):
            qs = qs.filter(base_price__lte=filters['price_max'])
        
        if filters.get('skills'):
            qs = qs.filter(skills__name__in=filters['skills'])
        
        # Limit results
        qs = qs[:limit]
        
        # Serialize results
        return [
            {
                'id': s.id,
                'type': 'service',
                'title': s.title,
                'description': s.description[:200] if s.description else '',
                'provider': s.provider.get_full_name() if s.provider else None,
                'provider_id': s.provider.id if s.provider else None,
                'base_price': float(s.base_price) if s.base_price else None,
                'delivery_time': s.delivery_time_days if hasattr(s, 'delivery_time_days') else None,
                'rating': float(s.rating) if hasattr(s, 'rating') and s.rating else None,
                'created_at': s.created_at.isoformat(),
            }
            for s in qs
        ]
    
    def _search_providers(
        self, 
        query: str, 
        filters: Dict[str, Any], 
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search service providers with filters"""
        from apps.users.models import UserProfile
        
        # Base queryset - only providers
        qs = UserProfile.objects.filter(
            user__user_type__in=['provider', 'both']
        ).select_related('user')
        
        # Apply text search
        if query:
            search_vector = SearchVector('bio', weight='A') + \
                          SearchVector('title', weight='B')
            search_query = SearchQuery(query)
            
            qs = qs.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(
                Q(search=search_query) | 
                Q(user__first_name__icontains=query) |
                Q(user__last_name__icontains=query)
            )
            
            # Order by rank if text search is used
            if qs.filter(search=search_query).exists():
                qs = qs.order_by('-rank', '-profile_completeness')
            else:
                qs = qs.order_by('-profile_completeness')
        else:
            qs = qs.order_by('-profile_completeness')
        
        # Apply filters
        if filters.get('skills'):
            qs = qs.filter(skills__name__in=filters['skills'])
        
        if filters.get('hourly_rate_min'):
            qs = qs.filter(hourly_rate__gte=filters['hourly_rate_min'])
        
        if filters.get('hourly_rate_max'):
            qs = qs.filter(hourly_rate__lte=filters['hourly_rate_max'])
        
        # Limit results
        qs = qs[:limit]
        
        # Serialize results
        return [
            {
                'id': p.user.id,
                'type': 'provider',
                'name': p.user.get_full_name(),
                'title': p.title,
                'bio': p.bio[:200] if p.bio else '',
                'hourly_rate': float(p.hourly_rate) if p.hourly_rate else None,
                'profile_completeness': p.profile_completeness,
                'skills': [skill.name for skill in p.skills.all()[:5]],
                'location': p.location,
                'avatar': p.avatar.url if p.avatar else None,
            }
            for p in qs
        ]
    
    def suggest_similar(
        self, 
        item_type: str, 
        item_id: int, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find similar items based on an existing item
        
        Args:
            item_type: 'project', 'service', or 'provider'
            item_id: ID of the item to find similar matches for
            limit: Number of similar items to return
            
        Returns:
            List of similar items with similarity scores
        """
        try:
            # Get the source item
            if item_type == 'project':
                from apps.projects.models import Project
                item = Project.objects.get(id=item_id)
                query_text = f"{item.title} {item.description}"
                search_type = 'projects'
                
            elif item_type == 'service':
                from apps.services.models import Service
                item = Service.objects.get(id=item_id)
                query_text = f"{item.title} {item.description}"
                search_type = 'services'
                
            elif item_type == 'provider':
                from apps.users.models import UserProfile
                profile = UserProfile.objects.get(user_id=item_id)
                query_text = f"{profile.title} {profile.bio}"
                search_type = 'providers'
            else:
                return []
            
            # Perform search excluding the source item
            results = self.semantic_search(
                query=query_text[:500],  # Limit query length
                search_types=[search_type],
                limit=limit + 1  # Get extra to exclude source
            )
            
            # Filter out the source item
            similar_items = [
                r for r in results.get(search_type, [])
                if r['id'] != item_id
            ][:limit]
            
            return similar_items
            
        except Exception as e:
            logger.error(f"Similar items search error: {e}")
            return []
    
    def auto_categorize(self, text: str, content_type: str) -> Optional[str]:
        """
        Automatically categorize content based on text analysis
        
        Args:
            text: Content to categorize
            content_type: 'project' or 'service'
            
        Returns:
            Suggested category name or None
        """
        try:
            # Define categories based on content type
            if content_type == 'project':
                categories = [
                    'Web Development', 'Mobile Development', 'Design',
                    'Writing & Translation', 'Marketing', 'Business',
                    'Data & Analytics', 'Engineering', 'Legal',
                    'Admin Support', 'Other'
                ]
            else:  # service
                categories = [
                    'Programming & Tech', 'Graphics & Design',
                    'Digital Marketing', 'Writing & Translation',
                    'Video & Animation', 'Music & Audio',
                    'Business Consulting', 'Lifestyle', 'Other'
                ]
            
            prompt = f"""Categorize the following {content_type} into ONE of these categories:
            {', '.join(categories)}
            
            Content: {text[:500]}
            
            Return ONLY the category name, nothing else.
            """
            
            response = self.provider.generate(prompt, max_tokens=20)
            category = response.strip()
            
            # Validate category is in our list
            if category in categories:
                return category
            
            # Try fuzzy matching
            category_lower = category.lower()
            for cat in categories:
                if cat.lower() in category_lower or category_lower in cat.lower():
                    return cat
            
            return 'Other'
            
        except Exception as e:
            logger.error(f"Auto-categorization error: {e}")
            return None
    
    def extract_skills(self, text: str, max_skills: int = 10) -> List[str]:
        """
        Extract relevant skills/keywords from text
        
        Args:
            text: Content to analyze
            max_skills: Maximum number of skills to extract
            
        Returns:
            List of skill names
        """
        try:
            prompt = f"""Extract {max_skills} key skills or technologies mentioned in this text.
            Focus on specific technical skills, tools, or expertise areas.
            
            Text: {text[:1000]}
            
            Return ONLY a comma-separated list of skills, nothing else.
            Example: Python, Django, React, PostgreSQL, Docker
            """
            
            response = self.provider.generate(prompt, max_tokens=100)
            
            # Parse skills
            skills = [
                s.strip() 
                for s in response.split(',')
                if s.strip()
            ][:max_skills]
            
            return skills
            
        except Exception as e:
            logger.error(f"Skill extraction error: {e}")
            return []
