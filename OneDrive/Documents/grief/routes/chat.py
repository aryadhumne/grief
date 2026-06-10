from flask import Blueprint, request, jsonify
from utils.sentiment import (
    detect_crisis,
    detect_grief_stage,
    analyze_sentiment,
    get_stage_prompt
)
from utils.groq_client import get_ai_response, CRISIS_RESPONSE

chat_bp = Blueprint("chat", __name__)

# In-memory session store (replace with Supabase in production)
# Structure: { session_id: [ {role, content}, ... ] }
chat_sessions = {}


@chat_bp.route("/chat", methods=["POST"])
def chat():
    """
    Main chat endpoint.

    Request body:
    {
        "message": "I miss her so much",
        "session_id": "user-123"
    }

    Response:
    {
        "reply": "...",
        "stage": "depression",
        "sentiment": { "polarity": -0.6, "label": "negative" },
        "is_crisis": false
    }
    """
    data = request.get_json()
    message = data.get("message", "").strip()
    session_id = data.get("session_id", "default")

    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    # Step 1 — Crisis check (highest priority)
    if detect_crisis(message):
        return jsonify({
            "reply": CRISIS_RESPONSE,
            "stage": "crisis",
            "sentiment": {"polarity": -1.0, "label": "very negative"},
            "is_crisis": True
        })

    # Step 2 — Sentiment analysis
    sentiment = analyze_sentiment(message)

    # Step 3 — Grief stage detection
    stage = detect_grief_stage(message)
    stage_prompt = get_stage_prompt(stage)

    # Step 4 — Get chat history for this session
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []
    history = chat_sessions[session_id]

    # Step 5 — Get AI response
    reply = get_ai_response(
        user_message=message,
        chat_history=history,
        stage_prompt=stage_prompt,
        sentiment_label=sentiment["label"]
    )

    # Step 6 — Update history
    chat_sessions[session_id].append({"role": "user", "content": message})
    chat_sessions[session_id].append({"role": "assistant", "content": reply})

    # Keep history to last 20 messages to avoid memory bloat
    if len(chat_sessions[session_id]) > 20:
        chat_sessions[session_id] = chat_sessions[session_id][-20:]

    return jsonify({
        "reply": reply,
        "stage": stage,
        "sentiment": sentiment,
        "is_crisis": False
    })


@chat_bp.route("/chat/history/<session_id>", methods=["GET"])
def get_history(session_id):
    """Returns chat history for a given session."""
    history = chat_sessions.get(session_id, [])
    return jsonify({"history": history})


@chat_bp.route("/chat/clear/<session_id>", methods=["DELETE"])
def clear_history(session_id):
    """Clears chat history for a session."""
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    return jsonify({"message": "History cleared"})
