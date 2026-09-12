import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then((res) => setData(res.data));
  }, []);

  if (!data) return <p>Loading dashboard…</p>;

  const trendData = (data.progress_trend || []).map((s, i) => ({
    session: `#${i + 1}`,
    questions: s.question_count,
  }));

  return (
    <div className="dashboard">
      <h2>Your interview dashboard</h2>

      <div className="stats-grid">
        <Stat label="Total interviews" value={data.total_interviews} />
        <Stat label="Completed" value={data.completed_interviews} />
        <Stat label="Average score" value={data.average_score} />
        <Stat label="Highest score" value={data.highest_score} />
      </div>

      <div className="skills-row">
        <div>
          <p className="skills-label">Strongest</p>
          {data.strongest_skills?.map((s) => <span key={s} className="tag tag-good">{s}</span>)}
        </div>
        <div>
          <p className="skills-label">Needs work</p>
          {data.weakest_skills?.map((s) => <span key={s} className="tag tag-warn">{s}</span>)}
        </div>
      </div>

      {trendData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData}>
            <XAxis dataKey="session" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="questions" fill="#6C63FF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}

      <h3>Recent interviews</h3>
      <ul className="recent-list">
        {data.recent_interviews?.map((s) => (
          <li key={s.id}>
            <span>{s.role}</span>
            <span>{s.status}</span>
            <span>{s.score} pts</span>
            <Link to={`/report/${s.id}`}>View report</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}