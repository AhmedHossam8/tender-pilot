from .services import get_ai_provider
from .prompts.registry import PromptRegistry
from .services.base import AIGenerationConfig
from .prompts.tender_analysis import (
    TENDER_ANALYSIS_PROMPT,
    REQUIREMENT_EXTRACTION_PROMPT,
    QUICK_SUMMARY_PROMPT
)
import json
import logging
from django.utils import timezone
from apps.documents.models import TenderDocument
from .services.fallback import AIFallbackHandler, RetryConfig, GracefulDegradation

logger = logging.getLogger(__name__)


class AIRequestHandler:
    SUPPORTED_TASKS = {
        "text-generation": "handle_text_generation",
        "summarization": "handle_summarization",
        "tender-preprocessing": "handle_tender_preprocessing",
        # Add more tasks here
    }

    def __init__(self):
        self.provider = get_ai_provider()  # Get the configured AI provider

    def execute(self, data):
        task = data.get("task")
        if task not in self.SUPPORTED_TASKS:
            raise ValueError(f"Unsupported task: {task}")

        handler_method = getattr(self, self.SUPPORTED_TASKS[task])
        return handler_method(data)

    def handle_text_generation(self, data):
        input_text = data.get("input")

        # Get the appropriate prompt template
        prompt_template = PromptRegistry.get("text_generation")  # You'll need to create this

        # Render the prompt with variables
        prompt = prompt_template.render(input_text=input_text)

        # Configure generation parameters
        config = AIGenerationConfig(
            model="gpt-4o-mini",  # or your preferred model
            temperature=0.7,
            max_tokens=1000
        )

        # Call the AI provider
        response = self.provider.generate(
            prompt=prompt,
            system_prompt=prompt_template.system_prompt,
            config=config
        )

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
        input_text = data.get("input")

        # Get summarization prompt
        prompt_template = PromptRegistry.get("summarization")  # You'll need to create this

        # Render the prompt
        prompt = prompt_template.render(text=input_text)

        # Configure for summarization (lower temperature for consistency)
        config = AIGenerationConfig(
            model="gpt-4o-mini",
            temperature=0.3,
            max_tokens=500
        )

        # Call the AI provider
        response = self.provider.generate(
            prompt=prompt,
            system_prompt=prompt_template.system_prompt,
            config=config
        )

        return {
            "task": "summarization",
            "output": response.content,
            "usage": {
                "input_tokens": response.input_tokens,
                "output_tokens": response.output_tokens,
                "total_tokens": response.total_tokens,
                "cost": response.total_cost
            }
        }
    
    def handle_tender_preprocessing(self, data):
        document_id = data.get("document_id")
        if not document_id:
            raise ValueError("document_id is required for tender-preprocessing")

        # Fetch the document
        doc = TenderDocument.objects.get(id=document_id)
        document_text = doc.extracted_text
        logger.debug(f"Processing document {doc.id}, extracted text length: {len(document_text) if document_text else 0}")
        if not document_text:
            raise ValueError("Document text is empty. Extract text first.")

        # Initialize fallback handler
        primary_provider = get_ai_provider()
        fallback_handler = AIFallbackHandler(
            primary_provider=primary_provider,
            backup_provider=None,  # add a backup provider if you have one
            retry_config=RetryConfig(max_retries=3, initial_delay=1.0),
            cache_ttl=3600
        )

        # Helper function to call AI safely
        def generate_with_fallback(prompt_obj, system_prompt, max_tokens=1000, temperature=0.5):
            try:
                return fallback_handler.execute_with_fallback(
                    prompt=prompt_obj,
                    system_prompt=system_prompt,
                    config=AIGenerationConfig(model="gpt-4o-mini", temperature=temperature, max_tokens=max_tokens)
                )
            except Exception as e:
                # Return a graceful degradation if AI fails
                feature_map = {
                    QUICK_SUMMARY_PROMPT: "tender_analysis",
                    TENDER_ANALYSIS_PROMPT: "tender_analysis",
                    REQUIREMENT_EXTRACTION_PROMPT: "tender_analysis",
                }
                return GracefulDegradation.get_degraded_response(feature_map.get(prompt_obj, "tender_analysis"))

        # 1️⃣ Quick summary
        summary_prompt = QUICK_SUMMARY_PROMPT.render(
            tender_title=doc.tender.title,
            tender_content=document_text
        )
        summary_response = generate_with_fallback(summary_prompt, QUICK_SUMMARY_PROMPT.system_prompt, max_tokens=500, temperature=0.3)

        # 2️⃣ Full analysis
        analysis_prompt = TENDER_ANALYSIS_PROMPT.render(
            tender_title=doc.tender.title,
            tender_reference=getattr(doc.tender, "reference_number", "") or str(doc.tender.id),
            issuing_organization=getattr(doc.tender, "issuing_organization", None) or getattr(doc.tender, "organization", ""),
            tender_content=document_text
        )
        analysis_response = generate_with_fallback(analysis_prompt, TENDER_ANALYSIS_PROMPT.system_prompt, max_tokens=1500, temperature=0.5)

        # 3️⃣ Requirement extraction
        requirements_prompt = REQUIREMENT_EXTRACTION_PROMPT.render(
            tender_content=document_text
        )
        requirements_response = generate_with_fallback(requirements_prompt, REQUIREMENT_EXTRACTION_PROMPT.system_prompt, max_tokens=1000, temperature=0.5)

        # Parse outputs safely
        def parse_response(resp):
            if isinstance(resp, dict) and resp.get("status") == "degraded":
                return resp  # already degraded
            try:
                # AIResponse is a dataclass with content attribute
                content = None
                if hasattr(resp, 'content'):
                    content = resp.content
                elif isinstance(resp, str):
                    content = resp
                else:
                    content = str(resp)
                
                if not content:
                    return {"raw_text": ""}
                
                # Clean content - remove markdown code blocks if present
                import re
                # Try to extract JSON from markdown code blocks (greedy match for full JSON)
                json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', content, re.DOTALL)
                if json_match:
                    content = json_match.group(1).strip()
                else:
                    # Try to find JSON object directly in the content (greedy match)
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        content = json_match.group(0).strip()
                
                # Try to parse as JSON
                try:
                    parsed = json.loads(content)
                    return parsed
                except json.JSONDecodeError as e:
                    # If JSON parsing fails, log the error and return raw content
                    logger.warning(f"JSON parsing failed: {e}. Content preview: {content[:200]}")
                    # Return the raw content in a structured way
                    return {"raw_text": content, "parse_error": str(e)}
            except Exception as e:
                logger.error(f"Error parsing response: {e}, type: {type(resp)}", exc_info=True)
                return {"raw_text": getattr(resp, "content", str(resp))}

        summary_json = parse_response(summary_response)
        analysis_json = parse_response(analysis_response)
        requirements_json = parse_response(requirements_response)

        # Check if any response is degraded
        is_degraded = (
            (isinstance(summary_json, dict) and summary_json.get("status") == "degraded") or
            (isinstance(analysis_json, dict) and analysis_json.get("status") == "degraded") or
            (isinstance(requirements_json, dict) and requirements_json.get("status") == "degraded")
        )

        # Combine all results into a single structure for storage
        combined_result = {
            "task": "tender-preprocessing",
            "summary": summary_json,
            "analysis": analysis_json,
            "requirements": requirements_json,
        }

        # Save results - store combined result in ai_summary as JSON
        doc.ai_summary = json.dumps(combined_result) if isinstance(combined_result, dict) else str(combined_result)
        doc.ai_processed = True
        doc.ai_processed_at = timezone.now()
        doc.save()

        # Format response for API to match degraded response format
        if is_degraded:
            # Return degraded format
            return {
                "status": "degraded",
                "message": "AI analysis is temporarily unavailable. Please try again later.",
                "summary": "Unable to generate AI summary at this time.",
                "key_requirements": [],
                "recommended_actions": [
                    {
                        "action": "Manually review the tender document",
                        "priority": "high",
                        "reason": "AI analysis unavailable"
                    }
                ]
            }
        else:
            # Extract data from parsed responses
            # QUICK_SUMMARY_PROMPT returns: {"summary": "...", "main_objective": "...", ...}
            summary_text = ""
            if isinstance(summary_json, dict):
                if "parse_error" in summary_json:
                    # JSON parsing failed, log it
                    logger.warning(f"Summary parsing failed: {summary_json.get('parse_error')}")
                    summary_text = summary_json.get("raw_text", "")[:500]  # Limit raw text length
                else:
                    summary_text = summary_json.get("summary", "")
                    # If summary is empty, try to extract from raw_text
                    if not summary_text and "raw_text" in summary_json:
                        summary_text = summary_json["raw_text"]
            else:
                summary_text = str(summary_json)
            
            # TENDER_ANALYSIS_PROMPT returns: {"summary": "...", "key_requirements": [...], "recommended_actions": [...], ...}
            key_requirements = []
            recommended_actions = []
            
            if isinstance(analysis_json, dict):
                if "parse_error" in analysis_json:
                    logger.warning(f"Analysis parsing failed: {analysis_json.get('parse_error')}")
                else:
                    # Get key_requirements from analysis
                    if "key_requirements" in analysis_json:
                        key_requirements = analysis_json.get("key_requirements", [])
                        if not isinstance(key_requirements, list):
                            logger.warning(f"key_requirements is not a list: {type(key_requirements)}")
                            key_requirements = []
                    # Get recommended_actions from analysis
                    if "recommended_actions" in analysis_json:
                        recommended_actions = analysis_json.get("recommended_actions", [])
                        if not isinstance(recommended_actions, list):
                            logger.warning(f"recommended_actions is not a list: {type(recommended_actions)}")
                            recommended_actions = []
            
            # REQUIREMENT_EXTRACTION_PROMPT returns: {"requirements": [...], ...}
            # If key_requirements not found in analysis, try requirements_json
            if not key_requirements and isinstance(requirements_json, dict):
                if "parse_error" in requirements_json:
                    logger.warning(f"Requirements parsing failed: {requirements_json.get('parse_error')}")
                elif "requirements" in requirements_json:
                    key_requirements = requirements_json.get("requirements", [])
                    if not isinstance(key_requirements, list):
                        logger.warning(f"requirements is not a list: {type(key_requirements)}")
                        key_requirements = []
            
            # Log extracted values for debugging
            logger.info(f"Extracted - summary length: {len(summary_text)}, requirements count: {len(key_requirements)}, actions count: {len(recommended_actions)}")
            
            return {
                "status": "success",
                "message": "AI analysis completed successfully",
                "summary": summary_text,
                "key_requirements": key_requirements,
                "recommended_actions": recommended_actions,
            }