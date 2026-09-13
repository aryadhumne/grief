import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/Themecontext";

export default function Sidebar() {
  const { username, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <h1 className="sidebar-title">grief.</h1>

      <nav className="section-home">
        <NavLink to="/home" className={({ isActive }) => (isActive ? "active" : "")}>Home</NavLink>
      </nav>

      <div className="sidebar-section-label">Companion</div>
      <nav className="section-companion">
        <NavLink to="/chat" className={({ isActive }) => (isActive ? "active" : "")}>Chat</NavLink>
        <NavLink to="/mood" className={({ isActive }) => (isActive ? "active" : "")}>Mood</NavLink>
        <NavLink to="/journal" className={({ isActive }) => (isActive ? "active" : "")}>Journal</NavLink>
        <NavLink to="/letters" className={({ isActive }) => (isActive ? "active" : "")}>Letters</NavLink>
        <NavLink to="/breathing" className={({ isActive }) => (isActive ? "active" : "")}>Breathing</NavLink>
      </nav>

      <nav className="section-practice">
        <NavLink to="/interview" className={({ isActive }) => (isActive ? "active" : "")}>Interview</NavLink>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <p>{username}</p>
        <button onClick={logout}>Log out</button>
      </div>
    </aside>
  );
}