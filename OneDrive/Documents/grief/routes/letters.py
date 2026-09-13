from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.groq_client import get_ai_response

letters_bp = Blueprint("letters", __name__)

# In-memory store: { user_id: [ {id, date, recipient, content, reflection}, ... ] }
letters = {}
letter_counter = {}


@letters_bp.route("/letters", methods=["POST"])
def add_letter():
    """
    Save a new letter.

    Request body:
    {
        "user_id": "user-123",
        "recipient": "Dad",
        "content": "I never got to tell you..."
    }
    """
    data = request.get_json()
    user_id = data.get("user_id", "default")
    recipient = data.get("recipient", "").strip() or "Someone I miss"
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"error": "Letter content cannot be empty"}), 400

    if user_id not in letters:
        letters[user_id] = []
        letter_counter[user_id] = 0

    letter_counter[user_id] += 1
    letter = {
        "id": letter_counter[user_id],
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M"),
        "recipient": recipient,
        "content": content,
        "reflection": None,
    }

    letters[user_id].append(letter)
    return jsonify({"message": "Letter saved", "letter": letter}), 201


@letters_bp.route("/letters/<user_id>", methods=["GET"])
def get_letters(user_id):
    """Returns all letters for a user, newest first."""
    entries = letters.get(user_id, [])
    return jsonify({"letters": list(reversed(entries))})


@letters_bp.route("/letters/<user_id>/<int:letter_id>", methods=["DELETE"])
def delete_letter(user_id, letter_id):
    """Deletes a single letter. Letters are private — the user should always be able to remove one."""
    entries = letters.get(user_id, [])
    remaining = [l for l in entries if l["id"] != letter_id]

    if len(remaining) == len(entries):
        return jsonify({"error": "Letter not found"}), 404

    letters[user_id] = remaining
    return jsonify({"message": "Letter deleted"})


@letters_bp.route("/letters/<user_id>/<int:letter_id>/reflect", methods=["POST"])
def reflect_on_letter(user_id, letter_id):
    """
    Generates a gentle AI reflection on a letter, the same way journal
    entries can get one. Entirely optional — never shown unless asked for.
    """
    entries = letters.get(user_id, [])
    letter = next((l for l in entries if l["id"] == letter_id), None)

    if not letter:
        return jsonify({"error": "Letter not found"}), 404

    reflection_prompt = (
        f"The user wrote this private, unsent letter to {letter['recipient']}, "
        f"someone they lost:\n\n\"{letter['content']}\"\n\n"
        f"Write a warm, gentle reflection (2–3 sentences). Don't give advice, "
        f"and don't suggest they send or share it. Just gently acknowledge what "
        f"they expressed and offer a compassionate mirror."
    )

    reflection = get_ai_response(
        user_message=reflection_prompt,
        chat_history=[],
        stage_prompt="",
        sentiment_label="empathetic",
    )

    letter["reflection"] = reflection
    return jsonify({"reflection": reflection})
