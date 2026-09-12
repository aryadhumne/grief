import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function Report() {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get(`/final-report/${sessionId}`).then((res) => setReport(res.data.report));
  }, [sessionId]);

  if (!report) return <p>Loading report…</p>;

  return (
    <div className="report-page">
      <h2>Interview report</h2>

      <div className="report-scores">
        <ScoreBar label="Overall" value={report.overall_score} />
        <ScoreBar label="Communication" value={report.communication} />
        <ScoreBar label="Technical knowledge" value={report.technical_knowledge} />
        <ScoreBar label="Problem solving" value={report.problem_solving} />
        <ScoreBar label="Confidence" value={report.confidence} />
      </div>

      <p className={`hire-badge hire-${(report.hire_recommendation || "").toLowerCase()}`}>
        Hire recommendation: {report.hire_recommendation}
      </p>

      <Section title="Strengths" items={report.strengths} />
      <Section title="Areas to improve" items={report.weaknesses} />
      <Section title="Recommendations" items={report.recommendations} />
    </div>
  );
}

function ScoreBar({ label, value }) {
  return (
    <div className="score-row">
      <span>{label}</span>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${(value / 10) * 100}%` }} />
      </div>
      <span>{value}/10</span>
    </div>
  );
}

function Section({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="report-section">
      <h4>{title}</h4>
      <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
    </div>
  );
}