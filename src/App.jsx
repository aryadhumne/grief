import { useState } from "react";
import Chat from "./pages/Chat";
import MoodTracker from "./pages/MoodTracker";
import Journal from "./pages/Journal";
import Sidebar from "./components/Sidebar";
import "./index.css";

export default function App() {
  const [page, setPage] = useState("chat");
  const [sessionId] = useState(() => `user-${Date.now()}`);

  return (
    <div className="app-shell">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <main className="main-content">
        {page === "chat"    && <Chat sessionId={sessionId} />}
        {page === "mood"    && <MoodTracker userId={sessionId} />}
        {page === "journal" && <Journal userId={sessionId} />}
      </main>
    </div>
  );
}