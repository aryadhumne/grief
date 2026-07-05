import json
import os
import re

from groq import Groq
from dotenv import load_dotenv

from utils.prompts import (
    build_coding_prompt,
    build_evaluation_prompt,
    build_final_report_prompt,
    build_question_prompt,
)

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY") or ""
) if os.getenv("GROQ_API_KEY") else None


def _chat_completion(prompt: str, fallback_value: str):
    """Call Groq when configured; otherwise use a deterministic fallback."""
    if not client:
        return fallback_value

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )
        return response.choices[0].message.content
    except Exception:
        return fallback_value


def _clean_text(value: str) -> str:
    """Strip markdown fences and surrounding whitespace from AI output."""
    if not value:
        return ""

    cleaned = value.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _parse_json_payload(value: str):
    """Parse JSON from a model response when possible."""
    cleaned = _clean_text(value)
    if not cleaned:
        return {}

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.S)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return {}

    return {}


def generate_question(role, difficulty="medium", interview_type="technical", resume_context=None, conversation_history=None):
    """Generate the next interview question using conversation context."""
    prompt = build_question_prompt(
        role=role,
        difficulty=difficulty,
        interview_type=interview_type,
        resume_context=resume_context,
        conversation_history=conversation_history,
    )

    fallback = {
        "technical": f"Can you walk me through your experience with {role} in practice?",
        "hr": "Tell me about a challenge you handled in a team environment.",
        "behavioral": "Describe a time you worked through a difficult professional situation.",
        "system design": "How would you approach designing a scalable system for a growing product?",
    }.get(interview_type, f"Can you walk me through your experience with {role} in practice?")

    response = _chat_completion(prompt, fallback)
    return _clean_text(response)


def evaluate_answer(role, question, answer, difficulty="medium", interview_type="technical", resume_context=None, conversation_history=None):
    """Evaluate the candidate answer and decide whether the interview should complete."""
    prompt = build_evaluation_prompt(
        role=role,
        question=question,
        answer=answer,
        difficulty=difficulty,
        interview_type=interview_type,
        resume_context=resume_context,
        conversation_history=conversation_history,
    )

    fallback = {
        "feedback": "You provided a clear answer with room to deepen your explanation.",
        "score": 6,
        "complete_now": False,
        "strengths": ["Clear communication"],
        "weaknesses": ["Could add more depth"],
        "suggestions": ["Provide one concrete example"],
    }

    raw_response = _chat_completion(prompt, json.dumps(fallback))
    parsed = _parse_json_payload(raw_response)

    if not parsed:
        parsed = fallback

    return {
        "feedback": parsed.get("feedback") or fallback["feedback"],
        "score": int(parsed.get("score", fallback["score"]) or fallback["score"]),
        "complete_now": bool(parsed.get("complete_now", fallback["complete_now"])),
        "strengths": parsed.get("strengths") or fallback["strengths"],
        "weaknesses": parsed.get("weaknesses") or fallback["weaknesses"],
        "suggestions": parsed.get("suggestions") or fallback["suggestions"],
    }


def generate_final_report(role, conversation_history, difficulty="medium", interview_type="technical"):
    """Generate a structured hiring report from the interview history."""
    prompt = build_final_report_prompt(
        role=role,
        conversation_history=conversation_history,
        difficulty=difficulty,
        interview_type=interview_type,
    )

    fallback = {
        "overall_score": 7.0,
        "communication": 7,
        "technical_knowledge": 7,
        "problem_solving": 7,
        "confidence": 7,
        "strengths": ["Steady communication"],
        "weaknesses": ["Needs more depth"],
        "recommendations": ["Practice with concrete examples"],
        "hire_recommendation": "Maybe",
    }

    raw_response = _chat_completion(prompt, json.dumps(fallback))
    parsed = _parse_json_payload(raw_response)

    if not parsed:
        parsed = fallback

    return {
        "overall_score": float(parsed.get("overall_score", fallback["overall_score"]) or fallback["overall_score"]),
        "communication": int(parsed.get("communication", fallback["communication"]) or fallback["communication"]),
        "technical_knowledge": int(parsed.get("technical_knowledge", fallback["technical_knowledge"]) or fallback["technical_knowledge"]),
        "problem_solving": int(parsed.get("problem_solving", fallback["problem_solving"]) or fallback["problem_solving"]),
        "confidence": int(parsed.get("confidence", fallback["confidence"]) or fallback["confidence"]),
        "strengths": parsed.get("strengths") or fallback["strengths"],
        "weaknesses": parsed.get("weaknesses") or fallback["weaknesses"],
        "recommendations": parsed.get("recommendations") or fallback["recommendations"],
        "hire_recommendation": parsed.get("hire_recommendation") or fallback["hire_recommendation"],
    }


def generate_coding_question(role, difficulty="medium"):
    """Generate a coding interview question payload."""
    prompt = build_coding_prompt(role=role, difficulty=difficulty)

    fallback = {
        "problem": "Write a function that returns the sum of two numbers.",
        "constraints": ["Input values are integers", "Do not use built-in helpers"],
        "test_cases": ["1, 2 -> 3", "5, 7 -> 12"],
        "difficulty": difficulty,
    }

    raw_response = _chat_completion(prompt, json.dumps(fallback))
    parsed = _parse_json_payload(raw_response)

    if not parsed:
        parsed = fallback

    return {
        "problem": parsed.get("problem") or fallback["problem"],
        "constraints": parsed.get("constraints") or fallback["constraints"],
        "test_cases": parsed.get("test_cases") or fallback["test_cases"],
        "difficulty": parsed.get("difficulty") or fallback["difficulty"],
    }