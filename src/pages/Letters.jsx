import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_GRIEF_API_URL || "http://localhost:5001/api";

export default function Letters() {
  const { username: userId } = useAuth();
  const [letters, setLetters] = useState([]);
  const [recipient, setRecipient] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reflecting, setReflecting] = useState(null);

  const loadLetters = () => {
    fetch(`${API}/letters/${userId}`)
      .then((r) => r.json())
      .then((data) => setLetters(data.letters || []))
      .catch(() => setError("Could not reach the companion server. Make sure it's running on port 5001."));
  };

  useEffect(() => {
    if (userId) loadLetters();
  }, [userId]);

  const saveLetter = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/letters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, recipient, content }),
      });
      if (!res.ok) throw new Error();
      setRecipient("");
      setContent("");
      loadLetters();
    } catch {
      setError("Could not save your letter. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteLetter = async (id) => {
    await fetch(`${API}/letters/${userId}/${id}`, { method: "DELETE" });
    loadLetters();
  };

  const reflect = async (id) => {
    setReflecting(id);
    try {
      const res = await fetch(`${API}/letters/${userId}/${id}/reflect`, { method: "POST" });
      const data = await res.json();
      setLetters((prev) => prev.map((l) => (l.id === id ? { ...l, reflection: data.reflection } : l)));
    } finally {
      setReflecting(null);
    }
  };

  return (
    <div style={styles.page}>
      <div className="companion-header">
        <h2>Letters</h2>
        <p className="home-sub">
          Write to someone you lost. These are never sent anywhere — just yours to write, and revisit if you want.
        </p>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <form onSubmit={saveLetter} style={styles.form}>
        <input
          type="text"
          placeholder="Who is this letter to? (e.g. Dad, Grandma)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <textarea
          placeholder="Write whatever you need to say…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
        />
        <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save letter"}</button>
      </form>

      <div style={styles.list}>
        {letters.map((letter) => (
          <div key={letter.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <p style={styles.recipient}>To {letter.recipient}</p>
                <p style={styles.date}>{letter.date} · {letter.time}</p>
              </div>
              <button type="button" onClick={() => deleteLetter(letter.id)} style={styles.deleteBtn}>Delete</button>
            </div>
            <p style={styles.content}>{letter.content}</p>

            {letter.reflection ? (
              <div style={styles.reflection}>{letter.reflection}</div>
            ) : (
              <button
                type="button"
                onClick={() => reflect(letter.id)}
                disabled={reflecting === letter.id}
                style={styles.reflectBtn}
              >
                {reflecting === letter.id ? "Reading…" : "Get a gentle reflection"}
              </button>
            )}
          </div>
        ))}

        {letters.length === 0 && (
          <p style={styles.empty}>No letters yet. Whenever you're ready, this is a private place to write one.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 640 },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "28px",
  },
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderLeft: "3px solid var(--companion)",
    borderRadius: "0 10px 10px 0",
    padding: "18px 20px",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" },
  recipient: { fontWeight: 600, color: "var(--companion)", fontSize: "14px" },
  date: { fontSize: "12px", color: "var(--ink-soft)", marginTop: "2px" },
  content: { fontSize: "14.5px", lineHeight: "1.7", whiteSpace: "pre-wrap", color: "var(--ink)" },
  deleteBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--ink-soft)",
    fontSize: "12px",
    padding: "4px 10px",
  },
  reflectBtn: {
    marginTop: "14px",
    background: "transparent",
    border: "1px solid var(--companion)",
    color: "var(--companion)",
    fontSize: "12.5px",
    padding: "6px 12px",
  },
  reflection: {
    marginTop: "14px",
    background: "var(--companion-soft)",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "13.5px",
    fontStyle: "italic",
    color: "var(--ink)",
  },
  empty: { color: "var(--ink-soft)", fontSize: "14px", textAlign: "center", padding: "30px 0" },
};