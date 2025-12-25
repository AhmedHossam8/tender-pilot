"""
Prompt Registry

Central registry for all prompt templates. Provides a single point
of access for retrieving prompts by name and version.
"""

from typing import Dict, Optional, List
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


class PromptRegistry:
    """
    Central registry for managing prompt templates.
    
    Features:
    - Retrieve prompts by name
    - Version management
    - List available prompts
    - Dynamic prompt registration
    
    Usage:
        prompt = PromptRegistry.get("tender_analysis")
        rendered = prompt.render(tender_title="...", ...)
    """
    
    # Internal storage: {name: {version: PromptTemplate}}
    _prompts: Dict[str, Dict[str, PromptTemplate]] = {}
    
    # Track active versions
    _active_versions: Dict[str, str] = {}
    
    @classmethod
    def register(cls, prompt: PromptTemplate, set_active: bool = True) -> None:
        """
        Register a prompt template.
        
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
        
        Args:
            name: The prompt name
            version: Specific version (uses active version if not specified)
            
        Returns:
            The PromptTemplate
            
        Raises:
            KeyError: If prompt not found
        """
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
        """List all registered prompts with their versions."""
        result = []
        for name, versions in cls._prompts.items():
            active_version = cls._active_versions.get(name)
            result.append({
                "name": name,
                "versions": list(versions.keys()),
                "active_version": active_version,
                "description": versions[active_version].description if active_version else "",
            })
        return result
    
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
