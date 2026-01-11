#!/usr/bin/env python
"""
AI Engine Test Script

Quick test to verify AI functionality is working correctly.
Run this from the backend directory:
    python test_ai.py
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from apps.ai_engine.services.factory import get_ai_provider
from apps.ai_engine.prompts.registry import get_prompt, list_available_prompts


def test_configuration():
    """Test AI configuration."""
    print("\n" + "="*60)
    print("1. TESTING CONFIGURATION")
    print("="*60)
    
    print(f"\n✓ AI Enabled: {settings.AI_FEATURES.get('enabled', False)}")
    print(f"✓ Default Provider: {settings.AI_DEFAULT_PROVIDER}")
    print(f"✓ Default Model: {settings.AI_DEFAULT_MODEL}")
    
    # Check API keys
    providers = settings.AI_PROVIDERS
    for provider_name, config in providers.items():
        api_key = config.get('api_key', '')
        if api_key:
            masked_key = api_key[:8] + '...' + api_key[-4:] if len(api_key) > 12 else '***'
            print(f"✓ {provider_name.capitalize()} API Key: {masked_key}")
        else:
            print(f"✗ {provider_name.capitalize()} API Key: Not set")


def test_prompts():
    """Test prompt registry."""
    print("\n" + "="*60)
    print("2. TESTING PROMPT REGISTRY")
    print("="*60)
    
    prompts = list_available_prompts()
    print(f"\n✓ Registered Prompts: {len(prompts)}")
    
    for prompt in prompts:
        print(f"  - {prompt['name']} (v{prompt['active_version']}) [{prompt['source']}]")
    
    # Test critical prompts
    critical_prompts = ['project_analysis', 'compliance_check', 'proposal_generation']
    for prompt_name in critical_prompts:
        try:
            prompt = get_prompt(prompt_name)
            print(f"✓ {prompt_name}: Available")
        except Exception as e:
            print(f"✗ {prompt_name}: Missing or error - {e}")


def test_provider():
    """Test AI provider."""
    print("\n" + "="*60)
    print("3. TESTING AI PROVIDER")
    print("="*60)
    
    try:
        provider = get_ai_provider()
        print(f"\n✓ Provider Type: {provider.provider_type.value}")
        print(f"✓ Default Model: {provider.default_model}")
        
        # Test simple generation
        print("\n📝 Testing simple generation...")
        test_prompt = "Say 'Hello, AI is working!' in one short sentence."
        
        response = provider.generate(
            prompt=test_prompt,
            max_tokens=50,
            temperature=0.3
        )
        
        print(f"✓ Generation Success!")
        print(f"  Response: {response.content}")
        print(f"  Tokens Used: {response.total_tokens} ({response.input_tokens} in, {response.output_tokens} out)")
        print(f"  Model: {response.model}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Provider Test Failed: {e}")
        print(f"  Error Type: {type(e).__name__}")
        import traceback
        print(f"  Traceback: {traceback.format_exc()}")
        return False


def test_database():
    """Test database models."""
    print("\n" + "="*60)
    print("4. TESTING DATABASE MODELS")
    print("="*60)
    
    try:
        from apps.ai_engine.models import AIRequest, AIResponse, PromptVersion
        
        # Check tables exist
        request_count = AIRequest.objects.count()
        response_count = AIResponse.objects.count()
        prompt_count = PromptVersion.objects.count()
        
        print(f"\n✓ AIRequest table: {request_count} records")
        print(f"✓ AIResponse table: {response_count} records")
        print(f"✓ PromptVersion table: {prompt_count} records")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Database Test Failed: {e}")
        print("  Run migrations: python manage.py migrate ai_engine")
        return False


def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("AI ENGINE TEST SUITE")
    print("="*60)
    
    # Run tests
    test_configuration()
    test_prompts()
    provider_ok = test_provider()
    db_ok = test_database()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    if provider_ok and db_ok:
        print("\n✅ All tests passed! AI engine is ready to use.")
        print("\nNext steps:")
        print("  1. Test with a real project: Use /api/v1/ai/project/{id}/analyze/")
        print("  2. Check health endpoint: /api/v1/ai/health/")
        print("  3. Review integration guide: AI_INTEGRATION_GUIDE.md")
    else:
        print("\n⚠️  Some tests failed. Please fix the issues above.")
        print("\nCommon fixes:")
        print("  - Run migrations: python manage.py migrate")
        print("  - Check .env file has valid API keys")
        print("  - Verify network connectivity")
    
    print("\n" + "="*60 + "\n")


if __name__ == '__main__':
    main()
