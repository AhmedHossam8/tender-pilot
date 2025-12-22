"""
Text Generation Prompt Templates

These prompts are used for generating text content using AI.
"""

from .base import PromptTemplate


# =============================================================================
# TEXT GENERATION PROMPT
# =============================================================================

TEXT_GENERATION_SYSTEM_PROMPT = """You are a skilled writer and content creator. Your task is to generate high-quality, coherent, and contextually appropriate text based on the provided input. Focus on:
1. Clear and engaging writing
2. Proper grammar and structure
3. Relevance to the input topic
4. Appropriate tone and style

Generate text that is well-structured, informative, and meets the user's needs."""


TEXT_GENERATION_PROMPT = PromptTemplate(
    name="text_generation",
    version="1.0.0",
    template_text="""Generate text based on the following input and requirements:

## INPUT TEXT
${input_text}

## INSTRUCTIONS
Please generate appropriate text content based on the input above. Make it coherent, well-structured, and relevant to the topic.

## OUTPUT
Provide the generated text directly, without additional commentary.""",
    variables=["input_text"],
    description="Basic text generation prompt",
    system_prompt=TEXT_GENERATION_SYSTEM_PROMPT
)