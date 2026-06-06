const STAGE_COLORS = {
  denial:     { dot: "#818cf8" },
  anger:      { dot: "#f87171" },
  bargaining: { dot: "#facc15" },
  depression: { dot: "#94a3b8" },
  acceptance: { dot: "#4ade80" },
  neutral:    { dot: "#c4b5a5" },
  crisis:     { dot: "#b85c5c" },
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
            <span style={{ ...styles.stageDot, background: STAGE_COLORS[stage]?.dot || "#c4b5a5" }} />
            <span style={styles.stageLabel}>{stage}</span>
          </div>
        )}
        <p style={{ ...styles.text, color: isUser ? "#fff" : "#2c2420" }}>{content}</p>
      </div>
      {isUser && <div style={{ ...styles.avatar, background: "#c17f5a", color: "#fff", fontSize: "10px" }}>you</div>}
    </div>
  );
}

const styles = {
  row: { display: "flex", alignItems: "flex-end", gap: "10px", marginBottom: "16px" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#e8e2da", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 },
  bubble: { maxWidth: "68%", padding: "14px 18px", borderRadius: "18px", lineHeight: "1.65" },
  userBubble: { background: "#c17f5a", borderBottomRightRadius: "4px" },
  aiBubble: { background: "#fffefcee", border: "1px solid #e8e2da", borderBottomLeftRadius: "4px", boxShadow: "0 1px 8px rgba(44,36,32,0.06)" },
  crisisBubble: { background: "#fdf2f2", border: "1px solid #f5c6c6" },
  text: { fontSize: "14.5px", fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-wrap" },
  stageTag: { display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" },
  stageDot: { width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 },
  stageLabel: { fontSize: "11px", color: "#9e918a", textTransform: "capitalize", letterSpacing: "0.5px" },
};