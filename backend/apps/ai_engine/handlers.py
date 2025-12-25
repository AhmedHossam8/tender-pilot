from .services import get_ai_provider
from .prompts.registry import PromptRegistry
from .services.base import AIGenerationConfig
from .prompts.tender_analysis import (
    TENDER_ANALYSIS_PROMPT,
    REQUIREMENT_EXTRACTION_PROMPT,
    QUICK_SUMMARY_PROMPT
)
from .prompts.registry import PromptRegistry
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
        "proposal-section-generation": "handle_proposal_section_generation",
        "proposal-review": "handle_proposal_review",
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
    
    def handle_proposal_section_generation(self, data):
        """
        Generate proposal sections from context.
        
        Expected data format:
        {
            "task": "proposal-section-generation",
            "context": {
                "project_summary": {...},
                "key_requirements": {...},
                "recommended_actions": [...]
            }
        }
        
        Returns:
            Dict with section names as keys and content as values
        """
        context = data.get("context", {})
        if not context:
            raise ValueError("context is required for proposal-section-generation")
        
        project_summary = context.get("project_summary", {})
        key_requirements = context.get("key_requirements", {})
        recommended_actions = context.get("recommended_actions", [])
        
        # Format the context for the prompt
        # Convert dict/object to string representation
        def format_context_item(item):
            if isinstance(item, dict):
                # Handle different dict structures
                if "summary" in item:
                    # Summary dict from tender preprocessing
                    summary = item.get("summary", "")
                    if summary:
                        return summary
                    # Fallback to raw_text if summary is empty
                    return item.get("raw_text", "")
                elif "requirements" in item:
                    # Requirements dict from tender preprocessing
                    reqs = item.get("requirements", [])
                    if isinstance(reqs, list):
                        formatted = []
                        for req in reqs:
                            if isinstance(req, str):
                                formatted.append(f"- {req}")
                            elif isinstance(req, dict):
                                title = req.get("title", req.get("requirement", str(req)))
                                desc = req.get("description", req.get("desc", ""))
                                if desc:
                                    formatted.append(f"- {title}: {desc}")
                                else:
                                    formatted.append(f"- {title}")
                            else:
                                formatted.append(f"- {str(req)}")
                        return "\n".join(formatted) if formatted else "No specific requirements"
                    return str(reqs) if reqs else "No specific requirements"
                elif "raw_text" in item:
                    # Fallback for parsing errors
                    return item.get("raw_text", "")
                else:
                    # Generic dict - format key-value pairs
                    formatted = []
                    for k, v in item.items():
                        if isinstance(v, (dict, list)):
                            formatted.append(f"{k}: {str(v)}")
                        else:
                            formatted.append(f"{k}: {v}")
                    return "\n".join(formatted) if formatted else ""
            elif isinstance(item, list):
                # Format list of actions or requirements
                formatted = []
                for action in item:
                    if isinstance(action, str):
                        formatted.append(f"- {action}")
                    elif isinstance(action, dict):
                        action_text = action.get("action", action.get("title", str(action)))
                        priority = action.get("priority", "")
                        reason = action.get("reason", "")
                        if priority and reason:
                            formatted.append(f"- {action_text} (Priority: {priority}, Reason: {reason})")
                        elif priority:
                            formatted.append(f"- {action_text} (Priority: {priority})")
                        else:
                            formatted.append(f"- {action_text}")
                    else:
                        formatted.append(f"- {str(action)}")
                return "\n".join(formatted) if formatted else "No items"
            else:
                return str(item) if item else ""
        
        summary_text = format_context_item(project_summary)
        requirements_text = format_context_item(key_requirements)
        actions_text = format_context_item(recommended_actions) if recommended_actions else "No specific actions recommended"
        
        # Get the prompt template
        try:
            prompt_template = PromptRegistry.get("proposal_section_generation")
        except KeyError:
            # Fallback if prompt not registered
            logger.warning("proposal_section_generation prompt not found, using default")
            from .prompts.proposal_generation import PROPOSAL_SECTION_GENERATION_PROMPT
            prompt_template = PROPOSAL_SECTION_GENERATION_PROMPT
        
        # Render the prompt
        prompt = prompt_template.render(
            project_summary=summary_text,
            key_requirements=requirements_text,
            recommended_actions=actions_text
        )
        
        # Configure generation parameters
        config = AIGenerationConfig(
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=4000  # Higher token limit for multiple sections
        )
        
        # Call the AI provider
        response = self.provider.generate(
            prompt=prompt,
            system_prompt=prompt_template.system_prompt,
            config=config
        )
        
        # Parse the JSON response
        content = response.content
        
        # Clean content - remove markdown code blocks if present
        import re
        json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', content, re.DOTALL)
        if json_match:
            content = json_match.group(1).strip()
        else:
            # Try to find JSON object directly
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0).strip()
        
        try:
            sections_dict = json.loads(content)
            if not isinstance(sections_dict, dict):
                raise ValueError("Response is not a dictionary")
            
            # Return the sections dictionary directly (section_name: content)
            return sections_dict
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse proposal sections JSON: {e}. Content: {content[:500]}")
            # Return a fallback structure
            return {
                "Executive Summary": "Unable to generate sections. Please try again or generate manually.",
                "Error": f"JSON parsing failed: {str(e)}"
            }

    def handle_proposal_review(self, data):
        """Handle proposal review task"""
        context = data.get("context", {})
        proposal_sections = data.get("proposal_sections", {})
        
        logger.info(f"Handling proposal review with context keys: {list(context.keys())}, sections: {len(proposal_sections)}")
        
        if not context:
            raise ValueError("context is required for proposal-review")
        
        # Format context items for the prompt
        def format_context_item(item):
            if isinstance(item, str):
                return item
            elif isinstance(item, dict):
                if "summary" in item:
                    # Handle summary dict
                    return item.get("summary", "")
                elif "requirements" in item:
                    # Handle requirements dict
                    reqs = item.get("requirements", [])
                    if isinstance(reqs, list):
                        formatted = []
                        for req in reqs:
                            if isinstance(req, str):
                                formatted.append(f"- {req}")
                            elif isinstance(req, dict):
                                title = req.get("title", req.get("requirement", str(req)))
                                desc = req.get("description", req.get("desc", ""))
                                if desc:
                                    formatted.append(f"- {title}: {desc}")
                                else:
                                    formatted.append(f"- {title}")
                            else:
                                formatted.append(f"- {str(req)}")
                        return "\n".join(formatted) if formatted else "No specific requirements"
                    return str(reqs) if reqs else "No specific requirements"
                else:
                    # Generic dict - format key-value pairs
                    formatted = []
                    for k, v in item.items():
                        if isinstance(v, (dict, list)):
                            formatted.append(f"{k}: {str(v)}")
                        else:
                            formatted.append(f"{k}: {v}")
                    return "\n".join(formatted) if formatted else ""
            elif isinstance(item, list):
                # Format list of actions or requirements
                formatted = []
                for action in item:
                    if isinstance(action, str):
                        formatted.append(f"- {action}")
                    elif isinstance(action, dict):
                        action_text = action.get("action", action.get("title", str(action)))
                        priority = action.get("priority", "")
                        reason = action.get("reason", "")
                        if priority and reason:
                            formatted.append(f"- {action_text} (Priority: {priority}, Reason: {reason})")
                        elif priority:
                            formatted.append(f"- {action_text} (Priority: {priority})")
                        else:
                            formatted.append(f"- {action_text}")
                    else:
                        formatted.append(f"- {str(action)}")
                return "\n".join(formatted) if formatted else "No items"
            else:
                return str(item) if item else ""
        
        project_summary = format_context_item(context.get("summary", ""))
        key_requirements = format_context_item(context.get("requirements", ""))
        
        # Format proposal sections
        sections_text = ""
        if proposal_sections:
            for section_name, section_content in proposal_sections.items():
                sections_text += f"## {section_name}\n{section_content}\n\n"
        else:
            sections_text = "No proposal sections provided for review."
        
        # Get the prompt template
        try:
            prompt_template = PromptRegistry.get("proposal_review")
        except KeyError:
            logger.warning("proposal_review prompt not found")
            raise ValueError("Proposal review prompt not configured")
        
        # Render the prompt
        prompt = prompt_template.render(
            project_summary=project_summary,
            key_requirements=key_requirements,
            proposal_sections=sections_text
        )
        
        # Configure generation parameters
        config = AIGenerationConfig(
            model="gpt-4o-mini",
            temperature=0.3,  # Lower temperature for more consistent reviews
            max_tokens=2000
        )
        
        # Call the AI provider
        response = self.provider.generate(
            prompt=prompt,
            system_prompt=prompt_template.system_prompt,
            config=config
        )
        
        # Parse the JSON response
        content = response.content
        
        # Clean content - remove markdown code blocks if present
        import re
        json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', content, re.DOTALL)
        if json_match:
            content = json_match.group(1).strip()
        else:
            # Try to find JSON object directly
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                content = json_match.group(0).strip()
        
        try:
            review_dict = json.loads(content)
            if not isinstance(review_dict, dict):
                raise ValueError("Response is not a dictionary")
            
            logger.info(f"Proposal review generated successfully: {review_dict}")
            # Return the review dictionary
            return review_dict
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse proposal review JSON: {e}. Content: {content[:500]}")
            # Return a fallback structure
            return {
                "overall_rating": "Unable to determine",
                "strengths": [],
                "weaknesses": ["AI review failed"],
                "missing_elements": [],
                "recommendations": ["Please review manually"],
                "summary": f"Review generation failed: {str(e)}"
            }