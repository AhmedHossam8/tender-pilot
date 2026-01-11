"""
Project Analysis Prompt Templates

These prompts are used for analyzing project documents,
extracting key information, and providing AI-powered insights.
"""

from .base import PromptTemplate, PromptBuilder


# =============================================================================
# PROJECT ANALYSIS PROMPT
# =============================================================================

PROJECT_ANALYSIS_SYSTEM_PROMPT = """You are an expert project analyst with extensive experience in procurement, contract analysis, and project management. Your role is to:
1. Carefully analyze project documents and requirements
2. Extract key requirements, deadlines, and deliverables
3. Identify important terms, conditions, and constraints
4. Assess complexity and provide actionable recommendations

Always provide structured, accurate, and actionable analysis. Be thorough but concise."""


PROJECT_ANALYSIS_TEMPLATE = """Analyze the following project and provide a comprehensive analysis.

## PROJECT INFORMATION
**Title:** ${project_title}
**Project ID:** ${project_id}
**Budget:** ${budget}
**Required Skills:** ${skills}
**Analysis Depth:** ${analysis_depth}

## PROJECT CONTENT AND DOCUMENTS
${content}

## ANALYSIS REQUIREMENTS
Please provide your analysis in the following JSON format:

```json
{
    "summary": "A brief 2-3 sentence summary of the project",
    "key_requirements": [
        {
            "requirement": "Description of requirement",
            "category": "technical|financial|administrative|legal|qualification",
            "priority": "critical|high|medium|low",
            "is_mandatory": true
        }
    ],
    "deadline_info": {
        "submission_deadline": "Date/time if mentioned",
        "clarification_deadline": "Date/time if mentioned",
        "project_start_date": "Date if mentioned",
        "project_duration": "Duration if mentioned",
        "milestones": ["List of key milestones"]
    },
    "estimated_complexity": "low|medium|high",
    "complexity_factors": ["List of factors contributing to complexity"],
    "estimated_value": "Project value or budget",
    "eligibility_criteria": ["List of eligibility requirements"],
    "required_documents": ["List of documents required for submission"],
    "required_qualifications": ["List of qualifications or certifications needed"],
    "evaluation_criteria": [
        {
            "criterion": "Name of criterion",
            "weight": "Percentage or points if mentioned",
            "description": "Brief description"
        }
    ],
    "technical_requirements": [
        {
            "requirement": "Technical requirement description",
            "importance": "critical|high|medium|low",
            "complexity": "low|medium|high"
        }
    ],
    "deliverables": ["List of expected deliverables"],
    "risks_and_concerns": [
        {
            "risk": "Description of risk or concern",
            "severity": "critical|high|medium|low",
            "mitigation": "Suggested mitigation strategy"
        }
    ],
    "recommended_actions": [
        {
            "action": "Recommended action",
            "priority": "immediate|short-term|before-submission",
            "reason": "Why this action is recommended",
            "effort": "low|medium|high"
        }
    ],
    "keywords": ["relevant", "keywords", "for", "categorization"],
    "strengths": ["Project strengths or opportunities"],
    "challenges": ["Project challenges or obstacles"],
    "bidding_strategy": "Recommended strategy for bidding or proposal",
    "confidence_level": 85
}
```

Ensure your analysis is thorough and captures all critical information from the project documents."""


# Build the template using the builder
PROJECT_ANALYSIS_PROMPT = (
    PromptBuilder()
    .name("project_analysis")
    .version("1.0.0")
    .description("Comprehensive analysis of project documents and requirements")
    .system(PROJECT_ANALYSIS_SYSTEM_PROMPT)
    .template(PROJECT_ANALYSIS_TEMPLATE)
    .add_variables([
        "project_title",
        "project_id",
        "budget",
        "skills",
        "content",
        "analysis_depth",
    ])
    .output_schema({
        "summary": str,
        "key_requirements": list,
        "deadline_info": dict,
        "estimated_complexity": str,
        "recommended_actions": list,
        "confidence_level": float,
    })
    .build()
)


# =============================================================================
# QUICK PROJECT SUMMARY PROMPT (Lightweight version)
# =============================================================================

QUICK_PROJECT_SUMMARY_TEMPLATE = """Provide a brief summary of this project in 3-4 sentences:

**Title:** ${project_title}
**Budget:** ${budget}
**Content:**
${content}

Respond with a JSON object:
```json
{
    "summary": "Brief summary",
    "main_objective": "Primary objective of the project",
    "estimated_complexity": "low|medium|high",
    "key_deadline": "Most important deadline if mentioned",
    "budget_assessment": "Assessment of budget adequacy",
    "confidence_score": 85
}
```"""

QUICK_PROJECT_SUMMARY_PROMPT = (
    PromptBuilder()
    .name("quick_project_summary")
    .version("1.0.0")
    .description("Quick summary for project overview")
    .system("You are a project analyst. Provide concise, accurate summaries.")
    .template(QUICK_PROJECT_SUMMARY_TEMPLATE)
    .add_variables(["project_title", "budget", "content"])
    .build()
)


# =============================================================================
# PROJECT REQUIREMENT EXTRACTION PROMPT
# =============================================================================

PROJECT_REQUIREMENT_EXTRACTION_TEMPLATE = """Extract all requirements from the following project documents.

## PROJECT CONTENT
${content}

Categorize each requirement and respond with a JSON array:
```json
{
    "requirements": [
        {
            "id": "REQ-001",
            "description": "Clear description of the requirement",
            "category": "technical|financial|administrative|legal|qualification|deliverable",
            "is_mandatory": true,
            "source_text": "Original text from document",
            "compliance_difficulty": "easy|moderate|difficult",
            "estimated_effort": "low|medium|high"
        }
    ],
    "total_requirements": 0,
    "mandatory_count": 0,
    "optional_count": 0,
    "categories_summary": {
        "technical": 0,
        "financial": 0,
        "administrative": 0,
        "legal": 0,
        "qualification": 0,
        "deliverable": 0
    }
}
```

Be thorough and capture ALL requirements, both explicit and implicit."""

PROJECT_REQUIREMENT_EXTRACTION_PROMPT = (
    PromptBuilder()
    .name("project_requirement_extraction")
    .version("1.0.0")
    .description("Extract and categorize all project requirements")
    .system("You are a meticulous project analyst specializing in requirement extraction.")
    .template(PROJECT_REQUIREMENT_EXTRACTION_TEMPLATE)
    .add_variable("content")
    .build()
)
