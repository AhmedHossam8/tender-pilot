"""
AI prompt templates for matching service providers to projects.

This module contains the prompt templates used by the AI Matching Service
to calculate compatibility scores between projects and service providers.
"""


# Prompt template for calculating match score between project and provider
MATCH_SCORE_PROMPT = """You are an expert marketplace matching system. Analyze the compatibility between a project and a service provider.
Always respond using {language} for all string fields (recommendation, reasoning, assessments).

PROJECT DETAILS:
Title: {project_title}
Description: {project_description}
Required Skills: {required_skills}
Budget Range: ${budget_min} - ${budget_max}
Timeline: {deadline}
Category: {category}

SERVICE PROVIDER PROFILE:
Name: {provider_name}
Bio: {provider_bio}
Skills: {provider_skills}
Hourly Rate: ${hourly_rate}
Experience Level: {experience_level}
Completed Projects: {completed_projects}
Average Rating: {average_rating}/5
Languages: {languages}
Location: {location}

Previous Work Summary:
{portfolio_summary}

ANALYSIS TASK:
Provide a detailed compatibility analysis with:
1. Match Score (0-100): Overall compatibility score
2. Matching Skills: List skills that align with project requirements
3. Skill Gaps: Any required skills the provider may lack
4. Budget Compatibility: Whether provider's rate fits project budget
5. Experience Assessment: How provider's experience matches project complexity
6. Potential Concerns: Any red flags or concerns
7. Recommendation: Whether this is a good match (Strong Match, Good Match, Fair Match, Poor Match)
8. Reasoning: Brief explanation of the recommendation

Return your analysis in the following JSON format:
{{
    "match_score": <0-100>,
    "matching_skills": ["skill1", "skill2", ...],
    "skill_gaps": ["missing_skill1", ...],
    "budget_compatible": true/false,
    "budget_assessment": "explanation of budget fit",
    "experience_assessment": "evaluation of experience level",
    "potential_concerns": ["concern1", "concern2", ...],
    "recommendation": "Strong Match|Good Match|Fair Match|Poor Match",
    "reasoning": "Brief explanation of why this match score was given"
}}"""


# Prompt template for ranking multiple providers
RANK_PROVIDERS_PROMPT = """You are an expert marketplace matching system. Rank these service providers for the given project.

PROJECT DETAILS:
Title: {project_title}
Description: {project_description}
Required Skills: {required_skills}
Budget Range: ${budget_min} - ${budget_max}
Timeline: {deadline}
Priority: {priority_notes}

SERVICE PROVIDERS:
{providers_list}

RANKING TASK:
Analyze each provider and rank them from best to worst match. Consider:
- Skills match (most important)
- Experience and ratings
- Budget compatibility
- Availability and timeline fit
- Portfolio relevance

Return a JSON array of provider rankings:
[
    {{
        "provider_id": <id>,
        "rank": 1,
        "match_score": <0-100>,
        "key_strengths": ["strength1", "strength2"],
        "concerns": ["concern1", ...],
        "recommendation_summary": "One sentence why this provider ranks here"
    }},
    ...
]"""


# Prompt template for generating cover letter suggestions
BID_COVER_LETTER_PROMPT = """You are an expert bid writing assistant. Help the service provider write a compelling cover letter for this project.

PROJECT DETAILS:
Title: {project_title}
Description: {project_description}
Required Skills: {required_skills}
Budget Range: ${budget_min} - ${budget_max}

SERVICE PROVIDER PROFILE:
Name: {provider_name}
Bio: {provider_bio}
Skills: {provider_skills}
Experience: {experience_summary}
Relevant Past Projects: {relevant_projects}

TASK:
Write a professional, compelling cover letter (300-500 words) that:
1. Opens with a strong hook that shows understanding of the project
2. Highlights the provider's relevant skills and experience
3. Mentions 2-3 specific past projects that demonstrate capability
4. Addresses how the provider will approach this project
5. Shows enthusiasm without being overly sales-y
6. Ends with a clear call to action

The tone should be:
- Professional but personable
- Confident but not arrogant
- Specific and detailed, not generic
- Focused on client value, not just provider credentials

Generate the cover letter in plain text format."""


