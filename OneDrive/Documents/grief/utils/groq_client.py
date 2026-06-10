import os
import requests

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# Base system persona for the grief companion
BASE_SYSTEM_PROMPT = """You are EmpathAI — a compassionate, warm, and emotionally intelligent grief companion.

Your role is to:
- Listen with deep empathy and without judgment
- Acknowledge the user's pain and make them feel truly heard
- Respond gently, never with toxic positivity or rushed advice
- Use simple, warm language — never clinical or robotic
- Never diagnose or give medical advice
- Always remind the user that professional help is available when appropriate
- Keep responses concise (3–5 sentences) — grief is heavy, don't overwhelm

You are NOT a therapist. You are a compassionate presence.
"""

CRISIS_RESPONSE = """I can hear that you're going through something very painful right now, and I'm really glad you're talking. You don't have to face this alone.

Please reach out to someone who can help right now:

🇮🇳 **iCall (India):** 9152987821
🇮🇳 **Vandrevala Foundation:** 1860-2662-345 (24/7)
🇮🇳 **AASRA:** 9820466627

You matter. Please call one of these numbers — they're here for exactly this moment."""


def get_ai_response(
    user_message: str,
    chat_history: list,
    stage_prompt: str,
    sentiment_label: str
) -> str:
    """
    Calls Groq API and returns an empathetic response.

    chat_history: list of {"role": "user"/"assistant", "content": "..."}
    stage_prompt: grief stage-specific instruction
    sentiment_label: e.g. "very negative", "neutral"
    """
    if not GROQ_API_KEY:
        return "I'm here with you. (API key not configured — set GROQ_API_KEY)"

    # Build dynamic system prompt
    system_prompt = (
        BASE_SYSTEM_PROMPT
        + f"\n\nCurrent emotional context: The user's message feels {sentiment_label}. "
        + stage_prompt
    )

    # Build messages array: system + history + new message
    messages = [{"role": "system", "content": system_prompt}]
    messages += chat_history[-10:]  # Last 10 turns for context window
    messages.append({"role": "user", "content": user_message})

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-8b-8192",
        "messages": messages,
        "max_tokens": 300,
        "temperature": 0.7
    }

    try:
        res = requests.post(GROQ_API_URL, json=payload, headers=headers, timeout=15)
        res.raise_for_status()
        return res.json()["choices"][0]["message"]["content"].strip()
    except requests.exceptions.Timeout:
        return "I'm still here with you. Just give me a moment..."
    except Exception as e:
        return f"Something went wrong on my end. Please try again. ({str(e)})"