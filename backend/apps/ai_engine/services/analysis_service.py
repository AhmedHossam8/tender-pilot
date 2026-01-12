"""
AI Analysis Service Layer

This module provides high-level business logic for AI-powered analysis operations.
It orchestrates workflows such as:
- Project analysis
- Compliance checking
- Proposal outline generation
"""

import json
import logging
from typing import Dict, Any, Optional
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.projects.models import Project, ProjectRequirement
from apps.documents.models import ProjectDocument

# Bid is optional
try:
    from apps.bids.models import Bid
except ImportError:
    Bid = None

from ..models import AIRequest, AIResponse, AIRequestStatus
from ..prompts.registry import get_prompt
from ..tracking.usage import AIUsageTracker
from ..exceptions import AIInvalidResponseError
from .factory import get_ai_provider

logger = logging.getLogger(__name__)


# =====================================================
# PROJECT ANALYSIS
# =====================================================

class ProjectAnalysisService:
    """AI-powered analysis for projects."""

    def __init__(self):
        self.usage_tracker = AIUsageTracker()

    def analyze_project(
        self,
        project_id: str,
        user,
        force_refresh: bool = False,
        analysis_depth: str = "standard",
        language: str = "english",
        locale: str = "en",
    ) -> Dict[str, Any]:
        logger.info(f"Starting project analysis: project_id={project_id}, language={language}")

        project = self._get_project(project_id)

        if not force_refresh:
            cached = self._get_cached_analysis(project_id)
            if cached:
                return cached

        extracted_text = self._get_project_text(project)

        prompt_data = self._build_analysis_prompt(
            project, extracted_text, analysis_depth, language
        )

        with transaction.atomic():
            return self._execute_analysis(
                project=project,
                user=user,
                prompt_data=prompt_data,
                analysis_depth=analysis_depth,
            )

    def _get_project(self, project_id: str) -> Project:
        try:
            # Don't prefetch documents as that app might not be fully set up
            return Project.objects.prefetch_related(
                "requirements", "skills", "category"
            ).get(id=project_id)
        except Project.DoesNotExist:
            raise ValidationError({"error": "Project not found"})

    def _get_cached_analysis(self, project_id: str) -> Optional[Dict[str, Any]]:
        req = (
            AIRequest.objects.filter(
                content_type="project",
                object_id=str(project_id),
                status=AIRequestStatus.COMPLETED,
                prompt_name="project_analysis",
            )
            .select_related("response")
            .order_by("-created_at")
            .first()
        )

        if not req:
            return None

        age_hours = (timezone.now() - req.created_at).total_seconds() / 3600
        if age_hours > 24:
            return None

        # Check if project was updated after analysis
        # Note: Project model doesn't have updated_at, so we skip this check
        # project = Project.objects.get(id=project_id)
        # if hasattr(project, 'updated_at') and project.updated_at > req.created_at:
        #     return None

        try:
            analysis = json.loads(req.response.output_text)
        except Exception:
            return None

        return {
            "request_id": str(req.id),
            "analysis": analysis,
            "tokens_used": req.response.total_tokens,
            "cached": True,
            "processing_time_ms": 0,
            "cache_age_hours": round(age_hours, 2),
        }

    def _get_project_text(self, project: Project) -> str:
        """
        Extract text from project documents if available.
        Falls back to basic project info if documents don't exist or have no text.
        """
        try:
            documents = ProjectDocument.objects.filter(
                project=project,
                extracted_text__isnull=False,
            ).exclude(extracted_text="")

            if documents.exists():
                return "\n\n".join(
                    f"=== {doc.document_type.upper()} ===\n{doc.extracted_text}"
                    for doc in documents
                )
        except Exception as e:
            # Handle case where ProjectDocument table doesn't exist
            logger.info(f"Could not access documents for project {project.id}: {e}")
        
        # Fallback: use project description and requirements
        text_parts = [f"PROJECT DESCRIPTION:\n{project.description}"]
        
        requirements = project.requirements.all()
        if requirements.exists():
            reqs_text = "\n".join(f"- {req.description}" for req in requirements)
            text_parts.append(f"\nREQUIREMENTS:\n{reqs_text}")
        
        return "\n\n".join(text_parts)

    def _build_analysis_prompt(
        self, project: Project, extracted_text: str, analysis_depth: str, language: str = "english"
    ) -> Dict[str, str]:
        template = get_prompt("project_analysis", version="1.0.0")

        max_chars = 50000 if analysis_depth == "detailed" else 20000
        extracted_text = extracted_text[:max_chars]
        
        # Add language instruction to system prompt
        system_prompt = template.system_prompt
        if language == "arabic":
            system_prompt += "\n\nIMPORTANT: Please respond in Arabic language. Provide your analysis in Arabic text, maintaining the same JSON structure but with Arabic content."

        return {
            "system_prompt": system_prompt,
            "user_prompt": template.render(
                project_title=project.title,
                project_id=str(project.id),
                budget=project.budget,
                skills=", ".join(s.name for s in project.skills.all()),
                content=extracted_text,
                analysis_depth=analysis_depth,
            ),
        }

    def _execute_analysis(
        self,
        project: Project,
        user,
        prompt_data: Dict[str, str],
        analysis_depth: str,
    ) -> Dict[str, Any]:
        start = timezone.now()

        ai_request = AIRequest.objects.create(
            user=user,
            content_type="project",
            object_id=str(project.id),
            prompt_name="project_analysis",
            prompt_version="1.0.0",
            system_prompt=prompt_data["system_prompt"],
            user_prompt=prompt_data["user_prompt"],
            provider="openai",
            model="gpt-4o-mini",
            temperature=0.3,
            status=AIRequestStatus.PROCESSING,
        )

        try:
            provider = get_ai_provider()
            response = provider.generate(
                prompt=prompt_data["user_prompt"],
                system_prompt=prompt_data["system_prompt"],
                max_tokens=4000,
                temperature=0.3,
            )

            # Log the response for debugging
            logger.info(f"AI response content length: {len(response.content) if response.content else 0}")
            logger.debug(f"AI response preview: {response.content[:500] if response.content else 'EMPTY'}")
            
            if not response.content or response.content.strip() == "":
                raise ValueError("Empty response from AI provider")
            
            # Try to extract JSON from markdown code blocks if present
            content = response.content.strip()
            if "```json" in content:
                # Extract JSON from code block
                json_start = content.find("```json") + 7
                json_end = content.find("```", json_start)
                content = content[json_start:json_end].strip()
            elif "```" in content:
                # Generic code block
                code_start = content.find("```") + 3
                code_end = content.find("```", code_start)
                content = content[code_start:code_end].strip()
            
            analysis = json.loads(content)
            self._validate_analysis_response(analysis)

            processing_time_ms = int(
                (timezone.now() - start).total_seconds() * 1000
            )

            AIResponse.objects.create(
                request=ai_request,
                content=response.content,
                parsed_content=analysis,
                output_tokens=response.output_tokens or 0,
                total_tokens=response.total_tokens or 0,
                model_used=response.model or 'unknown',
                finish_reason='stop',
            )

            project.ai_summary = analysis.get("summary", "")
            project.save(update_fields=["ai_summary"])

            usage = self.usage_tracker.log_usage(
                user=user,
                request=ai_request,
                input_tokens=response.input_tokens,
                output_tokens=response.output_tokens,
                provider="openai",
                model=response.model,
            )

            ai_request.status = AIRequestStatus.COMPLETED
            ai_request.save(update_fields=["status"])

            return {
                "request_id": str(ai_request.id),
                "analysis": analysis,
                "tokens_used": response.total_tokens,
                "cost": float(usage.estimated_cost),
                "cached": False,
                "processing_time_ms": processing_time_ms,
            }

        except Exception as e:
            ai_request.status = AIRequestStatus.FAILED
            ai_request.error_message = str(e)
            ai_request.save()
            raise

    def _validate_analysis_response(self, analysis: Dict[str, Any]) -> None:
        required = ["summary", "key_requirements", "estimated_complexity"]
        missing = [f for f in required if f not in analysis]
        if missing:
            raise AIInvalidResponseError(
                f"Missing fields in AI response: {', '.join(missing)}"
            )


