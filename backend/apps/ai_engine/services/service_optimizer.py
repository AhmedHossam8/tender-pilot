"""AI Service Optimizer

Provides AI-powered helpers for improving service descriptions
and suggesting attractive service packages.

Reuses the existing AI provider abstraction and prompt style
used by other AI services in this app.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from django.utils import timezone

from apps.ai_engine.services import get_ai_provider

logger = logging.getLogger(__name__)


class AIServiceOptimizer:
    """Help providers create compelling service listings.

    Methods:
        - optimize_description: rewrite for clarity/SEO/conversion
        - suggest_packages: suggest tiered packages based on description
    """

    def __init__(self, model: str = "gpt-4o-mini") -> None:
        self.provider = get_ai_provider()
        self.model = model

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def optimize_description(
        self,
        *,
        name: str,
        description: str,
        category: Optional[str] = None,
        target_audience: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Optimize a raw service description.

        Returns a structured payload with:
            - optimized_description (str)
            - tagline (str, optional)
            - keywords (List[str], optional)
        """
        system_prompt = (
            "You are an expert service copywriter. Improve service descriptions "
            "for clarity, professionalism, SEO, and conversion while keeping "
            "them honest and realistic. Always return valid JSON."
        )

        user_prompt = (
            "Optimize the following service description.\n\n"
            f"Service name: {name}\n"
        )
        if category:
            user_prompt += f"Category: {category}\n"
        if target_audience:
            user_prompt += f"Target audience: {target_audience}\n"

        user_prompt += (
            "\nCurrent description:\n" + description + "\n\n"
            "Return ONLY a JSON object with this schema:\n"
            "{\n"
            "  \"optimized_description\": string,\n"
            "  \"tagline\": string,\n"
            "  \"keywords\": string[]\n"
            "}\n"
        )

        response = self.provider.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=800,
            temperature=0.4,
        )

        parsed = self._parse_json(response.content)
        if not isinstance(parsed, dict):
            logger.warning("optimize_description: AI returned non-dict, applying fallback")
            return {
                "optimized_description": description,
                "tagline": name,
                "keywords": [],
            }

        optimized = parsed.get("optimized_description") or description
        tagline = parsed.get("tagline") or name
        keywords = parsed.get("keywords") or []

        # Normalize keywords to list of strings
        if isinstance(keywords, str):
            keywords = [k.strip() for k in keywords.split(",") if k.strip()]
        elif not isinstance(keywords, list):
            keywords = []

        return {
            "optimized_description": optimized,
            "tagline": tagline,
            "keywords": keywords,
        }

    def suggest_packages(
        self,
        *,
        name: str,
        description: str,
        category: Optional[str] = None,
        existing_packages: Optional[List[Dict[str, Any]]] = None,
        currency: str = "USD",
    ) -> List[Dict[str, Any]]:
        """Suggest pricing tiers/packages for a service.

        Returns a list of packages with fields:
            - name (str)
            - description (str)
            - price (float)
            - duration_hours (int)
        """
        system_prompt = (
            "You are a pricing strategist helping service providers design clear "
            "tiered packages (e.g., Basic/Standard/Premium)."
            "Always return valid JSON only."
        )

        user_prompt = (
            "Based on the following service, suggest 2-4 tiered packages.\n\n"
            f"Service name: {name}\n"
        )
        if category:
            user_prompt += f"Category: {category}\n"

        user_prompt += "\nService description:\n" + description + "\n\n"

        if existing_packages:
            user_prompt += (
                "Existing packages (if any):\n" + json.dumps(existing_packages, indent=2) + "\n\n"
            )

        user_prompt += (
            "Return ONLY a JSON array of package objects with this schema:\n"
            "[{\n"
            "  \"name\": string,\n"
            "  \"description\": string,\n"
            "  \"price\": number,  // in "
            + currency
            + "\n"
            "  \"duration_hours\": integer\n"
            "}]\n"
            "Prices should be realistic for this kind of service."
        )

        response = self.provider.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=800,
            temperature=0.5,
        )

        parsed = self._parse_json(response.content)
        if not isinstance(parsed, list):
            logger.warning("suggest_packages: AI returned non-list, falling back to empty list")
            return []

        normalized: List[Dict[str, Any]] = []
        for pkg in parsed:
            if not isinstance(pkg, dict):
                continue
            name_val = str(pkg.get("name") or "Package").strip() or "Package"
            desc_val = str(pkg.get("description") or "").strip()

            # Coerce numeric fields
            try:
                price_val = float(pkg.get("price", 0))
            except (TypeError, ValueError):
                price_val = 0.0

            try:
                duration_val = int(pkg.get("duration_hours", 1))
            except (TypeError, ValueError):
                duration_val = 1

            normalized.append(
                {
                    "name": name_val,
                    "description": desc_val,
                    "price": price_val,
                    "duration_hours": max(duration_val, 1),
                }
            )

        return normalized

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _parse_json(self, raw: str) -> Any:
        """Parse JSON from an AI response, handling code fences.

        Attempts:
            1) Direct json.loads
            2) Extract from ```json ... ``` block
            3) Extract from first ``` ... ``` block
        """
        if not raw:
            return None

        raw = raw.strip()

        # 1) Direct JSON
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # 2) ```json ... ```
        if "```json" in raw:
            start = raw.find("```json") + len("```json")
            end = raw.find("```", start)
            if end != -1:
                snippet = raw[start:end].strip()
                try:
                    return json.loads(snippet)
                except json.JSONDecodeError:
                    logger.debug("Failed to parse JSON from ```json block")

        # 3) Any ``` ... ``` block
        if "```" in raw:
            start = raw.find("```") + len("```")
            end = raw.find("```", start)
            if end != -1:
                snippet = raw[start:end].strip()
                try:
                    return json.loads(snippet)
                except json.JSONDecodeError:
                    logger.debug("Failed to parse JSON from generic code block")

        logger.warning("AIServiceOptimizer._parse_json: could not parse JSON from response")
        return None
