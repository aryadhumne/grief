from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.groq_client import get_ai_response

journal_bp = Blueprint("journal", __name__)

# In-memory store: { user_id: [ {id, date, title, content, reflection}, ... ] }
journals = {}
entry_counter = {}


@journal_bp.route("/journal", methods=["POST"])
def add_entry():
    """
    Add a new journal entry.

    Request body:
    {
        "user_id": "user-123",
        "title": "A quiet Sunday",
        "content": "Today I finally looked at her photo..."
    }
    """
    data = request.get_json()
    user_id = data.get("user_id", "default")
    title = data.get("title", "Untitled").strip()
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"error": "Journal content cannot be empty"}), 400

    if user_id not in journals:
        journals[user_id] = []
        entry_counter[user_id] = 0

    entry_counter[user_id] += 1
    entry = {
        "id": entry_counter[user_id],
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M"),
        "title": title,
        "content": content,
        "reflection": None  # AI reflection generated on request
    }

    journals[user_id].append(entry)
    return jsonify({"message": "Entry saved", "entry": entry}), 201


@journal_bp.route("/journal/<user_id>", methods=["GET"])
def get_entries(user_id):
    """Returns all journal entries for a user, newest first."""
    entries = journals.get(user_id, [])
    return jsonify({"entries": list(reversed(entries))})


@journal_bp.route("/journal/<user_id>/<int:entry_id>/reflect", methods=["POST"])
def generate_reflection(user_id, entry_id):
    """
    Generates an AI reflection for a specific journal entry.
    Adds a warm, brief insight to help the user process their writing.
    """
    entries = journals.get(user_id, [])
    entry = next((e for e in entries if e["id"] == entry_id), None)

    if not entry:
        return jsonify({"error": "Entry not found"}), 404

    reflection_prompt = (
        f"The user wrote this private journal entry about their grief:\n\n"
        f"\"{entry['content']}\"\n\n"
        f"Write a warm, gentle reflection (2–3 sentences) that helps them feel heard "
        f"and gently highlights one thing they may not have noticed about what they wrote. "
        f"Don't give advice. Just offer a compassionate mirror."
    )

    reflection = get_ai_response(
        user_message=reflection_prompt,
        chat_history=[],
        stage_prompt="",
        sentiment_label="empathetic"
    )

    entry["reflection"] = reflection
    return jsonify({"reflection": reflection})


@journal_bp.route("/journal/<user_id>/weekly-summary", methods=["GET"])
def weekly_summary(user_id):
    """
    Generates an AI weekly summary from the last 7 days of journal entries.
    Returns themes, emotional patterns, and a gentle note of encouragement.
    """
    from datetime import timedelta
    cutoff = datetime.now() - timedelta(days=7)

    entries = journals.get(user_id, [])
    recent = [
        e for e in entries
        if datetime.strptime(e["date"], "%Y-%m-%d") >= cutoff
    ]

    if not recent:
        return jsonify({"summary": "No journal entries this week. That's okay — there are no rules to grief."})

    combined = "\n\n".join(
        [f"Entry ({e['date']}): {e['content']}" for e in recent]
    )

    summary_prompt = (
        f"Here are someone's grief journal entries from the past week:\n\n{combined}\n\n"
        f"Write a brief, warm weekly reflection (4–5 sentences) that:\n"
        f"1. Acknowledges the emotional themes you noticed\n"
        f"2. Points out any signs of growth or resilience, however small\n"
        f"3. Ends with a single gentle, encouraging sentence\n"
        f"Speak directly to the person, with warmth. No bullet points."
    )

    summary = get_ai_response(
        user_message=summary_prompt,
        chat_history=[],
        stage_prompt="",
        sentiment_label="reflective"
    )

    return jsonify({
        "summary": summary,
        "entries_reviewed": len(recent)
    })