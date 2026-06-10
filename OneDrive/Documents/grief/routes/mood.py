from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

mood_bp = Blueprint("mood", __name__)

# In-memory store: { user_id: [ {date, score, note, stage}, ... ] }
mood_logs = {}


@mood_bp.route("/mood", methods=["POST"])
def log_mood():
    """
    Log a daily mood check-in.

    Request body:
    {
        "user_id": "user-123",
        "score": 4,           // 1–10
        "note": "Feeling a bit lighter today",
        "stage": "depression" // optional, from last chat
    }
    """
    data = request.get_json()
    user_id = data.get("user_id", "default")
    score = data.get("score")
    note = data.get("note", "")
    stage = data.get("stage", "neutral")

    if score is None or not (1 <= int(score) <= 10):
        return jsonify({"error": "Score must be between 1 and 10"}), 400

    entry = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M"),
        "score": int(score),
        "note": note,
        "stage": stage
    }

    if user_id not in mood_logs:
        mood_logs[user_id] = []

    # Prevent duplicate entries for same day
    today = entry["date"]
    mood_logs[user_id] = [m for m in mood_logs[user_id] if m["date"] != today]
    mood_logs[user_id].append(entry)

    return jsonify({"message": "Mood logged", "entry": entry})


@mood_bp.route("/mood/<user_id>", methods=["GET"])
def get_mood_history(user_id):
    """
    Returns mood history for last N days.
    Query param: ?days=7 (default 7)
    """
    days = int(request.args.get("days", 7))
    cutoff = datetime.now() - timedelta(days=days)

    logs = mood_logs.get(user_id, [])
    filtered = [
        m for m in logs
        if datetime.strptime(m["date"], "%Y-%m-%d") >= cutoff
    ]

    # Calculate simple stats
    if filtered:
        scores = [m["score"] for m in filtered]
        avg = round(sum(scores) / len(scores), 1)
        trend = "improving" if scores[-1] > scores[0] else (
            "declining" if scores[-1] < scores[0] else "stable"
        )
    else:
        avg = None
        trend = "no data"

    return jsonify({
        "logs": filtered,
        "stats": {
            "average_score": avg,
            "trend": trend,
            "days_tracked": len(filtered)
        }
    })


@mood_bp.route("/mood/stages/<user_id>", methods=["GET"])
def get_stage_distribution(user_id):
    """Returns how many days the user spent in each grief stage."""
    logs = mood_logs.get(user_id, [])
    distribution = {}

    for m in logs:
        stage = m.get("stage", "neutral")
        distribution[stage] = distribution.get(stage, 0) + 1

    return jsonify({"distribution": distribution})