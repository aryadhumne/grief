import { useEffect, useRef, useState } from "react";

const PHASES = [
  { name: "Breathe in", seconds: 4, scale: 1.4 },
  { name: "Hold", seconds: 4, scale: 1.4 },
  { name: "Breathe out", seconds: 4, scale: 0.8 },
  { name: "Hold", seconds: 4, scale: 0.8 },
];

export default function BreathingExercise() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].seconds);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;

        setPhaseIndex((p) => {
          const next = (p + 1) % PHASES.length;
          if (next === 0) setCycles((c) => c + 1);
          return next;
        });
        return null; // placeholder, corrected below
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Reset the countdown whenever the phase changes
  useEffect(() => {
    setSecondsLeft(PHASES[phaseIndex].seconds);
  }, [phaseIndex]);

  const toggle = () => {
    if (running) {
      clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      setPhaseIndex(0);
      setCycles(0);
      setSecondsLeft(PHASES[0].seconds);
      setRunning(true);
    }
  };

  const phase = PHASES[phaseIndex];

  return (
    <div className="breathing-page fade-up">
      <div className="companion-header">
        <h2>Breathing exercise</h2>
        <p className="home-sub">A minute of box breathing — in, hold, out, hold, on repeat.</p>
      </div>

      <div className="breathing-stage">
        <div
          className="breathing-circle"
          style={{ transform: `scale(${running ? phase.scale : 1})` }}
        >
          <span className="breathing-phase">{running ? phase.name : "Ready"}</span>
          {running && <span className="breathing-count">{secondsLeft}</span>}
        </div>
      </div>

      <p className="breathing-cycles">Cycles completed: {cycles}</p>

      <button type="button" onClick={toggle} className="breathing-toggle">
        {running ? "Stop" : "Start"}
      </button>
    </div>
  );
}