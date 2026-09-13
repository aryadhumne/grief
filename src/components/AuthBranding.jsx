import { useEffect, useState } from "react";

const TAGLINES = [
  "Practice the interview. Process the grief.",
  "A space to prepare, and a space to feel.",
  "Progress you can see. Support you can lean on.",
];

export default function AuthBranding() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % TAGLINES.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="auth-orbs-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-branding-content">
        <p className="auth-logo">grief.</p>
        <p key={i} className="auth-tagline">{TAGLINES[i]}</p>

        <div className="auth-pills">
          <span className="auth-pill auth-pill-practice">Interview practice</span>
          <span className="auth-pill auth-pill-companion">Grief companion</span>
        </div>
      </div>
    </>
  );
}