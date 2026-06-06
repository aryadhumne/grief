const NAV = [
  { id: "chat",    icon: "💬", label: "Companion" },
  { id: "mood",    icon: "🌿", label: "Mood" },
  { id: "journal", icon: "📖", label: "Journal" },
];

export default function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <span style={styles.brandIcon}>🕊</span>
        <span style={styles.brandName}>EmpathAI</span>
      </div>
      <nav style={styles.nav}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)}
            style={{ ...styles.navBtn, ...(currentPage === item.id ? styles.navBtnActive : {}) }}>
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div style={styles.footer}>
        <p style={styles.footerText}>You are not alone.</p>
        <a href="tel:9152987821" style={styles.helpline}>🇮🇳 iCall: 9152987821</a>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: { width: "220px", minWidth: "220px", background: "#f0ece6", borderRight: "1px solid #ddd8d0", display: "flex", flexDirection: "column", padding: "24px 16px", gap: "8px" },
  brand: { display: "flex", alignItems: "center", gap: "10px", padding: "0 8px 24px", borderBottom: "1px solid #ddd8d0", marginBottom: "8px" },
  brandIcon: { fontSize: "22px" },
  brandName: { fontFamily: "'Lora', serif", fontSize: "18px", fontWeight: "500", color: "#2c2420" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: { display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "12px", border: "none", background: "transparent", color: "#6b5e58", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", width: "100%", textAlign: "left" },
  navBtnActive: { background: "#fffefccc", color: "#2c2420", fontWeight: "500", boxShadow: "0 1px 6px rgba(44,36,32,0.08)" },
  navIcon: { fontSize: "16px" },
  footer: { borderTop: "1px solid #ddd8d0", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "8px" },
  footerText: { fontSize: "12px", color: "#9e918a", fontStyle: "italic", fontFamily: "'Lora', serif", textAlign: "center" },
  helpline: { fontSize: "11px", color: "#b85c5c", textDecoration: "none", textAlign: "center", padding: "6px 8px", background: "#fdf2f2", borderRadius: "8px", display: "block" },
};