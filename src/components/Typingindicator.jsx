export default function TypingIndicator() {
  return (
    <div style={styles.row}>
      <div style={styles.avatar}>🕊</div>
      <div style={styles.bubble}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ ...styles.dot, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  row: {
    display: "flex",
    alignItems: "flex-end",
    gap: "10px",
    marginBottom: "16px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#e8e2da",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    flexShrink: 0,
  },
  bubble: {
    background: "#fffefcee",
    border: "1px solid #e8e2da",
    borderRadius: "18px",
    borderBottomLeftRadius: "4px",
    padding: "14px 18px",
    display: "flex",
    gap: "5px",
    alignItems: "center",
  },
  dot: {
    display: "inline-block",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#c4b5a5",
    animation: "pulse 1.2s ease-in-out infinite",
  },
};