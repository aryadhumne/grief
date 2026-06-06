import { useState, useEffect } from "react";

const API = "http://localhost:5000/api";

const MOODS = [
  { score: 1, emoji: "😶", label: "Numb" },
  { score: 2, emoji: "😢", label: "Very low" },
  { score: 3, emoji: "😔", label: "Low" },
  { score: 4, emoji: "😞", label: "Heavy" },
  { score: 5, emoji: "😐", label: "Neutral" },
  { score: 6, emoji: "🙂", label: "A little okay" },
  { score: 7, emoji: "😌", label: "Calm" },
  { score: 8, emoji: "😊", label: "Better" },
  { score: 9, emoji: "🌿", label: "Grateful" },
  { score: 10, emoji: "✨", label: "Peaceful" },
];

export default function MoodTracker({ userId }) {
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API}/mood/${userId}?days=14`);
      const data = await res.json();
      setHistory(data.logs || []);
      setStats(data.stats || null);
    } catch {}
  };

  const logMood = async () => {
    if (!selected) return;
    try {
      await fetch(`${API}/mood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, score: selected, note }),
      });
      setSaved(true);
      setNote("");
      fetchHistory();
      setTimeout(() => setSaved(false), 3000);
    } catch {}
  };

  // Simple bar chart
  const maxScore = 10;
  const chartData = history.slice(-10);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>How are you today?</h1>
        <p style={styles.subtitle}>A gentle check-in — no pressure, just presence</p>
      </div>

      <div style={styles.content}>
        {/* Mood selector */}
        <div style={styles.card}>
          <p style={styles.cardLabel}>Pick what feels closest</p>
          <div style={styles.moodGrid}>
            {MOODS.map(m => (
              <button
                key={m.score}
                onClick={() => setSelected(m.score)}
                style={{
                  ...styles.moodBtn,
                  ...(selected === m.score ? styles.moodBtnSelected : {}),
                }}
                title={m.label}
              >
                <span style={styles.moodEmoji}>{m.emoji}</span>
                <span style={styles.moodLabel}>{m.label}</span>
              </button>
            ))}
          </div>

          {selected && (
            <div style={styles.noteArea} className="fade-up">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note about today... (optional)"
                style={styles.noteInput}
                rows={2}
              />
              <button
                onClick={logMood}
                style={styles.saveBtn}
              >
                {saved ? "✓ Saved" : "Save check-in"}
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && stats.average_score && (
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <p style={styles.statNum}>{stats.average_score}</p>
              <p style={styles.statLabel}>Avg. mood (14 days)</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statNum}>{stats.days_tracked}</p>
              <p style={styles.statLabel}>Days tracked</p>
            </div>
            <div style={styles.statCard}>
              <p style={{ ...styles.statNum, textTransform: "capitalize" }}>{stats.trend}</p>
              <p style={styles.statLabel}>Trend</p>
            </div>
          </div>
        )}

        {/* Bar chart */}
        {chartData.length > 0 && (
          <div style={styles.card}>
            <p style={styles.cardLabel}>Last {chartData.length} days</p>
            <div style={styles.chart}>
              {chartData.map((d, i) => (
                <div key={i} style={styles.barCol}>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.bar,
                        height: `${(d.score / maxScore) * 100}%`,
                        background: d.score >= 7
                          ? "#7a9e87"
                          : d.score >= 4
                          ? "#c17f5a"
                          : "#b85c5c",
                      }}
                    />
                  </div>
                  <span style={styles.barScore}>{d.score}</span>
                  <span style={styles.barDate}>
                    {d.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", height: "100vh", background: "#f7f4f0" },
  header: {
    padding: "20px 28px 16px",
    borderBottom: "1px solid #e8e2da",
  },
  title: {
    fontFamily: "'Lora', serif",
    fontSize: "20px",
    fontWeight: "500",
    color: "#2c2420",
  },
  subtitle: { fontSize: "13px", color: "#9e918a", marginTop: "2px", fontStyle: "italic" },
  content: { flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" },
  card: {
    background: "#fffefcee",
    border: "1px solid #e8e2da",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 1px 8px rgba(44,36,32,0.05)",
  },
  cardLabel: { fontSize: "13px", color: "#9e918a", marginBottom: "16px", fontStyle: "italic" },
  moodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "8px",
  },
  moodBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: "10px 6px",
    borderRadius: "12px",
    border: "1px solid #e8e2da",
    background: "transparent",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  moodBtnSelected: {
    background: "#f5e6d8",
    border: "1.5px solid #c17f5a",
  },
  moodEmoji: { fontSize: "22px" },
  moodLabel: { fontSize: "10px", color: "#9e918a", textAlign: "center" },
  noteArea: { marginTop: "18px", display: "flex", flexDirection: "column", gap: "10px" },
  noteInput: {
    width: "100%",
    resize: "none",
    border: "1px solid #ddd8d0",
    borderRadius: "10px",
    padding: "10px 14px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    background: "#f7f4f0",
    color: "#2c2420",
    outline: "none",
  },
  saveBtn: {
    padding: "10px 20px",
    background: "#c17f5a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: "500",
    alignSelf: "flex-start",
  },
  statsRow: { display: "flex", gap: "14px" },
  statCard: {
    flex: 1,
    background: "#fffefcee",
    border: "1px solid #e8e2da",
    borderRadius: "14px",
    padding: "16px",
    textAlign: "center",
  },
  statNum: {
    fontFamily: "'Lora', serif",
    fontSize: "26px",
    fontWeight: "500",
    color: "#c17f5a",
  },
  statLabel: { fontSize: "12px", color: "#9e918a", marginTop: "4px" },
  chart: { display: "flex", gap: "8px", alignItems: "flex-end", height: "120px", paddingTop: "8px" },
  barCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" },
  barTrack: { flex: 1, width: "100%", background: "#f0ece6", borderRadius: "6px", display: "flex", alignItems: "flex-end", overflow: "hidden" },
  bar: { width: "100%", borderRadius: "6px 6px 0 0", transition: "height 0.5s ease", minHeight: "4px" },
  barScore: { fontSize: "10px", color: "#6b5e58", fontWeight: "500" },
  barDate: { fontSize: "9px", color: "#9e918a" },
};