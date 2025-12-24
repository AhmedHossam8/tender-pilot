"""
AI Engine Prompts Package

Provides prompt templates for all AI interactions.
"""

from .base import PromptTemplate, PromptBuilder, PromptChain
from .registry import PromptRegistry, get_prompt, list_available_prompts

# Import specific prompts for direct access
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
)

__all__ = [
    # Base classes
    "PromptTemplate",
    "PromptBuilder",
    "PromptChain",
    # Registry
    "PromptRegistry",
    "get_prompt",
    "list_available_prompts",
    # Tender Analysis
    "TENDER_ANALYSIS_PROMPT",
    "QUICK_SUMMARY_PROMPT",
    "REQUIREMENT_EXTRACTION_PROMPT",
    # Compliance Check
    "COMPLIANCE_CHECK_PROMPT",
    "QUICK_COMPLIANCE_PROMPT",
    "REQUIREMENT_MATCHING_PROMPT",
    # Proposal Generation
    "PROPOSAL_OUTLINE_PROMPT",
    "SECTION_CONTENT_PROMPT",
    "EXECUTIVE_SUMMARY_PROMPT",
    "PROPOSAL_SECTION_GENERATION_PROMPT",
]
