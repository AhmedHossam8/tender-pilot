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

def generate_proposal_review(context, proposal_sections=None):
    """
    Generate AI review feedback for a proposal
    """
    ai_handler = AIRequestHandler()

    payload = {
        "task": "proposal-review",
        "context": {
            "summary": context.get("summary", ""),
            "requirements": context.get("requirements", []),
            "analysis": context.get("analysis", {})
        },
        "proposal_sections": proposal_sections or {}
    }

    return ai_handler.execute(payload)

def generate_proposal_checklist(context, proposal_sections=None):
    """
    Generate AI-powered checklist for missing sections or improvements.
    """
    ai_handler = AIRequestHandler()

    payload = {
        "task": "proposal-checklist",
        "context": {
            "summary": context.get("summary", ""),
            "requirements": context.get("requirements", []),
            "analysis": context.get("analysis", {}),
        },
        "proposal_sections": proposal_sections or {}
    }

    return ai_handler.execute(payload)