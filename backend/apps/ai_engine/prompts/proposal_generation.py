"""
Proposal Generation Prompt Templates

These prompts are used for generating proposal outlines,
content suggestions, and writing assistance.
"""

from .base import PromptTemplate, PromptBuilder


# =============================================================================
# PROPOSAL OUTLINE GENERATION
# =============================================================================

PROPOSAL_OUTLINE_SYSTEM_PROMPT = """You are an expert proposal writer with decades of experience in winning government and corporate contracts. Your role is to:
1. Create comprehensive, well-structured proposal outlines
2. Ensure all tender requirements are addressed
3. Suggest compelling content strategies
4. Provide guidance on differentiating the proposal

Your outlines should be professional, complete, and tailored to maximize win probability."""


PROPOSAL_OUTLINE_TEMPLATE = """Create a detailed proposal outline based on the following tender.

## TENDER INFORMATION
**Title:** ${tender_title}
**Summary:** ${tender_summary}

## KEY REQUIREMENTS
${tender_requirements}

## EVALUATION CRITERIA
${evaluation_criteria}

## COMPANY CONTEXT (if provided)
${company_context}

## TASK
Generate a comprehensive proposal outline that:
1. Addresses all tender requirements
2. Aligns with evaluation criteria
3. Includes recommended page counts
4. Provides content guidance for each section

Respond with a JSON object:
```json
{
    "proposal_title": "Suggested proposal title",
    "executive_summary_guidance": "Key points to cover in executive summary",
    "total_estimated_pages": 25,
    "sections": [
        {
            "number": "1",
            "title": "Section Title",
            "description": "What this section should cover",
            "suggested_pages": 2,
            "key_points": ["Point 1", "Point 2"],
            "requirements_addressed": ["REQ-001", "REQ-002"],
            "evaluation_criteria_addressed": ["Technical capability"],
            "content_tips": "Specific tips for writing this section",
            "subsections": [
                {
                    "number": "1.1",
                    "title": "Subsection Title",
                    "description": "Subsection content guidance"
                }
            ]
        }
    ],
    "appendices_recommended": [
        {
            "title": "Appendix title",
            "purpose": "Why this appendix is recommended",
            "content": "What to include"
        }
    ],
    "differentiation_opportunities": [
        {
            "area": "Area to differentiate",
            "strategy": "How to stand out"
        }
    ],
    "win_themes": ["Theme 1", "Theme 2"],
    "risks_to_address": ["Risk that should be addressed in proposal"]
}
```"""


PROPOSAL_OUTLINE_PROMPT = (PromptBuilder()
    .name("proposal_outline")
    .version("1.0.0")
    .description("Generate comprehensive proposal outline from tender requirements")
    .system(PROPOSAL_OUTLINE_SYSTEM_PROMPT)
    .template(PROPOSAL_OUTLINE_TEMPLATE)
    .add_variables([
        "tender_title",
        "tender_summary",
        "tender_requirements",
        "evaluation_criteria",
        "company_context",
    ])
    .output_schema({
        "proposal_title": str,
        "sections": list,
        "total_estimated_pages": int,
    })
    .build()
)


# =============================================================================
# SECTION CONTENT SUGGESTION
# =============================================================================

SECTION_CONTENT_TEMPLATE = """Suggest content for a proposal section.

## SECTION INFORMATION
**Section Title:** ${section_title}
**Section Purpose:** ${section_purpose}

## REQUIREMENTS TO ADDRESS
${requirements_to_address}

## COMPANY CAPABILITIES (if provided)
${company_capabilities}

Generate detailed content suggestions:
```json
{
    "section_title": "${section_title}",
    "opening_paragraph": "Suggested opening paragraph",
    "key_messages": ["Message 1", "Message 2"],
    "content_blocks": [
        {
            "heading": "Subsection heading",
            "content_guidance": "What to write",
            "evidence_to_include": "What proof points to add",
            "word_count_suggestion": 200
        }
    ],
    "graphics_recommended": [
        {
            "type": "chart|diagram|table|image",
            "description": "What the graphic should show",
            "purpose": "Why this graphic helps"
        }
    ],
    "compliance_checklist": ["Item that must be included"],
    "closing_paragraph": "Suggested closing paragraph",
    "common_mistakes_to_avoid": ["Mistake 1"]
}
```"""


SECTION_CONTENT_PROMPT = (PromptBuilder()
    .name("section_content")
    .version("1.0.0")
    .description("Generate content suggestions for proposal sections")
    .system("You are a proposal writing expert. Provide specific, actionable content guidance.")
    .template(SECTION_CONTENT_TEMPLATE)
    .add_variables([
        "section_title",
        "section_purpose",
        "requirements_to_address",
        "company_capabilities",
    ])
    .build()
)


# =============================================================================
# EXECUTIVE SUMMARY GENERATOR
# =============================================================================

EXECUTIVE_SUMMARY_TEMPLATE = """Generate an executive summary for a proposal.

## TENDER OVERVIEW
${tender_summary}

## KEY PROPOSAL HIGHLIGHTS
${proposal_highlights}

## COMPANY STRENGTHS
${company_strengths}

Write a compelling executive summary:
```json
{
    "executive_summary": "Full text of executive summary (300-500 words)",
    "key_themes": ["Theme 1", "Theme 2"],
    "value_proposition": "Core value proposition statement",
    "call_to_action": "Closing statement"
}
```

The executive summary should:
- Hook the reader immediately
- Summarize the value proposition
- Highlight key differentiators
- Build confidence in the bidder"""


EXECUTIVE_SUMMARY_PROMPT = (PromptBuilder()
    .name("executive_summary")
    .version("1.0.0")
    .description("Generate compelling executive summary")
    .system("You are an expert at writing winning executive summaries.")
    .template(EXECUTIVE_SUMMARY_TEMPLATE)
    .add_variables([
        "tender_summary",
        "proposal_highlights",
        "company_strengths",
    ])
    .build()
)
