import json
import logging
from apps.documents.models import TenderDocument

logger = logging.getLogger(__name__)

def build_proposal_context(tender):
    """
    Extract structured AI output to be used for proposal writing
    """
    doc = (
        TenderDocument.objects
        .filter(tender=tender, ai_processed=True, is_active=True)
        .order_by("-ai_processed_at")
        .first()
    )

    if not doc or not doc.ai_summary:
        raise ValueError("No AI-processed tender document found")

    # Parse JSON with better error handling
    ai_summary_str = doc.ai_summary.strip()
    
    # Check if it's already a dict (shouldn't happen, but handle it)
    if isinstance(ai_summary_str, dict):
        ai_data = ai_summary_str
    else:
        # Try to parse as JSON first
        ai_data = None
        parse_error = None
        
        try:
            # Remove any leading/trailing whitespace
            ai_summary_str = ai_summary_str.strip()
            
            # Handle case where JSON might be double-encoded (string containing JSON string)
            if ai_summary_str.startswith('"') and ai_summary_str.endswith('"'):
                # Try to decode the outer JSON string first
                try:
                    decoded = json.loads(ai_summary_str)
                    if isinstance(decoded, str):
                        ai_summary_str = decoded
                except json.JSONDecodeError:
                    pass
            
            # Try parsing as JSON
            ai_data = json.loads(ai_summary_str)
            
        except json.JSONDecodeError as e:
            parse_error = e
            # If JSON parsing fails, try to parse as Python dict string (using ast.literal_eval)
            # This handles cases where the data was stored as a Python dict string representation
            try:
                import ast
                # Only use ast.literal_eval if it looks like a Python dict (starts with {)
                if ai_summary_str.startswith('{'):
                    ai_data = ast.literal_eval(ai_summary_str)
                    logger.warning(
                        f"Parsed ai_summary as Python dict string for tender {tender.id}, document {doc.id}. "
                        f"Consider re-saving as JSON for better compatibility."
                    )
                else:
                    raise ValueError("ai_summary doesn't appear to be valid JSON or Python dict")
            except (ValueError, SyntaxError) as ast_error:
                logger.error(
                    f"Failed to parse ai_summary for tender {tender.id}, document {doc.id}. "
                    f"JSON error: {parse_error}, AST error: {ast_error}"
                )
                logger.error(f"ai_summary content (first 500 chars): {ai_summary_str[:500]}")
                raise ValueError(
                    f"Invalid format in AI summary. The document may need to be re-analyzed. "
                    f"JSON error: {str(parse_error)}"
                )
        except Exception as e:
            logger.error(f"Unexpected error parsing ai_summary for tender {tender.id}: {e}", exc_info=True)
            raise ValueError(f"Failed to parse AI summary: {str(e)}")

    # Validate that ai_data is a dictionary
    if not isinstance(ai_data, dict):
        logger.error(f"ai_data is not a dict, type: {type(ai_data)}")
        raise ValueError("AI summary is not in the expected format. The document may need to be re-analyzed.")

    return {
        "summary": ai_data.get("summary", {}),
        "requirements": ai_data.get("requirements", {}),
        "analysis": ai_data.get("analysis", {}),
    }