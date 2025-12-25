import os
import json
from typing import List, Dict

PAST_PROPOSALS_DIR = "/data/past_proposals"

def load_past_proposals() -> List[Dict]:
    proposals = []
    for filename in os.listdir(PAST_PROPOSALS_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(PAST_PROPOSALS_DIR, filename), "r", encoding="utf-8") as f:
                proposals.append(json.load(f))
    return proposals

def match_requirements(requirements: List[str], proposals: List[Dict], top_k: int = 3) -> List[Dict]:
    """
    Simple keyword matching for MVP. Returns top_k proposals relevant to the requirements.
    """
    matched = []
    for proposal in proposals:
        score = 0
        sections_text = " ".join(proposal.get("sections", {}).values())
        for req in requirements:
            if req.lower() in sections_text.lower():
                score += 1
        if score > 0:
            matched.append((score, proposal))
    
    # Sort by score descending
    matched.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in matched[:top_k]]
