import json
import logging
from copy import deepcopy
from django.utils import timezone
from apps.documents.models import TenderDocument
from apps.ai_engine.services.openai_provider import OpenAIProvider
from apps.ai_engine.prompts.registry import PromptRegistry
from apps.ai_engine.services.base import AIGenerationConfig
from apps.ai_engine.prompts.tender_analysis import (
    TENDER_ANALYSIS_PROMPT,
    REQUIREMENT_EXTRACTION_PROMPT,
    QUICK_SUMMARY_PROMPT
)
from apps.ai_engine.services.fallback import AIFallbackHandler, RetryConfig, GracefulDegradation
from apps.ai_engine.services.provider import get_ai_provider

logger = logging.getLogger(__name__)

class AIRequestHandler:
    SUPPORTED_TASKS = {
        "text-generation": "handle_text_generation",
        "summarization": "handle_summarization",
        "tender-preprocessing": "handle_tender_preprocessing",
        "proposal-section-generation": "handle_proposal_section_generation",
        "proposal-review": "handle_proposal_review",
        "proposal-checklist": "handle_proposal_checklist",
    }

    def __init__(self):
        self.provider = get_ai_provider()

    def execute(self, data):
        task = data.get("task")
        if task not in self.SUPPORTED_TASKS:
            raise ValueError(f"Unsupported task: {task}")
        handler_method = getattr(self, self.SUPPORTED_TASKS[task])
        return handler_method(data)

    def handle_proposal_rag(self, data):
        """
        Retrieve relevant past proposals for RAG.
        """
        key_requirements = data.get("key_requirements", [])
        if not key_requirements:
            raise ValueError("key_requirements required for RAG retrieval")

        from .rag import load_past_proposals, match_requirements

        # Load past proposals from DB
        proposals = load_past_proposals()
        # Find relevant sections based on key_requirements
        relevant_proposals = match_requirements(key_requirements, proposals)

        result = {}
        for p in relevant_proposals:
            for section, content in p.get("sections", {}).items():
                result.setdefault(section, []).append(content)

        return {
            "status": "success",
            "retrieved_sections": result,
            "count": len(relevant_proposals)
        }

    def handle_proposal_section_generation(self, data):
        context = data.get("context")
        if not context:
            raise ValueError("context is required for section generation")

        # Optionally integrate RAG results into the context
        rag_results = data.get("rag_results", {})
        if rag_results:
            context["past_sections"] = rag_results

        # Call your existing writer function
        from .writer import generate_proposal_sections
        sections = generate_proposal_sections(context)
        return sections

    def handle_proposal_review(self, data):
        context = data.get("context")
        sections = data.get("sections")
        if not context or not sections:
            raise ValueError("context and sections are required for proposal review")
        from .writer import generate_proposal_review
        return generate_proposal_review(context, sections)

    def handle_proposal_checklist(self, data):
        context = data.get("context")
        sections = data.get("sections")
        if not context or not sections:
            raise ValueError("context and sections are required for checklist")
        from .writer import generate_proposal_checklist
        return generate_proposal_checklist(context, sections)

