import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_GRIEF_API_URL || "http://localhost:5001/api";

export default function Journal() {
  const { username: userId } = useAuth();
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("write"); // "write" | "entries"
  const [reflections, setReflections] = useState({});
  const [loadingRef, setLoadingRef] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch(`${API}/journal/${userId}`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch {}
  };

  const saveEntry = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API}/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: title || "Untitled",
          content,
        }),
      });
      setTitle("");
      setContent("");
      fetchEntries();
      setView("entries");
    } catch {}
    setSaving(false);
  };

  const getReflection = async (entryId) => {
    setLoadingRef(entryId);
    try {
      const res = await fetch(
        `${API}/journal/${userId}/${entryId}/reflect`,
        { method: "POST" }
      );
      const data = await res.json();
      setReflections(prev => ({ ...prev, [entryId]: data.reflection }));
    } catch {}
    setLoadingRef(null);
  };

  const getWeeklySummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`${API}/journal/${userId}/weekly-summary`);
      const data = await res.json();
      setWeeklySummary(data.summary);
    } catch {}
    setLoadingSummary(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Journal</h1>
          <p style={styles.subtitle}>Your private space — no rules, no judgment</p>
        </div>
        <div style={styles.tabs}>
          {["write", "entries"].map(t => (
            <button
              key={t}
              onClick={() => setView(t)}
              style={{ ...styles.tab, ...(view === t ? styles.tabActive : {}) }}
            >
              {t === "write" ? "✍️ Write" : `📚 Entries (${entries.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.content}>
        {/* Write view */}
        {view === "write" && (
          <div style={styles.card} className="fade-up">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give today a title…"
              style={styles.titleInput}
            />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's on your mind and heart today? Write freely — this is just for you…"
              style={styles.contentInput}
              rows={10}
            />
            <div style={styles.writeActions}>
              <button
                onClick={saveEntry}
                disabled={!content.trim() || saving}
                style={{
                  ...styles.saveBtn,
                  opacity: !content.trim() || saving ? 0.5 : 1,
                }}
              >
                {saving ? "Saving…" : "Save entry"}
              </button>
            </div>
          </div>
        )}

        {/* Entries view */}
        {view === "entries" && (
          <>
            {/* Weekly summary button */}
            <button
              onClick={getWeeklySummary}
              disabled={loadingSummary}
              style={styles.summaryBtn}
            >
              {loadingSummary ? "Generating…" : "✨ Get weekly reflection"}
            </button>

            {weeklySummary && (
              <div style={styles.summaryCard} className="fade-up">
                <p style={styles.summaryTitle}>🌿 This week's reflection</p>
                <p style={styles.summaryText}>{weeklySummary}</p>
              </div>
            )}

            {entries.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No entries yet.</p>
                <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "6px" }}>
                  Start writing whenever you feel ready.
                </p>
              </div>
            ) : (
              entries.map((entry, i) => (
                <div
                  key={entry.id}
                  style={styles.entryCard}
                  className="fade-up"
                >
                  <div style={styles.entryHeader}>
                    <div>
                      <p style={styles.entryTitle}>{entry.title}</p>
                      <p style={styles.entryDate}>{entry.date} · {entry.time}</p>
                    </div>
                    {!reflections[entry.id] && (
                      <button
                        onClick={() => getReflection(entry.id)}
                        disabled={loadingRef === entry.id}
                        style={styles.reflectBtn}
                      >
                        {loadingRef === entry.id ? "…" : "Reflect"}
                      </button>
                    )}
                  </div>

                  <p style={styles.entryContent}>{entry.content}</p>

                  {reflections[entry.id] && (
                    <div style={styles.reflectionBox} className="fade-up">
                      <p style={styles.reflectionLabel}>🕊 AI reflection</p>
                      <p style={styles.reflectionText}>{reflections[entry.id]}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", flexDirection: "column", height: "calc(100vh - 28px)", background: "var(--bg)" },
  header: {
    padding: "20px 28px 16px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  title: { fontFamily: "'Space Grotesk', serif", fontSize: "20px", fontWeight: "500", color: "var(--ink)" },
  subtitle: { fontSize: "13px", color: "var(--ink-soft)", marginTop: "2px", fontStyle: "italic" },
  tabs: { display: "flex", gap: "6px" },
  tab: {
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--ink-soft)",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "var(--companion)",
    color: "var(--surface)",
    border: "1px solid var(--companion)",
  },
  content: { flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" },
  card: {
    background: "var(--surface)ee",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  titleInput: {
    border: "none",
    borderBottom: "1px solid var(--border)",
    background: "transparent",
    fontSize: "18px",
    fontFamily: "'Space Grotesk', serif",
    color: "var(--ink)",
    padding: "0 0 10px",
    outline: "none",
    width: "100%",
  },
  contentInput: {
    resize: "none",
    border: "none",
    background: "transparent",
    fontSize: "14.5px",
    fontFamily: "'Space Grotesk', sans-serif",
    color: "var(--ink)",
    outline: "none",
    lineHeight: "1.75",
    width: "100%",
  },
  writeActions: { display: "flex", justifyContent: "flex-end" },
  saveBtn: {
    padding: "10px 22px",
    background: "var(--companion)",
    color: "var(--surface)",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: "500",
  },
  summaryBtn: {
    padding: "11px 18px",
    background: "var(--practice-soft)",
    color: "var(--practice)",
    border: "1px solid var(--practice-soft)",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13.5px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: "500",
    alignSelf: "flex-start",
    transition: "all 0.2s",
  },
  summaryCard: {
    background: "var(--practice-soft)",
    border: "1px solid var(--practice-soft)",
    borderRadius: "14px",
    padding: "18px 20px",
  },
  summaryTitle: { fontSize: "13px", color: "var(--practice)", fontWeight: "500", marginBottom: "8px" },
  summaryText: { fontSize: "14px", color: "var(--ink)", lineHeight: "1.7", fontFamily: "'Space Grotesk', serif", fontStyle: "italic" },
  emptyState: { textAlign: "center", color: "var(--ink-soft)", padding: "40px 0", fontFamily: "'Space Grotesk', serif" },
  entryCard: {
    background: "var(--surface)ee",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  entryHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  entryTitle: { fontFamily: "'Space Grotesk', serif", fontSize: "15px", color: "var(--ink)", fontWeight: "500" },
  entryDate: { fontSize: "11px", color: "var(--ink-soft)", marginTop: "3px" },
  entryContent: { fontSize: "14px", color: "var(--ink)", lineHeight: "1.7" },
  reflectBtn: {
    padding: "6px 14px",
    background: "var(--companion-soft)",
    color: "var(--companion)",
    border: "1px solid var(--warn-soft)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: "500",
    flexShrink: 0,
  },
  reflectionBox: {
    background: "var(--companion-soft)",
    borderRadius: "10px",
    padding: "12px 16px",
    borderLeft: "3px solid var(--companion)",
  },
  reflectionLabel: { fontSize: "11px", color: "var(--companion)", fontWeight: "500", marginBottom: "6px" },
  reflectionText: { fontSize: "13.5px", color: "var(--ink)", lineHeight: "1.7", fontFamily: "'Space Grotesk', serif", fontStyle: "italic" },
};