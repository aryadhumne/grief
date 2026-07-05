from database.db import db
from datetime import datetime


class Report(db.Model):

    __tablename__ = "reports"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    session_id = db.Column(
        db.Integer,
        db.ForeignKey("interview_sessions.id"),
        nullable=False,
        unique=True
    )

    overall_score = db.Column(
        db.Float,
        nullable=False,
        default=0.0
    )

    communication = db.Column(
        db.Integer,
        default=0
    )

    technical_knowledge = db.Column(
        db.Integer,
        default=0
    )

    problem_solving = db.Column(
        db.Integer,
        default=0
    )

    confidence = db.Column(
        db.Integer,
        default=0
    )

    strengths = db.Column(
        db.Text,
        nullable=True
    )

    weaknesses = db.Column(
        db.Text,
        nullable=True
    )

    recommendations = db.Column(
        db.Text,
        nullable=True
    )

    hire_recommendation = db.Column(
        db.String(20),
        default="Maybe"
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )