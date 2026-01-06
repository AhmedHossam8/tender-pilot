import json
import logging
import re
from copy import deepcopy
from django.utils import timezone
from apps.documents.models import ProjectDocument
from .services import get_ai_provider
from .services.base import AIGenerationConfig
from .services.fallback import AIFallbackHandler, RetryConfig, GracefulDegradation
from .prompts.registry import PromptRegistry
from .prompts.tender_analysis import (
    TENDER_ANALYSIS_PROMPT,
    REQUIREMENT_EXTRACTION_PROMPT,
    QUICK_SUMMARY_PROMPT
)

logger = logging.getLogger(__name__)


class AIRequestHandler:
    SUPPORTED_TASKS = {
        "text-generation": "handle_text_generation",
        "summarization": "handle_summarization",
        "tender-preprocessing": "handle_tender_preprocessing",
        "proposal-section-generation": "handle_proposal_section_generation",
        "proposal-review": "handle_proposal_review",
        "proposal-checklist": "handle_proposal_checklist",
        "proposal-rag": "handle_proposal_rag",
    }

    def __init__(self):
        self.provider = get_ai_provider()

    def execute(self, data):
        task = data.get("task")
        if task not in self.SUPPORTED_TASKS:
            raise ValueError(f"Unsupported task: {task}")
        handler_method = getattr(self, self.SUPPORTED_TASKS[task])
        return handler_method(data)

    # -------------------- Helper Methods --------------------
    @staticmethod
    def _format_context_item(item):
        """Formats dicts/lists/strings for prompts consistently."""
        if isinstance(item, dict):
            if "summary" in item:
                return item.get("summary") or item.get("raw_text", "")
            elif "requirements" in item:
                reqs = item.get("requirements", [])
                if isinstance(reqs, list):
                    formatted = []
                    for req in reqs:
                        if isinstance(req, str):
                            formatted.append(f"- {req}")
                        elif isinstance(req, dict):
                            title = req.get("title") or req.get("requirement") or str(req)
                            desc = req.get("description") or req.get("desc", "")
                            formatted.append(f"- {title}: {desc}" if desc else f"- {title}")
                        else:
                            formatted.append(f"- {str(req)}")
                    return "\n".join(formatted) if formatted else "No specific requirements"
                return str(reqs) if reqs else "No specific requirements"
            elif "raw_text" in item:
                return item.get("raw_text", "")
            else:
                return "\n".join(f"{k}: {v}" for k, v in item.items())
        elif isinstance(item, list):
            formatted = []
            for i in item:
                if isinstance(i, str):
                    formatted.append(f"- {i}")
                elif isinstance(i, dict):
                    text = i.get("action") or i.get("title") or str(i)
                    priority = i.get("priority", "")
                    reason = i.get("reason", "")
                    suffix = f" (Priority: {priority}, Reason: {reason})" if priority and reason else \
                             f" (Priority: {priority})" if priority else ""
                    formatted.append(f"- {text}{suffix}")
                else:
                    formatted.append(f"- {str(i)}")
            return "\n".join(formatted) if formatted else "No items"
        else:
            return str(item) if item else ""

    @staticmethod
    def _parse_ai_response(resp):
        """Safely parse AI response with fallback for degraded or malformed content."""
        if isinstance(resp, dict) and resp.get("status") == "degraded":
            return resp
        try:
            content = getattr(resp, "content", str(resp)) if not isinstance(resp, str) else resp
            # Extract JSON from markdown or raw text
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', content, re.DOTALL) \
                         or re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(1).strip() if '```' in json_match.group(0) else json_match.group(0)
            try:
                return json.loads(content)
            except json.JSONDecodeError as e:
                logger.warning(f"JSON parsing failed: {e}. Content preview: {content[:200]}")
                return {"raw_text": content, "parse_error": str(e)}
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}", exc_info=True)
            return {"raw_text": str(resp)}

    def _generate_with_fallback(self, prompt_obj, system_prompt, max_tokens=1000, temperature=0.5):
        fallback_handler = AIFallbackHandler(
            primary_provider=self.provider,
            backup_provider=None,
            retry_config=RetryConfig(max_retries=3, initial_delay=1.0),
            cache_ttl=3600
        )
        try:
            return fallback_handler.execute_with_fallback(
                prompt=prompt_obj,
                system_prompt=system_prompt,
                config=AIGenerationConfig(model="gpt-4o-mini", temperature=temperature, max_tokens=max_tokens)
            )
        except Exception:
            feature_map = {
                QUICK_SUMMARY_PROMPT: "tender_analysis",
                TENDER_ANALYSIS_PROMPT: "tender_analysis",
                REQUIREMENT_EXTRACTION_PROMPT: "tender_analysis",
            }
            return GracefulDegradation.get_degraded_response(feature_map.get(prompt_obj, "tender_analysis"))

    # -------------------- AI Task Handlers --------------------
    def handle_text_generation(self, data):
        input_text = data.get("input", "")
        prompt_template = PromptRegistry.get("text_generation")
        prompt = prompt_template.render(input_text=input_text)
        config = AIGenerationConfig(model="gpt-4o-mini", temperature=0.7, max_tokens=1000)
        response = self.provider.generate(prompt=prompt, system_prompt=prompt_template.system_prompt, config=config)
        return {
            "task": "text-generation",
            "output": response.content,
            "usage": {
                "input_tokens": response.input_tokens,
                "output_tokens": response.output_tokens,
                "total_tokens": response.total_tokens,
                "cost": response.total_cost
            }
        }

    def handle_summarization(self, data):
        input_text = data.get("input", "")
        prompt_template = PromptRegistry.get("summarization")
        prompt = prompt_template.render(text=input_text)
        config = AIGenerationConfig(model="gpt-4o-mini", temperature=0.3, max_tokens=500)
        response = self.provider.generate(prompt=prompt, system_prompt=prompt_template.system_prompt, config=config)
        return {"task": "summarization", "output": response.content, "usage": {
            "input_tokens": response.input_tokens,
            "output_tokens": response.output_tokens,
            "total_tokens": response.total_tokens,
            "cost": response.total_cost
        }}

    def handle_tender_preprocessing(self, data):
        document_id = data.get("document_id")
        if not document_id:
            raise ValueError("document_id is required for tender-preprocessing")
        doc = ProjectDocument.objects.get(id=document_id)
        if not doc.extracted_text:
            raise ValueError("Document text is empty. Extract text first.")

        # Generate summary, analysis, and requirements
        summary_resp = self._generate_with_fallback(
            QUICK_SUMMARY_PROMPT.render(tender_title=doc.project.title, tender_content=doc.extracted_text),
            QUICK_SUMMARY_PROMPT.system_prompt, max_tokens=500, temperature=0.3
        )
        analysis_resp = self._generate_with_fallback(
            TENDER_ANALYSIS_PROMPT.render(
                tender_title=doc.tender.title,
                tender_reference=getattr(doc.tender, "reference_number", str(doc.tender.id)),
                issuing_organization=getattr(doc.tender, "issuing_organization", "") or getattr(doc.tender, "organization", ""),
                tender_content=doc.extracted_text
            ),
            TENDER_ANALYSIS_PROMPT.system_prompt, max_tokens=1500, temperature=0.5
        )
        requirements_resp = self._generate_with_fallback(
            REQUIREMENT_EXTRACTION_PROMPT.render(tender_content=doc.extracted_text),
            REQUIREMENT_EXTRACTION_PROMPT.system_prompt, max_tokens=1000, temperature=0.5
        )

        summary_json = self._parse_ai_response(summary_resp)
        analysis_json = self._parse_ai_response(analysis_resp)
        requirements_json = self._parse_ai_response(requirements_resp)

        is_degraded = any(
            isinstance(resp, dict) and resp.get("status") == "degraded"
            for resp in [summary_json, analysis_json, requirements_json]
        )

        # Extract relevant fields
        key_requirements = analysis_json.get("key_requirements") or requirements_json.get("requirements") or []
        recommended_actions = analysis_json.get("recommended_actions") or []

        combined_result = {
            "task": "tender-preprocessing",
            "summary": summary_json,
            "analysis": analysis_json,
            "requirements": requirements_json,
        }

        doc.ai_summary = json.dumps(combined_result)
        doc.ai_processed = True
        doc.ai_processed_at = timezone.now()
        doc.save()

        if is_degraded:
            return {
                "status": "degraded",
                "message": "AI analysis is temporarily unavailable. Please try again later.",
                "summary": "Unable to generate AI summary at this time.",
                "key_requirements": [],
                "recommended_actions": [{"action": "Manually review the tender document", "priority": "high", "reason": "AI analysis unavailable"}]
            }

        summary_text = self._format_context_item(summary_json)
        return {
            "status": "success",
            "message": "AI analysis completed successfully",
            "summary": summary_text,
            "key_requirements": key_requirements,
            "recommended_actions": recommended_actions
        }

    # -------------------- Proposal-related handlers --------------------
    def handle_proposal_section_generation(self, data):
        context = data.get("context", {})
        if not context:
            raise ValueError("context is required for proposal-section-generation")

        project_summary = self._format_context_item(context.get("project_summary", {}))
        key_requirements = self._format_context_item(context.get("key_requirements", {}))
        recommended_actions = self._format_context_item(context.get("recommended_actions", []))

        try:
            prompt_template = PromptRegistry.get("proposal_section_generation")
        except KeyError:
            from .prompts.proposal_generation import PROPOSAL_SECTION_GENERATION_PROMPT
            prompt_template = PROPOSAL_SECTION_GENERATION_PROMPT

        prompt = prompt_template.render(
            project_summary=project_summary,
            key_requirements=key_requirements,
            recommended_actions=recommended_actions
        )

        config = AIGenerationConfig(model="gpt-4o-mini", temperature=0.7, max_tokens=4000)
        response = self.provider.generate(prompt=prompt, system_prompt=prompt_template.system_prompt, config=config)

        # Parse JSON safely
        content = response.content
        json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', content, re.DOTALL) or re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            content = json_match.group(1) if '```' in json_match.group(0) else json_match.group(0)
        try:
            sections_dict = json.loads(content)
            return sections_dict if isinstance(sections_dict, dict) else {"Executive Summary": "Unable to generate sections"}
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse proposal sections JSON: {e}")
            return {"Executive Summary": "Unable to generate sections", "Error": str(e)}

    def handle_proposal_review(self, data):
        context = data.get("context", {})
        proposal_sections = data.get("proposal_sections", {})

        if not context:
            raise ValueError("context is required for proposal-review")

        project_summary = self._format_context_item(context.get("summary", ""))
        key_requirements = self._format_context_item(context.get("requirements", ""))

        sections_text = "\n\n".join(f"## {k}\n{v}" for k, v in (proposal_sections or {}).items()) or "No proposal sections provided."

        prompt_template = PromptRegistry.get("proposal_review")
        prompt = prompt_template.render(
            project_summary=project_summary,
            key_requirements=key_requirements,
            proposal_sections=sections_text
        )

        config = AIGenerationConfig(model="gpt-4o-mini", temperature=0.3, max_tokens=2000)
        response = self.provider.generate(prompt=prompt, system_prompt=prompt_template.system_prompt, config=config)

        review_json = self._parse_ai_response(response)
        if not isinstance(review_json, dict):
            return {"overall_rating": "Unable to determine", "strengths": [], "weaknesses": ["AI review failed"], "missing_elements": [], "recommendations": ["Please review manually"], "summary": str(review_json)}
        return review_json

    def handle_proposal_checklist(self, data):
        context = data.get("context", {})
        proposal_sections = data.get("proposal_sections", {})

        if not context:
            raise ValueError("context is required for proposal-checklist")

        project_summary = self._format_context_item(context.get("summary", ""))
        key_requirements_text = self._format_context_item(context.get("requirements", []))
        actions_text = self._format_context_item(context.get("analysis", {}).get("recommended_actions", []))

        try:
            prompt_template = PromptRegistry.get("proposal_checklist")
        except KeyError:
            from .prompts.proposal_generation import PROPOSAL_CHECKLIST_PROMPT
            prompt_template = PROPOSAL_CHECKLIST_PROMPT

        prompt = prompt_template.render(
            project_summary=project_summary,
            key_requirements=key_requirements_text,
            proposal_sections=proposal_sections,
            recommended_actions=actions_text
        )

        config = AIGenerationConfig(model="gpt-4o-mini", temperature=0.3, max_tokens=1000)
        response = self.provider.generate(prompt=prompt, system_prompt=getattr(prompt_template, "system_prompt", ""), config=config)

        checklist_json = self._parse_ai_response(response)
        if not isinstance(checklist_json, dict):
            return {"checklist": [], "message": f"Checklist generation failed: {checklist_json}"}
        return checklist_json

    def handle_proposal_rag(self, data):
        key_requirements = data.get("key_requirements", [])
        if not key_requirements:
            raise ValueError("key_requirements required for RAG retrieval")

        from .services.rag import load_past_proposals, match_requirements
        proposals = load_past_proposals()
        relevant_proposals = match_requirements(key_requirements, proposals)

        result = {}
        for p in relevant_proposals:
            for section, content in p.get("sections", {}).items():
                result.setdefault(section, []).append(content)

        return {"status": "success", "retrieved_sections": result, "count": len(relevant_proposals)}

