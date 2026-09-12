import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const ROLES = ["Software Engineer", "Frontend Developer", "Backend Developer", "Data Analyst", "Product Manager"];

export default function Interview() {
  const [stage, setStage] = useState("setup"); // setup | active | completed
  const [role, setRole] = useState(ROLES[0]);
  const [difficulty, setDifficulty] = useState("medium");
  const [interviewType, setInterviewType] = useState("technical");
  const [resumeText, setResumeText] = useState("");

  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [codingQuestion, setCodingQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadCodingQuestion = async () => {
    const res = await api.post("/coding-question", { role, difficulty });
    setCodingQuestion(res.data);
  };

  const startInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/start-interview", {
        role,
        difficulty,
        interview_type: interviewType,
        resume_text: resumeText || null,
      });
      setSessionId(res.data.session_id);
      setQuestion(res.data.question);
      setFeedback(null);
      setCodingQuestion(null);
      if (interviewType === "coding") await loadCodingQuestion();
      setStage("active");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/submit-answer", {
        session_id: sessionId,
        role,
        question,
        answer,
      });
      setFeedback({ score: res.data.score, text: res.data.feedback });
      setAnswer("");
      if (res.data.completed) {
        setStage("completed");
      } else {
        setQuestion(res.data.next_question);
        if (interviewType === "coding") await loadCodingQuestion();
      }
    } finally {
      setLoading(false);
    }
  };

  const skipQuestion = async () => {
    setLoading(true);
    try {
      const res = await api.post("/next-question", { session_id: sessionId, role });
      setQuestion(res.data.question);
      setAnswer("");
      setFeedback(null);
      if (interviewType === "coding") await loadCodingQuestion();
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async () => {
    setLoading(true);
    try {
      await api.post(`/complete-interview/${sessionId}`);
      setStage("completed");
    } finally {
      setLoading(false);
    }
  };

  if (stage === "setup") {
    return (
      <form onSubmit={startInterview} className="interview-setup">
        <h2>Start a mock interview</h2>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label>
          Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label>
          Type
          <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="coding">Coding</option>
          </select>
        </label>
        <label>
          Resume (optional — paste text)
          <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={4} />
        </label>
        <button type="submit" disabled={loading}>{loading ? "Starting…" : "Start interview"}</button>
      </form>
    );
  }

  if (stage === "completed") {
    return (
      <div className="interview-completed">
        <h2>Interview complete</h2>
        <p>Your final report is ready.</p>
        <button onClick={() => navigate(`/report/${sessionId}`)}>View report</button>
        <button type="button" onClick={() => setStage("setup")}>Start another</button>
      </div>
    );
  }

  return (
    <div className="interview-active">
      <div className="interview-meta">
        <span>{role}</span>
        <span>{difficulty}</span>
        <span>{interviewType}</span>
      </div>

      <div className="question-card">
        <p className="question-label">Question</p>
        <p>{question}</p>
      </div>

      {interviewType === "coding" && codingQuestion && (
        <div className="coding-card">
          <div>{codingQuestion.problem}</div>
          {codingQuestion.constraints?.length > 0 && (
            <div style={{ marginTop: 12, opacity: 0.8 }}>
              Constraints:{"\n"}{codingQuestion.constraints.map((c) => `- ${c}`).join("\n")}
            </div>
          )}
          {codingQuestion.test_cases?.length > 0 && (
            <div style={{ marginTop: 12, opacity: 0.8 }}>
              Test cases:{"\n"}{codingQuestion.test_cases.map((t) => `- ${t}`).join("\n")}
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div className="feedback-card">
          <p><strong>Previous score:</strong> {feedback.score}/10</p>
          <p>{feedback.text}</p>
        </div>
      )}

      <form onSubmit={submitAnswer}>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={interviewType === "coding" ? 10 : 5}
          placeholder={interviewType === "coding" ? "Write your solution…" : "Type your answer…"}
          style={interviewType === "coding" ? { fontFamily: "'Courier New', monospace" } : undefined}
          required
        />
        <div className="interview-actions">
          <button type="submit" disabled={loading}>{loading ? "Evaluating…" : "Submit answer"}</button>
          <button type="button" onClick={skipQuestion} disabled={loading}>Skip question</button>
          <button type="button" onClick={endInterview} disabled={loading}>End interview</button>
        </div>
      </form>
    </div>
  );
}