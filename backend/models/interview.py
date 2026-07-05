from database.db import db
from datetime import datetime


class InterviewSession(db.Model):

    __tablename__ = "interview_sessions"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    role = db.Column(
        db.String(100),
        nullable=False
    )

    status = db.Column(
        db.String(20),
        default="active"
    )

    difficulty = db.Column(
        db.String(20),
        default="medium"
    )

    interview_type = db.Column(
        db.String(30),
        default="technical"
    )

    resume_text = db.Column(
        db.Text,
        nullable=True
    )

    question_count = db.Column(
        db.Integer,
        default=0
    )

    started_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    completed_at = db.Column(
        db.DateTime,
        nullable=True
    )


class InterviewResponse(db.Model):

    __tablename__ = "interview_responses"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    session_id = db.Column(
        db.Integer,
        db.ForeignKey("interview_sessions.id"),
        nullable=False
    )

    question = db.Column(
        db.Text,
        nullable=False
    )

    answer = db.Column(
        db.Text
    )

    feedback = db.Column(
        db.Text
    )

    score = db.Column(
        db.Integer
    )