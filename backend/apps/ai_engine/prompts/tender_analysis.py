"""
Tender Analysis Prompt Templates

These prompts are used for analyzing tender documents,
extracting key information, and providing AI-powered insights.
"""

from .base import PromptTemplate, PromptBuilder


# =============================================================================
# TENDER ANALYSIS PROMPT
# =============================================================================

TENDER_ANALYSIS_SYSTEM_PROMPT = """You are an expert tender analyst with extensive experience in procurement and contract analysis. Your role is to:
1. Carefully analyze tender documents
2. Extract key requirements and deadlines
3. Identify important terms and conditions
4. Assess complexity and provide actionable recommendations

Always provide structured, accurate, and actionable analysis. Be thorough but concise."""


TENDER_ANALYSIS_TEMPLATE = """Analyze the following tender document and provide a comprehensive analysis.

## TENDER INFORMATION
**Title:** ${tender_title}
**Reference Number:** ${tender_reference}
**Issuing Organization:** ${issuing_organization}

## TENDER CONTENT
${tender_content}

## ANALYSIS REQUIREMENTS
Please provide your analysis in the following JSON format:

```json
{
    "summary": "A brief 2-3 sentence summary of the tender",
    "key_requirements": [
        {
            "requirement": "Description of requirement",
            "category": "technical|financial|administrative|legal",
            "priority": "critical|high|medium|low"
        }
    ],
    "deadline_info": {
        "submission_deadline": "Date/time if mentioned",
        "clarification_deadline": "Date/time if mentioned",
        "contract_start_date": "Date if mentioned",
        "contract_duration": "Duration if mentioned"
    },
    "estimated_complexity": "low|medium|high",
    "complexity_factors": ["List of factors contributing to complexity"],
    "estimated_value": "Contract value if mentioned or estimated",
    "eligibility_criteria": ["List of eligibility requirements"],
    "required_documents": ["List of documents required for submission"],
    "evaluation_criteria": [
        {
            "criterion": "Name of criterion",
            "weight": "Percentage or points if mentioned"
        }
    ],
    "risks_and_concerns": ["Potential risks or concerns identified"],
    "recommended_actions": [
        {
            "action": "Recommended action",
            "priority": "immediate|short-term|before-submission",
            "reason": "Why this action is recommended"
        }
    ],
    "keywords": ["relevant", "keywords", "for", "categorization"]
}
```

Ensure your analysis is thorough and captures all critical information from the tender document."""


# Build the template using the builder
TENDER_ANALYSIS_PROMPT = (PromptBuilder()
    .name("tender_analysis")
    .version("1.0.0")
    .description("Comprehensive analysis of tender documents")
    .system(TENDER_ANALYSIS_SYSTEM_PROMPT)
    .template(TENDER_ANALYSIS_TEMPLATE)
    .add_variables([
        "tender_title",
        "tender_reference",
        "issuing_organization",
        "tender_content",
    ])
    .output_schema({
        "summary": str,
        "key_requirements": list,
        "deadline_info": dict,
        "estimated_complexity": str,
        "recommended_actions": list,
    })
    .build()
)


# =============================================================================
# QUICK SUMMARY PROMPT (Lightweight version)
# =============================================================================

QUICK_SUMMARY_TEMPLATE = """Provide a brief summary of this tender in 3-4 sentences:

**Title:** ${tender_title}
**Content:**
${tender_content}

Respond with a JSON object:
```json
{
    "summary": "Brief summary",
    "main_objective": "Primary objective of the tender",
    "estimated_complexity": "low|medium|high",
    "key_deadline": "Most important deadline if mentioned"
}
```"""

QUICK_SUMMARY_PROMPT = (PromptBuilder()
    .name("quick_summary")
    .version("1.0.0")
    .description("Quick summary for tender overview")
    .system("You are a tender analyst. Provide concise, accurate summaries.")
    .template(QUICK_SUMMARY_TEMPLATE)
    .add_variables(["tender_title", "tender_content"])
    .build()
)


# =============================================================================
# REQUIREMENT EXTRACTION PROMPT
# =============================================================================

REQUIREMENT_EXTRACTION_TEMPLATE = """Extract all requirements from the following tender document.

## TENDER CONTENT
${tender_content}

Categorize each requirement and respond with a JSON array:
```json
{
    "requirements": [
        {
            "id": "REQ-001",
            "description": "Clear description of the requirement",
            "category": "technical|financial|administrative|legal|qualification",
            "is_mandatory": true,
            "source_text": "Original text from document",
            "compliance_difficulty": "easy|moderate|difficult"
        }
    ],
    "total_requirements": 0,
    "mandatory_count": 0,
    "categories_summary": {
        "technical": 0,
        "financial": 0,
        "administrative": 0,
        "legal": 0,
        "qualification": 0
    }
}
```

Be thorough and capture ALL requirements, both explicit and implicit."""

REQUIREMENT_EXTRACTION_PROMPT = (PromptBuilder()
    .name("requirement_extraction")
    .version("1.0.0")
    .description("Extract and categorize all tender requirements")
    .system("You are a meticulous tender analyst specializing in requirement extraction.")
    .template(REQUIREMENT_EXTRACTION_TEMPLATE)
    .add_variable("tender_content")
    .build()
)
