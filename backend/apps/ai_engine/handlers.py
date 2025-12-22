from .services import get_ai_provider
from .prompts.registry import PromptRegistry
from .services.base import AIGenerationConfig


class AIRequestHandler:
    SUPPORTED_TASKS = {
        "text-generation": "handle_text_generation",
        "summarization": "handle_summarization",
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