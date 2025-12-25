"""
Prompt Registry

Central registry for all prompt templates. Provides a single point
of access for retrieving prompts by name and version.

Features:
- Load prompts from database (PromptVersion model)
- Fallback to hardcoded prompts
- Version management
- A/B testing support
- Dynamic prompt updates without code deploy
"""

import logging
from typing import Dict, Optional, List
from django.core.cache import cache
from .base import PromptTemplate

# Import all prompts
from .tender_analysis import (
    TENDER_ANALYSIS_PROMPT,
    QUICK_SUMMARY_PROMPT,
    REQUIREMENT_EXTRACTION_PROMPT,
)
from .compliance_check import (
    COMPLIANCE_CHECK_PROMPT,
    QUICK_COMPLIANCE_PROMPT,
    REQUIREMENT_MATCHING_PROMPT,
)
from .proposal_generation import (
    PROPOSAL_OUTLINE_PROMPT,
    SECTION_CONTENT_PROMPT,
    EXECUTIVE_SUMMARY_PROMPT,
    PROPOSAL_SECTION_GENERATION_PROMPT,
    PROPOSAL_REVIEW_PROMPT,
)
from .text_generation import TEXT_GENERATION_PROMPT
from .summarization import SUMMARIZATION_PROMPT

logger = logging.getLogger(__name__)


class PromptRegistry:
    """
    Central registry for managing prompt templates.
    
    Features:
    - Retrieve prompts by name from database or hardcoded fallbacks
    - Version management
    - List available prompts
    - Dynamic prompt registration
    - Cache for performance
    
    Architecture:
    1. First checks database (PromptVersion model) for active prompts
    2. Falls back to hardcoded prompts if not in DB
    3. Caches DB prompts for 5 minutes to reduce queries
    
    Usage:
        prompt = PromptRegistry.get("tender_analysis")
        rendered = prompt.render(tender_title="...", ...)
    """
    
    # Internal storage: {name: {version: PromptTemplate}}
    _prompts: Dict[str, Dict[str, PromptTemplate]] = {}
    
    # Track active versions
    _active_versions: Dict[str, str] = {}
    
    # Cache TTL (5 minutes)
    CACHE_TTL = 300
    
    @classmethod
    def _get_from_database(cls, name: str, version: Optional[str] = None) -> Optional[PromptTemplate]:
        """
        Try to load prompt from database.
        
        Args:
            name: Prompt name
            version: Specific version (or None for active)
        
        Returns:
            PromptTemplate if found in DB, None otherwise
        """
        try:
            from ..models import PromptVersion
            
            # Build cache key
            cache_key = f"prompt:{name}:{version or 'active'}"
            
            # Check cache first
            cached = cache.get(cache_key)
            if cached:
                logger.debug(f"Prompt cache hit: {cache_key}")
                return cached
            
            # Query database
            query = PromptVersion.objects.filter(name=name)
            
            if version is not None:
                query = query.filter(version=version)
            else:
                # Get active version
                query = query.filter(is_active=True)
            
            prompt_version = query.first()
            
            if prompt_version:
                # Convert to PromptTemplate
                template = PromptTemplate(
                    name=prompt_version.name,
                    version=prompt_version.version,
                    system_template=prompt_version.system_template,
                    user_template=prompt_version.user_template,
                    description=prompt_version.description,
                )
                
                # Cache it
                cache.set(cache_key, template, cls.CACHE_TTL)
                logger.info(f"Loaded prompt from database: {name} v{prompt_version.version}")
                
                return template
            
            return None
            
        except Exception as e:
            logger.warning(f"Failed to load prompt from database: {e}")
            return None
    
    @classmethod
    def register(cls, prompt: PromptTemplate, set_active: bool = True) -> None:
        """
        Register a prompt template (in-memory fallback).
        
        Args:
            prompt: The PromptTemplate to register
            set_active: Whether to set this as the active version
        """
        if prompt.name not in cls._prompts:
            cls._prompts[prompt.name] = {}
        
        cls._prompts[prompt.name][prompt.version] = prompt
        
        if set_active:
            cls._active_versions[prompt.name] = prompt.version
    
    @classmethod
    def get(
        cls,
        name: str,
        version: Optional[str] = None
    ) -> PromptTemplate:
        """
        Get a prompt template by name and optional version.
        
        Priority:
        1. Database prompts (cached)
        2. Hardcoded prompts (fallback)
        
        Args:
            name: The prompt name
            version: Specific version (uses active version if not specified)
            
        Returns:
            The PromptTemplate
            
        Raises:
            KeyError: If prompt not found
        """
        # Try database first
        db_prompt = cls._get_from_database(name, version)
        if db_prompt:
            return db_prompt
        
        # Fallback to hardcoded prompts
        if name not in cls._prompts:
            raise KeyError(f"Prompt not found: {name}")
        
        if version is None:
            version = cls._active_versions.get(name)
            if version is None:
                # Get the latest version
                version = max(cls._prompts[name].keys())
        
        if version not in cls._prompts[name]:
            raise KeyError(f"Prompt version not found: {name} v{version}")
        
        return cls._prompts[name][version]
    
    @classmethod
    def set_active_version(cls, name: str, version: str) -> None:
        """Set the active version for a prompt."""
        if name not in cls._prompts:
            raise KeyError(f"Prompt not found: {name}")
        if version not in cls._prompts[name]:
            raise KeyError(f"Version not found: {version}")
        
        cls._active_versions[name] = version
    
    @classmethod
    def list_prompts(cls) -> List[Dict]:
        """
        List all registered prompts with their versions.
        
        Combines database and hardcoded prompts.
        """
        result = []
        seen_names = set()
        
        # First, add database prompts
        try:
            from ..models import PromptVersion
            
            db_prompts = PromptVersion.objects.values('name').distinct()
            for db_prompt in db_prompts:
                name = db_prompt['name']
                seen_names.add(name)
                
                versions = list(
                    PromptVersion.objects.filter(name=name)
                    .values_list('version', flat=True)
                )
                active_prompt = PromptVersion.objects.filter(
                    name=name,
                    is_active=True
                ).first()
                
                result.append({
                    "name": name,
                    "versions": versions,
                    "active_version": active_prompt.version if active_prompt else None,
                    "description": active_prompt.description if active_prompt else "",
                    "source": "database",
                })
        except Exception as e:
            logger.warning(f"Failed to list database prompts: {e}")
        
        # Then add hardcoded prompts (if not already in DB)
        for name, versions in cls._prompts.items():
            if name not in seen_names:
                active_version = cls._active_versions.get(name)
                result.append({
                    "name": name,
                    "versions": list(versions.keys()),
                    "active_version": active_version,
                    "description": versions[active_version].description if active_version else "",
                    "source": "hardcoded",
                })
        
        return result
    
    @classmethod
    def clear_cache(cls, name: Optional[str] = None) -> None:
        """
        Clear prompt cache.
        
        Args:
            name: Specific prompt name to clear (or None for all)
        """
        if name:
            # Clear all versions of this prompt
            cache.delete_pattern(f"prompt:{name}:*")
            logger.info(f"Cleared cache for prompt: {name}")
        else:
            # Clear all prompt caches
            cache.delete_pattern("prompt:*")
            logger.info("Cleared all prompt caches")
    
    @classmethod
    def get_all_versions(cls, name: str) -> List[str]:
        """Get all versions of a prompt."""
        if name not in cls._prompts:
            raise KeyError(f"Prompt not found: {name}")
        return list(cls._prompts[name].keys())
    
    @classmethod
    def exists(cls, name: str, version: Optional[str] = None) -> bool:
        """Check if a prompt exists."""
        if name not in cls._prompts:
            return False
        if version is not None:
            return version in cls._prompts[name]
        return True


