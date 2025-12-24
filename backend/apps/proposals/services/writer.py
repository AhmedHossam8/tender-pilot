from apps.ai_engine.handlers import AIRequestHandler

def generate_proposal_sections(context):
    """
    context comes ONLY from ai_summary
    """
    ai_handler = AIRequestHandler()

    payload = {
        "task": "proposal-section-generation",
        "context": {
            "project_summary": context["summary"],
            "key_requirements": context["requirements"],
            "recommended_actions": context["analysis"].get("recommended_actions", [])
        }
    }

    return ai_handler.execute(payload)
