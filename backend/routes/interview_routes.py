from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from database.db import db

from models.interview import (
    InterviewSession,
    InterviewResponse
)

from services.groq_service import (
    generate_question,
    evaluate_answer
)

from datetime import datetime
import re

interview_bp = Blueprint(
    "interview",
    __name__
)


@interview_bp.route(
    "/start-interview",
    methods=["POST"]
)
@jwt_required()
def start_interview():

    data = request.get_json()

    role = data.get("role")

    user_id = int(
        get_jwt_identity()
    )

    session = InterviewSession(
        user_id=user_id,
        role=role
    )

    db.session.add(session)
    db.session.commit()

    first_question = generate_question(
        role
    )

    return jsonify({
        "session_id": session.id,
        "role": role,
        "question": first_question
    })


@interview_bp.route(
    "/submit-answer",
    methods=["POST"]
)
@jwt_required()
def submit_answer():

    data = request.get_json()

    session_id = data.get("session_id")
    role = data.get("role")
    question = data.get("question")
    answer = data.get("answer")

    feedback = evaluate_answer(
        role,
        question,
        answer
    )

    score = 5

    match = re.search(
        r'(\d+)/10',
        str(feedback)
    )

    if match:
        score = int(
            match.group(1)
        )

    response = InterviewResponse(
        session_id=session_id,
        question=question,
        answer=answer,
        feedback=feedback,
        score=score
    )

    db.session.add(response)
    db.session.commit()

    next_question = generate_question(
        role
    )

    return jsonify({
        "score": score,
        "feedback": feedback,
        "next_question": next_question
    })


@interview_bp.route(
    "/complete-interview/<int:session_id>",
    methods=["POST"]
)
@jwt_required()
def complete_interview(session_id):

    session = InterviewSession.query.get(
        session_id
    )

    if not session:

        return jsonify({
            "message": "Session not found"
        }), 404

    session.status = "completed"

    session.completed_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "message": "Interview completed successfully"
    })


@interview_bp.route(
    "/session/<int:session_id>",
    methods=["GET"]
)
@jwt_required()
def get_session(session_id):

    responses = InterviewResponse.query.filter_by(
        session_id=session_id
    ).all()

    result = []

    for r in responses:

        result.append({
            "question": r.question,
            "answer": r.answer,
            "feedback": r.feedback,
            "score": r.score
        })

    return jsonify({
        "session_id": session_id,
        "responses": result
    })


@interview_bp.route(
    "/report/<int:session_id>",
    methods=["GET"]
)
@jwt_required()
def interview_report(session_id):

    responses = InterviewResponse.query.filter_by(
        session_id=session_id
    ).all()

    total_score = 0

    report = []

    for r in responses:

        total_score += r.score or 0

        report.append({
            "question": r.question,
            "answer": r.answer,
            "feedback": r.feedback,
            "score": r.score
        })

    average_score = 0

    if len(responses) > 0:

        average_score = (
            total_score / len(responses)
        )

    return jsonify({
        "session_id": session_id,
        "questions_answered": len(responses),
        "average_score": round(
            average_score,
            2
        ),
        "details": report
    })


@interview_bp.route(
    "/dashboard",
    methods=["GET"]
)
@jwt_required()
def dashboard():

    user_id = int(
        get_jwt_identity()
    )

    sessions = InterviewSession.query.filter_by(
        user_id=user_id
    ).all()

    total_interviews = len(
        sessions
    )

    completed_interviews = len([
        s for s in sessions
        if s.status == "completed"
    ])

    total_score = 0
    total_answers = 0

    for session in sessions:

        responses = InterviewResponse.query.filter_by(
            session_id=session.id
        ).all()

        for response in responses:

            total_score += (
                response.score or 0
            )

            total_answers += 1

    average_score = 0

    if total_answers > 0:

        average_score = round(
            total_score / total_answers,
            2
        )

    return jsonify({
        "total_interviews": total_interviews,
        "completed_interviews": completed_interviews,
        "average_score": average_score
    })