"""
AI Matching Cache Service

Provides caching functionality for AI matching results to:
- Reduce API calls to AI providers (save money)
- Improve response times
- Store match history for analytics

Cache Strategy:
- Match scores are cached for 1 hour
- Provider data is cached for 30 minutes
- Project data is cached for 15 minutes
"""

from django.core.cache import cache
from django.conf import settings
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class MatchingCache:
    """
    Handles caching of AI matching results.
    
    Cache keys are generated based on project and provider IDs,
    ensuring consistent cache hits while preventing collisions.
    """
    
    # Cache timeout values (in seconds)
    MATCH_SCORE_TTL = 3600  # 1 hour
    PROVIDER_DATA_TTL = 1800  # 30 minutes
    PROJECT_DATA_TTL = 900  # 15 minutes
    RANKING_TTL = 1800  # 30 minutes
    
    @staticmethod
    def _generate_cache_key(prefix: str, *args) -> str:
        """
        Generate a unique cache key based on prefix and arguments.
        
        Args:
            prefix: Cache key prefix (e.g., 'match_score', 'provider_data')
            *args: Variable arguments to include in the key
            
        Returns:
            Unique cache key string
            
        Example:
            _generate_cache_key('match', 'project_123', 'provider_456')
            -> 'ai_match:project_123:provider_456:abc123def'
        """
        # Combine all arguments into a string
        key_parts = [str(arg) for arg in args]
        combined = ':'.join(key_parts)
        
        # Create a hash for shorter, consistent keys
        hash_suffix = hashlib.md5(combined.encode()).hexdigest()[:8]
        
        # Build the final cache key
        cache_key = f"ai_{prefix}:{':'.join(key_parts)}:{hash_suffix}"
        return cache_key
    
    @classmethod
    def get_match_score(cls, project_id: int, provider_id: int):
        """
        Get cached match score between project and provider.
        
        Args:
            project_id: ID of the project
            provider_id: ID of the service provider
            
        Returns:
            Cached match result dict or None if not found
        """
        cache_key = cls._generate_cache_key('match_score', project_id, provider_id)
        result = cache.get(cache_key)
        
        if result:
            logger.debug(f"Cache HIT for match score: {cache_key}")
        else:
            logger.debug(f"Cache MISS for match score: {cache_key}")
        
        return result
    
    @classmethod
    def set_match_score(cls, project_id: int, provider_id: int, match_data: dict):
        """
        Cache match score result.
        
        Args:
            project_id: ID of the project
            provider_id: ID of the service provider
            match_data: Match result dictionary to cache
        """
        cache_key = cls._generate_cache_key('match_score', project_id, provider_id)
        cache.set(cache_key, match_data, cls.MATCH_SCORE_TTL)
        logger.debug(f"Cached match score: {cache_key} (TTL: {cls.MATCH_SCORE_TTL}s)")
    
    @classmethod
    def get_project_matches(cls, project_id: int):
        """
        Get cached ranking of all providers for a project.
        
        Args:
            project_id: ID of the project
            
        Returns:
            Cached list of ranked providers or None
        """
        cache_key = cls._generate_cache_key('project_ranking', project_id)
        return cache.get(cache_key)
    
    @classmethod
    def set_project_matches(cls, project_id: int, rankings: list):
        """
        Cache provider rankings for a project.
        
        Args:
            project_id: ID of the project
            rankings: List of provider rankings
        """
        cache_key = cls._generate_cache_key('project_ranking', project_id)
        cache.set(cache_key, rankings, cls.RANKING_TTL)
        logger.debug(f"Cached project rankings: {cache_key}")
    
    @classmethod
    def invalidate_project_matches(cls, project_id: int):
        """
        Invalidate cached matches for a project.
        Call this when project details are updated.
        
        Args:
            project_id: ID of the project
        """
        cache_key = cls._generate_cache_key('project_ranking', project_id)
        cache.delete(cache_key)
        logger.info(f"Invalidated cache for project {project_id}")
    
    @classmethod
    def get_provider_data(cls, provider_id: int):
        """
        Get cached provider data.
        
        Args:
            provider_id: ID of the provider
            
        Returns:
            Cached provider data dict or None
        """
        cache_key = cls._generate_cache_key('provider_data', provider_id)
        return cache.get(cache_key)
    
    @classmethod
    def set_provider_data(cls, provider_id: int, provider_data: dict):
        """
        Cache provider data.
        
        Args:
            provider_id: ID of the provider
            provider_data: Provider information dictionary
        """
        cache_key = cls._generate_cache_key('provider_data', provider_id)
        cache.set(cache_key, provider_data, cls.PROVIDER_DATA_TTL)
        logger.debug(f"Cached provider data: {cache_key}")
    
    @classmethod
    def invalidate_provider_data(cls, provider_id: int):
        """
        Invalidate cached provider data.
        Call this when provider profile is updated.
        
        Args:
            provider_id: ID of the provider
        """
        cache_key = cls._generate_cache_key('provider_data', provider_id)
        cache.delete(cache_key)
        logger.info(f"Invalidated cache for provider {provider_id}")
    
    @classmethod
    def get_cache_stats(cls):
        """
        Get statistics about cache usage.
        Useful for monitoring and optimization.
        
        Returns:
            Dictionary with cache statistics
        """
        # Note: This is a simplified version
        # In production, you'd track hits/misses more comprehensively
        return {
            'match_score_ttl': cls.MATCH_SCORE_TTL,
            'provider_data_ttl': cls.PROVIDER_DATA_TTL,
            'project_data_ttl': cls.PROJECT_DATA_TTL,
            'cache_backend': settings.CACHES.get('default', {}).get('BACKEND', 'unknown')
        }
