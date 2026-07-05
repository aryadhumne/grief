def build_question_prompt(role, difficulty="medium", interview_type="technical", resume_context=None, conversation_history=None):
    """Create a prompt for the next interview question."""
    history_text = ""
    if conversation_history:
        history_text = "\n".join(
            f"Previous Q: {item.get('question')}\nPrevious A: {item.get('answer')}\nFeedback: {item.get('feedback')}"
            for item in conversation_history
        )

    resume_text = ""
    if resume_context:
        resume_text = f"\nCandidate resume context:\n{resume_context}"

    return f"""
You are a professional interviewer conducting a {interview_type} interview for a {role} candidate.
The candidate's difficulty level is {difficulty}.
You must ask the next question in a conversational and logical way based on the prior exchange.

Conversation history:
{history_text}

{resume_text}

Instructions:
- Ask one highly relevant follow-up question.
- Do not repeat previous questions.
- Keep it concise and natural.
- Return only the question text.
"""


def build_evaluation_prompt(role, question, answer, difficulty="medium", interview_type="technical", resume_context=None, conversation_history=None):
    """Create a prompt for answer evaluation."""
    history_text = ""
    if conversation_history:
        history_text = "\n".join(
            f"Q: {item.get('question')}\nA: {item.get('answer')}\nFeedback: {item.get('feedback')}"
            for item in conversation_history
        )

    resume_text = ""
    if resume_context:
        resume_text = f"\nResume context:\n{resume_context}"

    return f"""
You are a senior interviewer evaluating a {interview_type} interview for a {role} candidate.
Difficulty: {difficulty}

Question:
{question}

Candidate answer:
{answer}

Conversation history:
{history_text}

{resume_text}

Return JSON with:
- feedback: short professional feedback
- score: integer from 0 to 10
- complete_now: true or false
- strengths: array of short strengths
- weaknesses: array of short weaknesses
- suggestions: array of short suggestions
"""


def build_final_report_prompt(role, conversation_history, difficulty="medium", interview_type="technical"):
    """Create a prompt for a structured final report."""
    history_text = "\n".join(
        f"Q: {item.get('question')}\nA: {item.get('answer')}\nFeedback: {item.get('feedback')}"
        for item in conversation_history
    )

    return f"""
You are a hiring analyst producing a final evaluation for a {interview_type} interview with a {role} candidate.
Difficulty: {difficulty}

Interview transcript:
{history_text}

Return JSON with the following fields:
{{
  "overall_score": 8.7,
  "communication": 9,
  "technical_knowledge": 8,
  "problem_solving": 8,
  "confidence": 9,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "hire_recommendation": "Yes"
}}
"""


def build_coding_prompt(role, difficulty="medium"):
    """Create a prompt for a coding interview question."""
    return f"""
You are a senior technical interviewer for a {role} candidate.
Generate one coding interview question for difficulty {difficulty}.
Return JSON with:
- problem
- constraints
- test_cases
- difficulty
"""
