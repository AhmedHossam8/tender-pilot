"""
Compliance Check Prompt Templates

These prompts are used for checking proposal compliance against
tender requirements and identifying gaps.
"""

from .base import PromptTemplate, PromptBuilder


# =============================================================================
# COMPLIANCE GAP ANALYSIS PROMPT
# =============================================================================

COMPLIANCE_CHECK_SYSTEM_PROMPT = """You are an expert compliance analyst specializing in tender and proposal evaluation. Your role is to:
1. Compare proposal content against tender requirements
2. Identify compliance gaps and missing elements
3. Assess the level of compliance for each requirement
4. Provide specific, actionable recommendations for addressing gaps

Be thorough, precise, and constructive in your analysis."""


COMPLIANCE_CHECK_TEMPLATE = """Perform a compliance gap analysis comparing the proposal against the tender requirements.

## TENDER REQUIREMENTS
${tender_requirements}

## PROPOSAL CONTENT
${proposal_content}

## ANALYSIS TASK
For each tender requirement, assess whether the proposal adequately addresses it.

Respond with a JSON object in this format:
```json
{
    "overall_compliance_score": 85,
    "compliance_level": "high|medium|low|critical-gaps",
    "requirements_analysis": [
        {
            "requirement_id": "REQ-001",
            "requirement_description": "Brief description",
            "compliance_status": "fully-met|partially-met|not-addressed|unclear",
            "compliance_percentage": 100,
            "evidence_in_proposal": "Quote or reference from proposal",
            "gap_description": "What is missing or inadequate",
            "recommendation": "Specific action to improve compliance",
            "priority": "critical|high|medium|low"
        }
    ],
    "fully_met_requirements": ["REQ-001", "REQ-002"],
    "partially_met_requirements": ["REQ-003"],
    "not_addressed_requirements": ["REQ-004"],
    "critical_gaps": [
        {
            "gap": "Description of critical gap",
            "impact": "Potential impact on bid success",
            "immediate_action": "What to do right now"
        }
    ],
    "improvement_recommendations": [
        {
            "area": "Area of improvement",
            "current_state": "What the proposal currently says",
            "recommended_change": "What should be added or modified",
            "expected_impact": "How this will improve compliance"
        }
    ],
    "strengths": ["Areas where proposal excels"],
    "risk_assessment": {
        "disqualification_risk": "low|medium|high",
        "risk_factors": ["List of risk factors"]
    }
}
```

Be specific and actionable in your recommendations."""


COMPLIANCE_CHECK_PROMPT = (PromptBuilder()
    .name("compliance_check")
    .version("1.0.0")
    .description("Full compliance gap analysis between proposal and tender requirements")
    .system(COMPLIANCE_CHECK_SYSTEM_PROMPT)
    .template(COMPLIANCE_CHECK_TEMPLATE)
    .add_variables(["tender_requirements", "proposal_content"])
    .output_schema({
        "overall_compliance_score": int,
        "compliance_level": str,
        "requirements_analysis": list,
        "critical_gaps": list,
        "improvement_recommendations": list,
    })
    .build()
)


# =============================================================================
# QUICK COMPLIANCE CHECK PROMPT (Lightweight)
# =============================================================================

QUICK_COMPLIANCE_TEMPLATE = """Quickly assess proposal compliance against key requirements.

## KEY REQUIREMENTS
${tender_requirements}

## PROPOSAL EXCERPT
${proposal_content}

Provide a brief assessment:
```json
{
    "compliance_score": 75,
    "status": "compliant|needs-work|non-compliant",
    "key_gaps": ["Gap 1", "Gap 2"],
    "urgent_actions": ["Action 1", "Action 2"]
}
```"""

QUICK_COMPLIANCE_PROMPT = (PromptBuilder()
    .name("quick_compliance")
    .version("1.0.0")
    .description("Quick compliance assessment")
    .system("You are a compliance analyst. Be concise and direct.")
    .template(QUICK_COMPLIANCE_TEMPLATE)
    .add_variables(["tender_requirements", "proposal_content"])
    .build()
)


# =============================================================================
# REQUIREMENT MATCHING PROMPT
# =============================================================================

REQUIREMENT_MATCHING_TEMPLATE = """Match proposal sections to tender requirements.

## TENDER REQUIREMENTS
${tender_requirements}

## PROPOSAL SECTIONS
${proposal_sections}

For each requirement, identify which proposal section(s) address it:
```json
{
    "matches": [
        {
            "requirement_id": "REQ-001",
            "requirement_text": "Brief requirement",
            "matched_sections": ["Section 3.1", "Section 4.2"],
            "match_quality": "strong|moderate|weak|none",
            "notes": "Additional context"
        }
    ],
    "unmatched_requirements": ["REQ-005", "REQ-006"],
    "coverage_percentage": 85
}
```"""

REQUIREMENT_MATCHING_PROMPT = (PromptBuilder()
    .name("requirement_matching")
    .version("1.0.0")
    .description("Match proposal sections to tender requirements")
    .system("You are analyzing proposal structure against requirements.")
    .template(REQUIREMENT_MATCHING_TEMPLATE)
    .add_variables(["tender_requirements", "proposal_sections"])
    .build()
)