# =====================================================
# COMPLIANCE CHECK
# =====================================================

class ComplianceCheckService:
    """Checks proposal compliance against project requirements."""

    def __init__(self):
        self.usage_tracker = AIUsageTracker()

    def check_compliance(
        self,
        project_id: str,
        user,
        proposal_id: Optional[str] = None,
        proposal_content: Optional[str] = None,
        language: str = "english",
        locale: str = "en",
    ) -> Dict[str, Any]:

        if not proposal_id and not proposal_content:
            raise ValidationError("proposal_id or proposal_content is required")

        project = Project.objects.prefetch_related("requirements").get(id=project_id)

        if proposal_id:
            if Proposal is None:
                raise ValidationError("Proposal module not available")
            proposal_text = Proposal.objects.get(id=proposal_id).content
        else:
            proposal_text = proposal_content

        template = get_prompt("compliance_check", version="1.0.0")
        
        # Add language instruction to system prompt
        system_prompt = template.system_prompt
        if language == "arabic":
            system_prompt += "\n\nIMPORTANT: Please respond in Arabic language. Provide your compliance analysis in Arabic text, maintaining the same JSON structure but with Arabic content."

        requirements = "\n".join(
            f"- {r.title} ({'MANDATORY' if r.is_mandatory else 'OPTIONAL'})"
            for r in project.requirements.all()
        )

        prompt_data = {
            "system_prompt": system_prompt,
            "user_prompt": template.render(
                project_title=project.title,
                requirements=requirements,
                proposal_content=proposal_text,
            ),
        }

        return self._execute_check(project, user, prompt_data)

    def _execute_check(self, project, user, prompt_data):
        ai_request = AIRequest.objects.create(
            user=user,
            content_type="compliance",
            object_id=str(project.id),
            prompt_name="compliance_check",
            prompt_version="1.0.0",
            system_prompt=prompt_data["system_prompt"],
            user_prompt=prompt_data["user_prompt"],
            provider="openai",
            model="gpt-4o-mini",
            temperature=0.2,
            status=AIRequestStatus.PROCESSING,
        )

        provider = get_ai_provider()
        response = provider.generate(**prompt_data)

        result = json.loads(response.content)

        AIResponse.objects.create(
            request=ai_request,
            output_text=response.content,
            input_tokens=response.input_tokens,
            output_tokens=response.output_tokens,
            total_tokens=response.total_tokens,
            model_used=response.model,
        )

        self.usage_tracker.log_usage(
            user=user,
            request=ai_request,
            input_tokens=response.input_tokens,
            output_tokens=response.output_tokens,
            provider="openai",
            model=response.model,
        )

        ai_request.status = AIRequestStatus.COMPLETED
        ai_request.save()

        return result


# =====================================================
# PROPOSAL OUTLINE
# =====================================================

class ProposalOutlineService:
    """Generates proposal outlines for projects."""

    def __init__(self):
        self.usage_tracker = AIUsageTracker()

    def generate_outline(
        self,
        project_id: str,
        user,
        style="standard",
        language: str = "english",
        locale: str = "en",
    ) -> Dict[str, Any]:
        project = Project.objects.prefetch_related("requirements").get(id=project_id)
        template = get_prompt("proposal_generation", version="1.0.0")
        
        # Add language instruction to system prompt
        system_prompt = template.system_prompt
        if language == "arabic":
            system_prompt += "\n\nIMPORTANT: Please respond in Arabic language. Provide your proposal outline in Arabic text, maintaining the same JSON structure but with Arabic content."

        prompt_data = {
            "system_prompt": system_prompt,
            "user_prompt": template.render(
                project_title=project.title,
                requirements="\n".join(r.title for r in project.requirements.all()),
                style=style,
            ),
        }

        provider = get_ai_provider()
        response = provider.generate(**prompt_data)

        result = json.loads(response.content)

        return {
            "outline": result,
            "tokens_used": response.total_tokens,
        }
