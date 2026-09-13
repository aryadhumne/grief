import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthBranding from "../components/AuthBranding";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(username, email, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <AuthBranding />

      <form onSubmit={handleSubmit} className="auth-form auth-form-glass">
        <p className="auth-kicker">Get started</p>
        <h2>Create account</h2>
        {error && <p className="auth-error">{error}</p>}
        {done && <p className="auth-success">Registered! Redirecting to login…</p>}

        <label className="auth-field">
          <span>Username</span>
          <input placeholder="yourname" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>

        <label className="auth-field">
          <span>Email</span>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <button type="submit" className="auth-submit">Register</button>

        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </form>
    </div>
  );
}