# Prompt template for suggesting competitive pricing
BID_PRICING_SUGGESTION_PROMPT = """You are a pricing strategy expert for freelance marketplaces. Suggest a competitive price for this bid.

PROJECT DETAILS:
Title: {project_title}
Description: {project_description}
Required Skills: {required_skills}
Client Budget Range: ${budget_min} - ${budget_max}
Estimated Timeline: {timeline_days} days
Complexity: {complexity_level}

SERVICE PROVIDER:
Hourly Rate: ${hourly_rate}
Experience Level: {experience_level}
Average Project Value: ${average_project_value}
Win Rate: {win_rate}%

MARKET DATA:
Similar Projects Average Price: ${market_average}
Price Range for This Category: ${market_min} - ${market_max}
Competitive Bids Count: {competitor_count}

TASK:
Suggest a competitive bid amount that:
1. Fits within or slightly below client budget if possible
2. Reflects provider's experience and hourly rate
3. Is competitive with market rates
4. Maximizes chance of winning while maintaining value

Return analysis in JSON format:
{{
    "suggested_amount": <dollar amount>,
    "pricing_strategy": "explanation of pricing approach",
    "min_acceptable": <minimum the provider should accept>,
    "max_justifiable": <maximum that's justifiable>,
    "win_probability": "High|Medium|Low",
    "justification": "Why this price is recommended",
    "alternative_approaches": ["approach1", "approach2"]
}}"""


# Prompt template for improving existing bids
BID_IMPROVEMENT_PROMPT = """You are a bid optimization expert. Review this bid and suggest improvements.

CURRENT BID:
Cover Letter:
{current_cover_letter}

Proposed Amount: ${proposed_amount}
Timeline: {proposed_timeline} days
Milestones: {milestones}

PROJECT REQUIREMENTS:
{project_requirements}

TASK:
Analyze the bid and provide specific improvement suggestions for:
1. Cover letter quality and persuasiveness
2. Pricing competitiveness
3. Timeline realism
4. Milestone structure
5. Overall presentation

Return suggestions in JSON format:
{{
    "overall_score": <0-100>,
    "cover_letter_improvements": ["suggestion1", "suggestion2", ...],
    "pricing_feedback": "assessment of pricing strategy",
    "timeline_feedback": "is timeline realistic?",
    "milestone_suggestions": ["suggestion1", ...],
    "strengths": ["what's good about this bid"],
    "weaknesses": ["what needs improvement"],
    "priority_changes": ["most important changes to make"]
}}"""


# Prompt template for generating smart questions
SMART_QUESTIONS_PROMPT = """You are a project clarification expert. Generate intelligent questions that a service provider should ask the client.

PROJECT DETAILS:
Title: {project_title}
Description: {project_description}
Requirements: {requirements}

TASK:
Generate 3-5 smart, relevant questions that:
1. Clarify ambiguous requirements
2. Uncover hidden needs or expectations
3. Demonstrate expertise and thoroughness
4. Help scope the project accurately
5. Show proactive thinking

Return questions in JSON format:
{{
    "questions": [
        {{
            "question": "the question text",
            "purpose": "why this question matters",
            "category": "technical|scope|timeline|budget|process"
        }},
        ...
    ]
}}"""