# =============================================================================
# REGISTER ALL PROMPTS
# =============================================================================

def _register_all_prompts():
    """Register all built-in prompts."""
    
    # Tender Analysis Prompts
    PromptRegistry.register(TENDER_ANALYSIS_PROMPT)
    PromptRegistry.register(QUICK_SUMMARY_PROMPT)
    PromptRegistry.register(REQUIREMENT_EXTRACTION_PROMPT)
    
    # Compliance Check Prompts
    PromptRegistry.register(COMPLIANCE_CHECK_PROMPT)
    PromptRegistry.register(QUICK_COMPLIANCE_PROMPT)
    PromptRegistry.register(REQUIREMENT_MATCHING_PROMPT)
    
    # Proposal Generation Prompts
    PromptRegistry.register(PROPOSAL_OUTLINE_PROMPT)
    PromptRegistry.register(SECTION_CONTENT_PROMPT)
    PromptRegistry.register(EXECUTIVE_SUMMARY_PROMPT)
    PromptRegistry.register(PROPOSAL_SECTION_GENERATION_PROMPT)
    PromptRegistry.register(PROPOSAL_REVIEW_PROMPT)
    
    # Text Generation and Summarization Prompts
    PromptRegistry.register(TEXT_GENERATION_PROMPT)
    PromptRegistry.register(SUMMARIZATION_PROMPT)


# Auto-register on module import
_register_all_prompts()


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def get_prompt(name: str, version: Optional[str] = None) -> PromptTemplate:
    """Convenience function to get a prompt."""
    return PromptRegistry.get(name, version)


def list_available_prompts() -> List[Dict]:
    """Convenience function to list available prompts."""
    return PromptRegistry.list_prompts()
