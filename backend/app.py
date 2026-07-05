import logging
from sqlalchemy import inspect, text

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from database.db import db

from routes.auth_routes import auth_bp
from routes.interview_routes import interview_bp
from models.interview import InterviewSession, InterviewResponse
from models.report import Report

app = Flask(__name__)

# Load Config
app.config.from_object(Config)
app.config["JSON_SORT_KEYS"] = False

# Initialize Extensions
db.init_app(app)
jwt = JWTManager(app)
CORS(app)

logging.basicConfig(level=logging.INFO)
app.logger.setLevel(logging.INFO)


@app.errorhandler(400)
def handle_bad_request(error):
    return jsonify({"message": "Bad request"}), 400


@app.errorhandler(404)
def handle_not_found(error):
    return jsonify({"message": "Resource not found"}), 404


# Home Route
@app.route("/")
def home():
    return jsonify({
        "status": "success",
        "message": "AI Mock Interview Backend Running"
    })


# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(interview_bp)


def ensure_schema():
    """Create tables and add any new columns needed by the upgraded features."""
    with app.app_context():
        db.create_all()

        inspector = inspect(db.engine)
        interview_sessions_columns = {col["name"] for col in inspector.get_columns("interview_sessions")}
        reports_columns = {col["name"] for col in inspector.get_columns("reports")}

        if "difficulty" not in interview_sessions_columns:
            db.session.execute(text("ALTER TABLE interview_sessions ADD COLUMN difficulty VARCHAR(20) DEFAULT 'medium'"))
        if "interview_type" not in interview_sessions_columns:
            db.session.execute(text("ALTER TABLE interview_sessions ADD COLUMN interview_type VARCHAR(30) DEFAULT 'technical'"))
        if "resume_text" not in interview_sessions_columns:
            db.session.execute(text("ALTER TABLE interview_sessions ADD COLUMN resume_text TEXT"))
        if "question_count" not in interview_sessions_columns:
            db.session.execute(text("ALTER TABLE interview_sessions ADD COLUMN question_count INTEGER DEFAULT 0"))
        if "overall_score" not in reports_columns:
            db.session.execute(text("ALTER TABLE reports ADD COLUMN overall_score FLOAT DEFAULT 0.0"))
        if "hire_recommendation" not in reports_columns:
            db.session.execute(text("ALTER TABLE reports ADD COLUMN hire_recommendation VARCHAR(20) DEFAULT 'Maybe'"))

        db.session.commit()


ensure_schema()


# Run Server
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )