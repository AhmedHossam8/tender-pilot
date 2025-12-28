"""
AI Engine Sanity Check Script

Automated verification script to test all AI Engine functionality.
Run this to ensure everything is working correctly.

Usage:
    python manage.py shell < apps/ai_engine/scripts/sanity_check.py
    
Or:
    python manage.py runscript ai_engine.scripts.sanity_check
"""

import sys
from decimal import Decimal
from django.conf import settings
from django.contrib.auth import get_user_model


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_header(text):
    """Print section header."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}\n")


def print_test(name, passed, message=""):
    """Print test result."""
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"  {status} - {name}")
    if message:
        color = Colors.YELLOW if not passed else Colors.END
        print(f"         {color}{message}{Colors.END}")


def run_sanity_checks():
    """Run all sanity checks."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}AI Engine Sanity Check{Colors.END}")
    print(f"{Colors.BLUE}Running comprehensive verification...{Colors.END}\n")
    
    results = []
    
    # ========================================================================
    # 1. IMPORTS AND MODULES
    # ========================================================================
    print_header("1. Module Imports")
    
    try:
        from apps.ai_engine.services import get_ai_provider
        from apps.ai_engine.prompts import get_prompt
        from apps.ai_engine.models import AIRequest, AIResponse, AIUsage
        from apps.ai_engine.tracking.usage import AIUsageTracker
        from apps.ai_engine.monitoring import ai_logger, ai_metrics
        from apps.ai_engine.demo import get_demo_response, is_demo_mode
        print_test("Core imports", True)
        results.append(True)
    except ImportError as e:
        print_test("Core imports", False, str(e))
        results.append(False)
        return results
    
    # ========================================================================
    # 2. CONFIGURATION
    # ========================================================================
    print_header("2. Configuration Check")
    
    # Check AI provider config
    try:
        has_providers = hasattr(settings, 'AI_PROVIDERS')
        print_test("AI_PROVIDERS configured", has_providers)
        results.append(has_providers)
        
        if has_providers:
            providers = settings.AI_PROVIDERS
            has_openai = 'openai' in providers
            print_test("OpenAI provider config", has_openai, 
                      f"API key: {'***' + providers.get('openai', {}).get('api_key', '')[-4:] if has_openai else 'Not configured'}")
            results.append(has_openai)
    except Exception as e:
        print_test("Configuration check", False, str(e))
        results.append(False)
    
    # ========================================================================
    # 3. DATABASE MODELS
    # ========================================================================
    print_header("3. Database Models")
    
    try:
        # Check if models are migrated
        request_count = AIRequest.objects.count()
        response_count = AIResponse.objects.count()
        usage_count = AIUsage.objects.count()
        
        print_test("AIRequest model", True, f"{request_count} records")
        print_test("AIResponse model", True, f"{response_count} records")
        print_test("AIUsage model", True, f"{usage_count} records")
        results.extend([True, True, True])
    except Exception as e:
        print_test("Database models", False, str(e))
        results.append(False)
    
    # ========================================================================
    # 4. AI PROVIDER CONNECTIVITY
    # ========================================================================
    print_header("4. AI Provider Connectivity")
    
    try:
        provider = get_ai_provider()
        is_available = provider.is_available()
        print_test("AI provider available", is_available,
                  f"Provider: {provider.provider_type.value}")
        results.append(is_available)
        
        if is_available:
            # Try a simple token count
            try:
                token_count = provider.count_tokens("Hello, world!")
                print_test("Token counting", token_count > 0, 
                          f"'Hello, world!' = {token_count} tokens")
                results.append(token_count > 0)
            except Exception as e:
                print_test("Token counting", False, str(e))
                results.append(False)
    except Exception as e:
        print_test("AI provider", False, str(e))
        results.append(False)
    
    # ========================================================================
    # 5. PROMPTS REGISTRY
    # ========================================================================
    print_header("5. Prompts Registry")
    
    try:
        # Check key prompts
        prompts_to_check = [
            'tender_analysis',
            'compliance_check',
            'proposal_generation'
        ]
        
        for prompt_name in prompts_to_check:
            try:
                prompt = get_prompt(prompt_name)
                has_template = hasattr(prompt, 'template') or hasattr(prompt, 'render')
                print_test(f"Prompt: {prompt_name}", has_template)
                results.append(has_template)
            except Exception as e:
                print_test(f"Prompt: {prompt_name}", False, str(e))
                results.append(False)
    except Exception as e:
        print_test("Prompts registry", False, str(e))
        results.append(False)
    
    # ========================================================================
    # 6. DEMO MODE
    # ========================================================================
    print_header("6. Demo Mode")
    
    try:
        from django.test import RequestFactory
        factory = RequestFactory()
        
        # Test demo mode detection
        request = factory.get('/test?demo=true')
        is_demo = is_demo_mode(request)
        print_test("Demo mode detection", is_demo)
        results.append(is_demo)
        
        # Test demo response
        demo_response = get_demo_response('tender_analysis', 'highway-construction')
        has_demo_data = 'analysis' in demo_response and demo_response.get('demo_mode') == True
        print_test("Demo response generation", has_demo_data)
        results.append(has_demo_data)
    except Exception as e:
        print_test("Demo mode", False, str(e))
        results.append(False)
    
    # ========================================================================
    # 7. MONITORING SYSTEM
    # ========================================================================
    print_header("7. Monitoring System")
    
    try:
        # Test logger
        ai_logger.log_request('test-id', 'user-1', 'test_operation')
        print_test("AI Logger", True)
        results.append(True)
        
        # Test metrics
        ai_metrics.increment_requests('test', 'test_provider')
        ai_metrics.record_latency('test', 100)
        print_test("AI Metrics", True)
        results.append(True)
    except Exception as e:
        print_test("Monitoring system", False, str(e))
        results.append(False)
    
    # ========================================================================
    # 8. PERMISSIONS
    # ========================================================================
    print_header("8. Permissions System")
    
    try:
        from apps.ai_engine.permissions import (
            CanUseAI,
            check_ai_quota,
            check_feature_access
        )
        
        User = get_user_model()
        
        # Check if we have test users
        test_user = User.objects.first()
        if test_user:
            has_quota, msg = check_ai_quota(test_user)
            print_test("Quota check", True, msg)
            results.append(True)
            
            has_access = check_feature_access(test_user, 'analysis')
            print_test("Feature access check", has_access is not None)
            results.append(has_access is not None)
        else:
            print_test("Permission tests", False, "No users in database")
            results.append(False)
    except Exception as e:
        print_test("Permissions system", False, str(e))
        results.append(False)
    
    # ========================================================================
    # 9. RATE LIMITING
    # ========================================================================
    print_header("9. Rate Limiting")
    
    try:
        from apps.ai_engine.decorators import ai_rate_limit
        
        # Check if decorator is available
        print_test("Rate limit decorator", True)
        results.append(True)
        
        # Check if django-ratelimit is installed
        try:
            import django_ratelimit
            print_test("django-ratelimit installed", True, 
                      f"Version: {django_ratelimit.__version__}")
            results.append(True)
        except ImportError:
            print_test("django-ratelimit installed", False,
                      "Install with: pip install django-ratelimit")
            results.append(False)
    except Exception as e:
        print_test("Rate limiting", False, str(e))
        results.append(False)
    
    # ========================================================================
    # 10. CIRCUIT BREAKER
    # ========================================================================
    print_header("10. Circuit Breaker")
    
    try:
        from apps.ai_engine.services.circuit_breaker import CircuitBreaker, CircuitState
        
        # Test circuit breaker creation
        test_breaker = CircuitBreaker("test_provider")
        is_closed = test_breaker.state == CircuitState.CLOSED
        print_test("Circuit breaker", is_closed, 
                  f"State: {test_breaker.state.value}")
        results.append(is_closed)
    except Exception as e:
        print_test("Circuit breaker", False, str(e))
        results.append(False)
    
    # ========================================================================
    # SUMMARY
    # ========================================================================
    print_header("Summary")
    
    total_tests = len(results)
    passed_tests = sum(results)
    failed_tests = total_tests - passed_tests
    pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    print(f"  Total Tests:  {total_tests}")
    print(f"  {Colors.GREEN}Passed:       {passed_tests}{Colors.END}")
    if failed_tests > 0:
        print(f"  {Colors.RED}Failed:       {failed_tests}{Colors.END}")
    print(f"  Pass Rate:    {pass_rate:.1f}%\n")
    
    if pass_rate == 100:
        print(f"{Colors.GREEN}{Colors.BOLD}✓ All checks passed! AI Engine is ready.{Colors.END}\n")
    elif pass_rate >= 80:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠ Most checks passed, but some issues detected.{Colors.END}\n")
    else:
        print(f"{Colors.RED}{Colors.BOLD}✗ Multiple issues detected. Please review failures.{Colors.END}\n")
    
    return results


if __name__ == '__main__':
    try:
        results = run_sanity_checks()
        # Exit with appropriate code
        sys.exit(0 if all(results) else 1)
    except Exception as e:
        print(f"\n{Colors.RED}Fatal error during sanity check: {e}{Colors.END}\n")
        sys.exit(1)
