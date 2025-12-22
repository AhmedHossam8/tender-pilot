"""
Summarization Prompt Templates

These prompts are used for summarizing text content using AI.
"""

from .base import PromptTemplate


# =============================================================================
# SUMMARIZATION PROMPT
# =============================================================================

SUMMARIZATION_SYSTEM_PROMPT = """You are an expert at creating concise, accurate summaries. Your task is to:
1. Extract the most important information
2. Maintain key facts and details
3. Preserve the original meaning and intent
4. Create summaries that are clear and well-structured

Focus on brevity while ensuring all critical information is retained."""


SUMMARIZATION_PROMPT = PromptTemplate(
    name="summarization",
    version="1.0.0",
    template_text="""Please provide a concise summary of the following text:

## TEXT TO SUMMARIZE
${text}

## SUMMARY REQUIREMENTS
- Capture the main points and key information
- Maintain factual accuracy
- Keep the summary between 100-300 words
- Use clear, concise language
- Preserve important dates, numbers, and specific details

## SUMMARY""",
    variables=["text"],
    description="Text summarization prompt",
    system_prompt=SUMMARIZATION_SYSTEM_PROMPT
)