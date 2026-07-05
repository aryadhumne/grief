import json
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from database.db import db
from models.interview import InterviewResponse, InterviewSession
from models.report import Report
from services.evaluation_service import extract_score_from_feedback, parse_structured_report
from services.groq_service import (
    evaluate_answer,
    generate_coding_question,
    generate_final_report,
    generate_question,
)

interview_bp = Blueprint(
    "interview",
    __name__
)


def _serialize_response(response):
    return {
        "question": response.question,
        "answer": response.answer,
        "feedback": response.feedback,
        "score": response.score,
    }


def _build_conversation_history(session_id):
    responses = InterviewResponse.query.filter_by(session_id=session_id).order_by(InterviewResponse.id).all()
    history = []
    for response in responses:
        history.append({
            "question": response.question,
            "answer": response.answer,
            "feedback": response.feedback,
        })
    return history


def _persist_final_report(session):
    conversation_history = _build_conversation_history(session.id)
    structured = generate_final_report(
        role=session.role,
        conversation_history=conversation_history,
        difficulty=session.difficulty or "medium",
        interview_type=session.interview_type or "technical",
    )
    report_payload = parse_structured_report(structured)

    report = Report.query.filter_by(session_id=session.id).first()
    if not report:
        report = Report(session_id=session.id)

    report.overall_score = report_payload.get("overall_score", 0)
    report.communication = report_payload.get("communication", 0)
    report.technical_knowledge = report_payload.get("technical_knowledge", 0)
    report.problem_solving = report_payload.get("problem_solving", 0)
    report.confidence = report_payload.get("confidence", 0)
    report.strengths = json.dumps(report_payload.get("strengths", []))
    report.weaknesses = json.dumps(report_payload.get("weaknesses", []))
    report.recommendations = json.dumps(report_payload.get("recommendations", []))
    report.hire_recommendation = report_payload.get("hire_recommendation", "Maybe")

    db.session.add(report)
    db.session.commit()
    return report


@interview_bp.route(
    "/start-interview",
    methods=["POST"]
)
@jwt_required()
def start_interview():
    data = request.get_json(silent=True) or {}

    role = data.get("role") or "software engineer"
    difficulty = (data.get("difficulty") or "medium").lower()
    interview_type = (data.get("interview_type") or "technical").lower()
    resume_text = data.get("resume_text")

    user_id = int(get_jwt_identity())

    session = InterviewSession(
        user_id=user_id,
        role=role,
        difficulty=difficulty,
        interview_type=interview_type,
        resume_text=resume_text,
    )

    db.session.add(session)
    db.session.commit()

    first_question = generate_question(
        role=role,
        difficulty=difficulty,
        interview_type=interview_type,
        resume_context=resume_text,
    )

    return jsonify({
        "session_id": session.id,
        "role": role,
        "difficulty": difficulty,
        "interview_type": interview_type,
        "question": first_question,
    })


@interview_bp.route(
    "/submit-answer",
    methods=["POST"]
)
@jwt_required()
def submit_answer():
    data = request.get_json(silent=True) or {}

    session_id = data.get("session_id")
    role = data.get("role") or "software engineer"
    question = data.get("question")
    answer = data.get("answer")

    session = InterviewSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found"}), 404

    conversation_history = _build_conversation_history(session.id)
    evaluation = evaluate_answer(
        role=role,
        question=question,
        answer=answer,
        difficulty=session.difficulty or "medium",
        interview_type=session.interview_type or "technical",
        resume_context=session.resume_text,
        conversation_history=conversation_history,
    )

    score = extract_score_from_feedback(evaluation)

    response = InterviewResponse(
        session_id=session.id,
        question=question,
        answer=answer,
        feedback=evaluation.get("feedback"),
        score=score,
    )

    session.question_count = (session.question_count or 0) + 1

    db.session.add(response)
    db.session.commit()

    next_question = None
    should_complete = bool(evaluation.get("complete_now")) or session.question_count >= 10

    if should_complete:
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        db.session.commit()
        _persist_final_report(session)
        return jsonify({
            "score": score,
            "feedback": evaluation.get("feedback"),
            "completed": True,
            "message": "Interview completed automatically",
        })

    next_question = generate_question(
        role=role,
        difficulty=session.difficulty or "medium",
        interview_type=session.interview_type or "technical",
        resume_context=session.resume_text,
        conversation_history=conversation_history + [{"question": question, "answer": answer, "feedback": evaluation.get("feedback") }],
    )

    return jsonify({
        "score": score,
        "feedback": evaluation.get("feedback"),
        "next_question": next_question,
        "completed": False,
    })


