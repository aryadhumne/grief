import json
import re
from typing import Any, Dict


def extract_score_from_feedback(feedback: Any) -> int:
    """Extract a numeric score from free-form feedback text."""
    if isinstance(feedback, dict):
        score = feedback.get("score")
        if score is not None:
            return int(score)

    if isinstance(feedback, (int, float)):
        return int(feedback)

    text = str(feedback or "")
    match = re.search(r"(\d{1,2})\s*/\s*10", text)
    if match:
        return int(match.group(1))

    match = re.search(r"score\s*[:=]\s*(\d{1,2})", text, flags=re.IGNORECASE)
    if match:
        return int(match.group(1))

    return 5


def parse_structured_report(raw_report: Any) -> Dict[str, Any]:
    """Normalize AI-generated report payloads into a consistent dictionary."""
    if isinstance(raw_report, dict):
        payload = raw_report
    else:
        payload = {}
        text = str(raw_report or "")
        if text:
            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                match = re.search(r"\{.*\}", text, flags=re.S)
                if match:
                    try:
                        payload = json.loads(match.group(0))
                    except json.JSONDecodeError:
                        payload = {}

    return {
        "overall_score": float(payload.get("overall_score", 0) or 0),
        "communication": int(payload.get("communication", 0) or 0),
        "technical_knowledge": int(payload.get("technical_knowledge", 0) or 0),
        "problem_solving": int(payload.get("problem_solving", 0) or 0),
        "confidence": int(payload.get("confidence", 0) or 0),
        "strengths": payload.get("strengths", []) or [],
        "weaknesses": payload.get("weaknesses", []) or [],
        "recommendations": payload.get("recommendations", []) or [],
        "hire_recommendation": str(payload.get("hire_recommendation", "Maybe") or "Maybe")
    }