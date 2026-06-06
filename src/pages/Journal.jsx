import { useState, useEffect } from "react";

const API = "http://localhost:5000/api";

export default function Journal({ userId }) {
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
                <p style={{ fontSize: "13px", color: "#9e918a", marginTop: "6px" }}>
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
  page: { display: "flex", flexDirection: "column", height: "100vh", background: "#f7f4f0" },
  header: {
    padding: "20px 28px 16px",
    borderBottom: "1px solid #e8e2da",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  title: { fontFamily: "'Lora', serif", fontSize: "20px", fontWeight: "500", color: "#2c2420" },
  subtitle: { fontSize: "13px", color: "#9e918a", marginTop: "2px", fontStyle: "italic" },
  tabs: { display: "flex", gap: "6px" },
  tab: {
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid #ddd8d0",
    background: "transparent",
    color: "#6b5e58",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#c17f5a",
    color: "#fff",
    border: "1px solid #c17f5a",
  },
  content: { flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" },
  card: {
    background: "#fffefcee",
    border: "1px solid #e8e2da",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  titleInput: {
    border: "none",
    borderBottom: "1px solid #e8e2da",
    background: "transparent",
    fontSize: "18px",
    fontFamily: "'Lora', serif",
    color: "#2c2420",
    padding: "0 0 10px",
    outline: "none",
    width: "100%",
  },
  contentInput: {
    resize: "none",
    border: "none",
    background: "transparent",
    fontSize: "14.5px",
    fontFamily: "'DM Sans', sans-serif",
    color: "#2c2420",
    outline: "none",
    lineHeight: "1.75",
    width: "100%",
  },
  writeActions: { display: "flex", justifyContent: "flex-end" },
  saveBtn: {
    padding: "10px 22px",
    background: "#c17f5a",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: "500",
  },
  summaryBtn: {
    padding: "11px 18px",
    background: "#e8f0ea",
    color: "#4a7a58",
    border: "1px solid #c0d8c8",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13.5px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: "500",
    alignSelf: "flex-start",
    transition: "all 0.2s",
  },
  summaryCard: {
    background: "#f0fdf4",
    border: "1px solid #c0d8c8",
    borderRadius: "14px",
    padding: "18px 20px",
  },
  summaryTitle: { fontSize: "13px", color: "#4a7a58", fontWeight: "500", marginBottom: "8px" },
  summaryText: { fontSize: "14px", color: "#2c2420", lineHeight: "1.7", fontFamily: "'Lora', serif", fontStyle: "italic" },
  emptyState: { textAlign: "center", color: "#6b5e58", padding: "40px 0", fontFamily: "'Lora', serif" },
  entryCard: {
    background: "#fffefcee",
    border: "1px solid #e8e2da",
    borderRadius: "14px",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  entryHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  entryTitle: { fontFamily: "'Lora', serif", fontSize: "15px", color: "#2c2420", fontWeight: "500" },
  entryDate: { fontSize: "11px", color: "#9e918a", marginTop: "3px" },
  entryContent: { fontSize: "14px", color: "#4a3f3a", lineHeight: "1.7" },
  reflectBtn: {
    padding: "6px 14px",
    background: "#f5e6d8",
    color: "#c17f5a",
    border: "1px solid #e8c9a8",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: "500",
    flexShrink: 0,
  },
  reflectionBox: {
    background: "#f5e6d8",
    borderRadius: "10px",
    padding: "12px 16px",
    borderLeft: "3px solid #c17f5a",
  },
  reflectionLabel: { fontSize: "11px", color: "#c17f5a", fontWeight: "500", marginBottom: "6px" },
  reflectionText: { fontSize: "13.5px", color: "#4a3f3a", lineHeight: "1.7", fontFamily: "'Lora', serif", fontStyle: "italic" },
};