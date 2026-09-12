import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import api from "../services/api";
import griefApi from "../services/GriefApi";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { username } = useAuth();
  const [interviewData, setInterviewData] = useState(null);
  const [moodData, setMoodData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then((res) => setInterviewData(res.data)).catch(() => setInterviewData({}));
    griefApi.get(`/mood/${username}?days=14`).then((res) => setMoodData(res.data)).catch(() => setMoodData({ logs: [], stats: {} }));
  }, [username]);

  if (!interviewData || !moodData) return <p>Loading your dashboard…</p>;

  const trend = (interviewData.progress_trend || []).map((s, i) => ({
    label: `Session ${i + 1}`,
    score: s.average_score ?? s.score ?? 0,
  }));

  const moodPoints = (moodData.logs || []).map((m) => ({
    label: m.date?.slice(5) || "",
    mood: m.score,
  }));

  const combined = [];
  const maxLen = Math.max(trend.length, moodPoints.length);
  for (let i = 0; i < maxLen; i++) {
    combined.push({
      label: moodPoints[i]?.label || trend[i]?.label || `#${i + 1}`,
      score: trend[i]?.score,
      mood: moodPoints[i]?.mood,
    });
  }

  return (
    <div className="home fade-up">
      <div className="home-hero">
        <p className="home-eyebrow">Welcome back</p>
        <h2 className="home-username">{username}</h2>
        <p className="home-sub">Here's how your practice and your headspace have been trending.</p>
      </div>

      <div className="chart-card">
        {combined.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={combined}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--practice)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--practice)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--companion)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--companion)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--ink-soft)" fontSize={12} />
              <YAxis stroke="var(--ink-soft)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ink)" }} />
              <Legend />
              <Area type="monotone" dataKey="score" name="Interview score" stroke="var(--practice)" fill="url(#scoreFill)" strokeWidth={2} connectNulls />
              <Area type="monotone" dataKey="mood" name="Mood" stroke="var(--companion)" fill="url(#moodFill)" strokeWidth={2} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="home-empty">No history yet — complete an interview or log a mood check-in to see your trend here.</p>
        )}
      </div>

      <div className="stats-grid home-stats">
        <Stat label="Total interviews" value={interviewData.total_interviews ?? 0} accent="practice" />
        <Stat label="Average score" value={interviewData.average_score ?? "—"} accent="practice" />
        <Stat label="Average mood" value={moodData.stats?.average_score ?? "—"} accent="companion" />
        <Stat label="Mood trend" value={moodData.stats?.trend ?? "no data"} accent="companion" />
      </div>

      <div className="skills-row">
        <div>
          <p className="skills-label">Strongest</p>
          {interviewData.strongest_skills?.map((s) => <span key={s} className="tag tag-good">{s}</span>)}
        </div>
        <div>
          <p className="skills-label">Needs work</p>
          {interviewData.weakest_skills?.map((s) => <span key={s} className="tag tag-warn">{s}</span>)}
        </div>
      </div>

      {interviewData.recent_interviews?.length > 0 && (
        <>
          <h3>Recent interviews</h3>
          <ul className="recent-list">
            {interviewData.recent_interviews.map((s) => (
              <li key={s.id}>
                <span>{s.role}</span>
                <span>{s.status}</span>
                <span>{s.score} pts</span>
                <Link to={`/report/${s.id}`}>View report</Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Jump back in</h3>
      <div className="quick-links">
        <QuickLink to="/interview" accent="practice" title="Mock interview" desc="Practice a role-specific interview and get scored feedback." />
        <QuickLink to="/chat" accent="companion" title="Chat" desc="Talk it through with your companion." />
        <QuickLink to="/mood" accent="companion" title="Mood check-in" desc="Log how you're feeling today." />
        <QuickLink to="/journal" accent="companion" title="Journal" desc="Write a private entry." />
        <QuickLink to="/breathing" accent="companion" title="Breathing exercise" desc="A guided minute to slow down." />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className={`stat-card stat-${accent}`}>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

function QuickLink({ to, title, desc, accent }) {
  return (
    <Link to={to} className={`quick-link quick-link-${accent}`}>
      <p className="quick-link-title">{title}</p>
      <p className="quick-link-desc">{desc}</p>
    </Link>
  );
}