@interview_bp.route(
    "/next-question",
    methods=["POST"]
)
@jwt_required()
def next_question():
    data = request.get_json(silent=True) or {}

    session_id = data.get("session_id")
    role = data.get("role") or "software engineer"

    session = InterviewSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found"}), 404

    conversation_history = _build_conversation_history(session.id)
    question = generate_question(
        role=role,
        difficulty=session.difficulty or "medium",
        interview_type=session.interview_type or "technical",
        resume_context=session.resume_text,
        conversation_history=conversation_history,
    )

    return jsonify({"question": question})


@interview_bp.route(
    "/complete-interview/<int:session_id>",
    methods=["POST"]
)
@jwt_required()
def complete_interview(session_id):
    session = InterviewSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found"}), 404

    session.status = "completed"
    session.completed_at = datetime.utcnow()
    db.session.commit()
    _persist_final_report(session)

    return jsonify({"message": "Interview completed successfully"})


@interview_bp.route(
    "/session/<int:session_id>",
    methods=["GET"]
)
@jwt_required()
def get_session(session_id):
    responses = InterviewResponse.query.filter_by(session_id=session_id).order_by(InterviewResponse.id).all()
    return jsonify({
        "session_id": session_id,
        "responses": [_serialize_response(response) for response in responses],
    })


@interview_bp.route(
    "/report/<int:session_id>",
    methods=["GET"]
)
@jwt_required()
def interview_report(session_id):
    responses = InterviewResponse.query.filter_by(session_id=session_id).order_by(InterviewResponse.id).all()

    total_score = 0
    report = []

    for response in responses:
        total_score += response.score or 0
        report.append(_serialize_response(response))

    average_score = 0
    if responses:
        average_score = round(total_score / len(responses), 2)

    return jsonify({
        "session_id": session_id,
        "questions_answered": len(responses),
        "average_score": average_score,
        "details": report,
    })


@interview_bp.route(
    "/final-report/<int:session_id>",
    methods=["GET"]
)
@jwt_required()
def final_report(session_id):
    session = InterviewSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found"}), 404

    report = Report.query.filter_by(session_id=session.id).first()
    if report:
        return jsonify({
            "session_id": session.id,
            "report": {
                "overall_score": report.overall_score,
                "communication": report.communication,
                "technical_knowledge": report.technical_knowledge,
                "problem_solving": report.problem_solving,
                "confidence": report.confidence,
                "strengths": json.loads(report.strengths or "[]"),
                "weaknesses": json.loads(report.weaknesses or "[]"),
                "recommendations": json.loads(report.recommendations or "[]"),
                "hire_recommendation": report.hire_recommendation,
            }
        })

    responses = InterviewResponse.query.filter_by(session_id=session.id).order_by(InterviewResponse.id).all()
    conversation_history = _build_conversation_history(session.id)
    structured = generate_final_report(
        role=session.role,
        conversation_history=conversation_history,
        difficulty=session.difficulty or "medium",
        interview_type=session.interview_type or "technical",
    )

    report_payload = parse_structured_report(structured)

    report_entry = Report(
        session_id=session.id,
        overall_score=report_payload.get("overall_score", 0),
        communication=report_payload.get("communication", 0),
        technical_knowledge=report_payload.get("technical_knowledge", 0),
        problem_solving=report_payload.get("problem_solving", 0),
        confidence=report_payload.get("confidence", 0),
        strengths=json.dumps(report_payload.get("strengths", [])),
        weaknesses=json.dumps(report_payload.get("weaknesses", [])),
        recommendations=json.dumps(report_payload.get("recommendations", [])),
        hire_recommendation=report_payload.get("hire_recommendation", "Maybe"),
    )

    db.session.add(report_entry)
    db.session.commit()

    return jsonify({
        "session_id": session.id,
        "report": {
            "overall_score": report_entry.overall_score,
            "communication": report_entry.communication,
            "technical_knowledge": report_entry.technical_knowledge,
            "problem_solving": report_entry.problem_solving,
            "confidence": report_entry.confidence,
            "strengths": json.loads(report_entry.strengths or "[]"),
            "weaknesses": json.loads(report_entry.weaknesses or "[]"),
            "recommendations": json.loads(report_entry.recommendations or "[]"),
            "hire_recommendation": report_entry.hire_recommendation,
        }
    })


