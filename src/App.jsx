import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/Themecontext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Footer from "./components/footer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Interview from "./pages/interview";
import Report from "./pages/Report";
import Chat from "./pages/Chat";
import MoodTracker from "./pages/MoodTracker";
import Journal from "./pages/Journal";
import Letters from "./pages/Letters";
import BreathingExercise from "./pages/Breathexercise";
import "./index.css";

function Shell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/home"
              element={<ProtectedRoute><Shell><Home /></Shell></ProtectedRoute>}
            />
            <Route
              path="/interview"
              element={<ProtectedRoute><Shell><Interview /></Shell></ProtectedRoute>}
            />
            <Route
              path="/report/:sessionId"
              element={<ProtectedRoute><Shell><Report /></Shell></ProtectedRoute>}
            />
            <Route
              path="/chat"
              element={<ProtectedRoute><Shell><Chat /></Shell></ProtectedRoute>}
            />
            <Route
              path="/mood"
              element={<ProtectedRoute><Shell><MoodTracker /></Shell></ProtectedRoute>}
            />
            <Route
              path="/journal"
              element={<ProtectedRoute><Shell><Journal /></Shell></ProtectedRoute>}
            />
            <Route
              path="/letters"
              element={<ProtectedRoute><Shell><Letters /></Shell></ProtectedRoute>}
            />
            <Route
              path="/breathing"
              element={<ProtectedRoute><Shell><BreathingExercise /></Shell></ProtectedRoute>}
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}