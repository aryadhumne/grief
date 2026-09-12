const STAGE_COLORS = {
  denial:     { dot: "#818cf8" },
  anger:      { dot: "#f87171" },
  bargaining: { dot: "#facc15" },
  depression: { dot: "#94a3b8" },
  acceptance: { dot: "#4ade80" },
  neutral:    { dot: "var(--ink-soft)" },
  crisis:     { dot: "var(--danger)" },
};

export default function ChatBubble({ role, content, stage }) {
  const isUser = role === "user";
  const isCrisis = stage === "crisis";

  return (
    <div style={{ ...styles.row, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && <div style={styles.avatar}>🕊</div>}
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.aiBubble), ...(isCrisis ? styles.crisisBubble : {}) }}>
        {!isUser && stage && stage !== "neutral" && (
          <div style={styles.stageTag}>
            <span style={{ ...styles.stageDot, background: STAGE_COLORS[stage]?.dot || "var(--ink-soft)" }} />
            <span style={styles.stageLabel}>{stage}</span>
          </div>
        )}
        <p style={{ ...styles.text, color: isUser ? "var(--companion-ink)" : "var(--ink)" }}>{content}</p>
      </div>
      {isUser && <div style={{ ...styles.avatar, background: "var(--companion)", color: "var(--companion-ink)", fontSize: "10px" }}>you</div>}
    </div>
  );
}

const styles = {
  row: { display: "flex", alignItems: "flex-end", gap: "10px", marginBottom: "16px" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", background: "var(--surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 },
  bubble: { maxWidth: "68%", padding: "14px 18px", borderRadius: "18px", lineHeight: "1.65" },
  userBubble: { background: "var(--companion)", borderBottomRightRadius: "4px" },
  aiBubble: { background: "var(--surface)", border: "1px solid var(--border)", borderBottomLeftRadius: "4px", boxShadow: "var(--shadow)" },
  crisisBubble: { background: "var(--danger-soft)", border: "1px solid var(--danger-soft)" },
  text: { fontSize: "14.5px", fontFamily: "inherit", whiteSpace: "pre-wrap" },
  stageTag: { display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" },
  stageDot: { width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 },
  stageLabel: { fontSize: "11px", color: "var(--ink-soft)", textTransform: "capitalize", letterSpacing: "0.5px" },
};