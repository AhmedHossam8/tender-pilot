"""
Prompt Template Base Classes

This module provides the foundation for creating and managing
reusable, versioned prompt templates for AI interactions.
"""

import re
from string import Template
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class PromptTemplate:
    """
    A reusable prompt template with variable interpolation support.
    
    Uses Python's string.Template for safe variable substitution.
    Variables are specified using ${variable_name} syntax.
    
    Example:
        template = PromptTemplate(
            name="tender_analysis",
            version="1.0.0",
            template_text="Analyze this tender: ${tender_title}",
            variables=["tender_title"],
        )
        prompt = template.render(tender_title="Highway Construction")
    """
    
    name: str
    version: str
    template_text: str
    description: str = ""
    variables: List[str] = field(default_factory=list)
    system_prompt: Optional[str] = None
    output_schema: Optional[Dict[str, Any]] = None
    created_at: datetime = field(default_factory=datetime.now)
    
    def __post_init__(self):
        """Validate template on creation."""
        self._validate_variables()
    
    def _validate_variables(self) -> None:
        """Ensure all declared variables exist in template."""
        # Find all variables in template
        pattern = r'\$\{(\w+)\}'
        found_vars = set(re.findall(pattern, self.template_text))
        declared_vars = set(self.variables)
        
        # Check for undeclared variables
        undeclared = found_vars - declared_vars
        if undeclared:
            # Auto-add undeclared variables
            self.variables.extend(list(undeclared))
    
    def render(self, **kwargs) -> str:
        """
        Render the template with provided variables.
        
        Args:
            **kwargs: Variable values to substitute
            
        Returns:
            Rendered prompt string
            
        Raises:
            KeyError: If a required variable is not provided
        """
        # Check for missing variables
        missing = set(self.variables) - set(kwargs.keys())
        if missing:
            raise KeyError(f"Missing required variables: {missing}")
        
        template = Template(self.template_text)
        return template.safe_substitute(**kwargs)
    
    def get_full_prompt(self, **kwargs) -> Dict[str, str]:
        """
        Get the complete prompt with system prompt if available.
        
        Args:
            **kwargs: Variable values to substitute
            
        Returns:
            Dictionary with 'system' and 'user' prompts
        """
        user_prompt = self.render(**kwargs)
        
        result = {"user": user_prompt}
        
        if self.system_prompt:
            system_template = Template(self.system_prompt)
            result["system"] = system_template.safe_substitute(**kwargs)
        
        return result
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """
        Validate AI output against expected schema.
        
        Args:
            output: The AI response parsed as a dictionary
            
        Returns:
            True if valid, False otherwise
        """
        if not self.output_schema:
            return True
        
        # Basic schema validation
        for key, expected_type in self.output_schema.items():
            if key not in output:
                return False
            if not isinstance(output[key], expected_type):
                return False
        
        return True


@dataclass
class PromptChain:
    """
    A chain of prompts for multi-step AI interactions.
    
    Useful for complex tasks that require multiple AI calls,
    where output from one step becomes input for the next.
    """
    
    name: str
    steps: List[PromptTemplate]
    description: str = ""
    
    def get_step(self, index: int) -> PromptTemplate:
        """Get a specific step in the chain."""
        return self.steps[index]
    
    def __len__(self) -> int:
        return len(self.steps)


class PromptBuilder:
    """
    Fluent builder for creating prompt templates.
    
    Example:
        template = (PromptBuilder()
            .name("tender_analysis")
            .version("1.0.0")
            .system("You are an expert tender analyst.")
            .template("Analyze: ${content}")
            .add_variable("content")
            .build())
    """
    
    def __init__(self):
        self._name: str = ""
        self._version: str = "1.0.0"
        self._description: str = ""
        self._template_text: str = ""
        self._system_prompt: Optional[str] = None
        self._variables: List[str] = []
        self._output_schema: Optional[Dict[str, Any]] = None
    
    def name(self, name: str) -> 'PromptBuilder':
        self._name = name
        return self
    
    def version(self, version: str) -> 'PromptBuilder':
        self._version = version
        return self
    
    def description(self, description: str) -> 'PromptBuilder':
        self._description = description
        return self
    
    def template(self, template_text: str) -> 'PromptBuilder':
        self._template_text = template_text
        return self
    
    def system(self, system_prompt: str) -> 'PromptBuilder':
        self._system_prompt = system_prompt
        return self
    
    def add_variable(self, variable: str) -> 'PromptBuilder':
        if variable not in self._variables:
            self._variables.append(variable)
        return self
    
    def add_variables(self, variables: List[str]) -> 'PromptBuilder':
        for var in variables:
            self.add_variable(var)
        return self
    
    def output_schema(self, schema: Dict[str, Any]) -> 'PromptBuilder':
        self._output_schema = schema
        return self
    
    def build(self) -> PromptTemplate:
        """Build and return the PromptTemplate."""
        if not self._name:
            raise ValueError("Prompt template must have a name")
        if not self._template_text:
            raise ValueError("Prompt template must have template text")
        
        return PromptTemplate(
            name=self._name,
            version=self._version,
            description=self._description,
            template_text=self._template_text,
            system_prompt=self._system_prompt,
            variables=self._variables,
            output_schema=self._output_schema,
        )