def get_match_score_prompt(project_data: dict, provider_data: dict, language: str = 'English') -> str:
    """
    Generate the complete prompt for calculating match score.
    
    Args:
        project_data: Dictionary containing project information
        provider_data: Dictionary containing provider profile information
        
    Returns:
        Formatted prompt string ready for AI model
    """
    return MATCH_SCORE_PROMPT.format(
        project_title=project_data.get('title', 'Untitled Project'),
        project_description=project_data.get('description', 'No description provided'),
        required_skills=', '.join(project_data.get('required_skills', [])),
        budget_min=project_data.get('budget_min', 0),
        budget_max=project_data.get('budget_max', 0),
        deadline=project_data.get('deadline', 'Not specified'),
        category=project_data.get('category', 'General'),
        provider_name=provider_data.get('name', 'Unknown'),
        provider_bio=provider_data.get('bio', 'No bio provided'),
        provider_skills=', '.join(provider_data.get('skills', [])),
        hourly_rate=provider_data.get('hourly_rate', 0),
        experience_level=provider_data.get('experience_level', 'Not specified'),
        completed_projects=provider_data.get('completed_projects', 0),
        average_rating=provider_data.get('average_rating', 0),
        languages=', '.join(provider_data.get('languages', [])),
        location=provider_data.get('location', 'Not specified'),
        portfolio_summary=provider_data.get('portfolio_summary', 'No portfolio available'),
        language=language or 'English'
    )


def get_rank_providers_prompt(project_data: dict, providers_list: str) -> str:
    """
    Generate the complete prompt for ranking providers.
    
    Args:
        project_data: Dictionary containing project information
        providers_list: Formatted string of provider profiles
        
    Returns:
        Formatted prompt string ready for AI model
    """
    return RANK_PROVIDERS_PROMPT.format(
        project_title=project_data.get('title', 'Untitled Project'),
        project_description=project_data.get('description', 'No description provided'),
        required_skills=', '.join(project_data.get('required_skills', [])),
        budget_min=project_data.get('budget_min', 0),
        budget_max=project_data.get('budget_max', 0),
        deadline=project_data.get('deadline', 'Not specified'),
        priority_notes=project_data.get('priority_notes', 'Standard priority'),
        providers_list=providers_list
    )


def get_cover_letter_prompt(project_data: dict, provider_data: dict) -> str:
    """
    Generate the complete prompt for cover letter generation.
    
    Args:
        project_data: Dictionary containing project information
        provider_data: Dictionary containing provider profile information
        
    Returns:
        Formatted prompt string ready for AI model
    """
    return BID_COVER_LETTER_PROMPT.format(
        project_title=project_data.get('title', 'Untitled Project'),
        project_description=project_data.get('description', 'No description provided'),
        required_skills=', '.join(project_data.get('required_skills', [])),
        budget_min=project_data.get('budget_min', 0),
        budget_max=project_data.get('budget_max', 0),
        provider_name=provider_data.get('name', 'Unknown'),
        provider_bio=provider_data.get('bio', 'No bio provided'),
        provider_skills=', '.join(provider_data.get('skills', [])),
        experience_summary=provider_data.get('experience_summary', 'No experience summary'),
        relevant_projects=provider_data.get('relevant_projects', 'No relevant projects listed')
    )


def get_pricing_suggestion_prompt(project_data: dict, provider_data: dict, market_data: dict) -> str:
    """
    Generate the complete prompt for pricing suggestions.
    
    Args:
        project_data: Dictionary containing project information
        provider_data: Dictionary containing provider profile information
        market_data: Dictionary containing market pricing information
        
    Returns:
        Formatted prompt string ready for AI model
    """
    return BID_PRICING_SUGGESTION_PROMPT.format(
        project_title=project_data.get('title', 'Untitled Project'),
        project_description=project_data.get('description', 'No description provided'),
        required_skills=', '.join(project_data.get('required_skills', [])),
        budget_min=project_data.get('budget_min', 0),
        budget_max=project_data.get('budget_max', 0),
        timeline_days=project_data.get('timeline_days', 30),
        complexity_level=project_data.get('complexity', 'Medium'),
        hourly_rate=provider_data.get('hourly_rate', 0),
        experience_level=provider_data.get('experience_level', 'Intermediate'),
        average_project_value=provider_data.get('average_project_value', 0),
        win_rate=provider_data.get('win_rate', 0),
        market_average=market_data.get('average', 0),
        market_min=market_data.get('min', 0),
        market_max=market_data.get('max', 0),
        competitor_count=market_data.get('competitor_count', 0)
    )