@interview_bp.route(
    "/upload-resume",
    methods=["POST"]
)
@jwt_required()
def upload_resume():
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    resume_text = data.get("resume_text")

    session = InterviewSession.query.get(session_id)
    if not session:
        return jsonify({"message": "Session not found"}), 404

    session.resume_text = resume_text
    db.session.commit()

    return jsonify({
        "message": "Resume received",
        "personalized_mode": True,
    })


@interview_bp.route(
    "/coding-question",
    methods=["POST"]
)
@jwt_required()
def coding_question():
    data = request.get_json(silent=True) or {}
    role = data.get("role") or "software engineer"
    difficulty = (data.get("difficulty") or "medium").lower()

    question_payload = generate_coding_question(role=role, difficulty=difficulty)
    return jsonify(question_payload)


@interview_bp.route(
    "/dashboard",
    methods=["GET"]
)
@jwt_required()
def dashboard():
    user_id = int(get_jwt_identity())

    sessions = InterviewSession.query.filter_by(user_id=user_id).order_by(InterviewSession.started_at.desc()).all()

    total_interviews = len(sessions)
    completed_interviews = len([s for s in sessions if s.status == "completed"])

    scores = []
    skill_scores = {}

    for session in sessions:
        responses = InterviewResponse.query.filter_by(session_id=session.id).all()
        if responses:
            session_scores = [response.score or 0 for response in responses]
            scores.extend(session_scores)

            if session.status == "completed":
                report = Report.query.filter_by(session_id=session.id).first()
                if report:
                    skill_scores["communication"] = skill_scores.get("communication", 0) + report.communication
                    skill_scores["technical_knowledge"] = skill_scores.get("technical_knowledge", 0) + report.technical_knowledge
                    skill_scores["problem_solving"] = skill_scores.get("problem_solving", 0) + report.problem_solving
                    skill_scores["confidence"] = skill_scores.get("confidence", 0) + report.confidence

    average_score = round(sum(scores) / len(scores), 2) if scores else 0
    highest_score = max(scores) if scores else 0
    weakest_skills = []
    strongest_skills = []

    if skill_scores:
        sorted_skills = sorted(skill_scores.items(), key=lambda item: item[1])
        weakest_skills = [name for name, _ in sorted_skills[:2]]
        strongest_skills = [name for _, name in sorted(sorted_skills, key=lambda item: item[1], reverse=True)[:2]]

    recent_interviews = []
    for session in sessions[:5]:
        recent_interviews.append({
            "id": session.id,
            "role": session.role,
            "status": session.status,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "score": sum(response.score or 0 for response in InterviewResponse.query.filter_by(session_id=session.id).all()),
        })

    progress_trend = []
    for session in sessions:
        progress_trend.append({
            "id": session.id,
            "status": session.status,
            "question_count": session.question_count or 0,
        })

    return jsonify({
        "total_interviews": total_interviews,
        "completed_interviews": completed_interviews,
        "average_score": average_score,
        "highest_score": highest_score,
        "weakest_skills": weakest_skills,
        "strongest_skills": strongest_skills,
        "recent_interviews": recent_interviews,
        "progress_trend": progress_trend,
    })