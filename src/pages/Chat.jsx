import { useState, useRef, useEffect } from "react";
import ChatBubble from "../components/ChatBubble";
import TypingIndicator from "../components/TypingIndicator";

const API = "http://localhost:5000/api";

const GREETINGS = [
  "I'm here with you. Take your time — there's no rush.",
  "This is a safe space. Share whatever feels right.",
  "Grief has no timeline. I'm here whenever you need.",
];

export default function Chat({ sessionId }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
      stage: "neutral",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN";

    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      setError("Voice input is not supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Stop voice if active
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    }

    setInput("");
    setError(null);

    // Add user message immediately
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          stage: data.stage,
          sentiment: data.sentiment,
          isCrisis: data.is_crisis,
        },
      ]);

      // Speak the reply aloud
      if (window.speechSynthesis && !data.is_crisis) {
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.lang = "en-IN";
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      setError("Could not reach the server. Make sure Flask is running on port 5000.");
      setMessages((prev) => prev.slice(0, -1)); // remove user message on error
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Companion</h1>
          <p style={styles.subtitle}>A gentle space to share what you're carrying</p>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messageArea}>
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            stage={msg.stage}
            delay={0}
          />
        ))}
        {loading && <TypingIndicator />}
        {error && (
          <div style={styles.errorBanner}>⚠️ {error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={styles.inputArea}>
        <div style={styles.inputRow}>
          {/* Voice button */}
          <button
            onClick={toggleVoice}
            style={{
              ...styles.voiceBtn,
              ...(listening ? styles.voiceBtnActive : {}),
            }}
            title={listening ? "Stop listening" : "Speak your message"}
          >
            {listening ? (
              <span style={styles.listeningDot} />
            ) : (
              "🎙"
            )}
          </button>

          {/* Text input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              listening
                ? "Listening… speak now"
                : "Share what's on your heart… (Enter to send)"
            }
            rows={1}
            style={{
              ...styles.textarea,
              ...(listening ? styles.textareaListening : {}),
            }}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            style={{
              ...styles.sendBtn,
              opacity: !input.trim() || loading ? 0.4 : 1,
            }}
          >
            ↑
          </button>
        </div>

        {listening && (
          <p style={styles.listeningHint}>
            🎙 Listening… press the mic again or press Enter when done
          </p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#f7f4f0",
  },
  header: {
    padding: "20px 28px 16px",
    borderBottom: "1px solid #e8e2da",
    background: "#f7f4f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "'Lora', serif",
    fontSize: "20px",
    fontWeight: "500",
    color: "#2c2420",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    fontSize: "13px",
    color: "#9e918a",
    marginTop: "2px",
    fontStyle: "italic",
  },
  messageArea: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 28px",
    display: "flex",
    flexDirection: "column",
  },
  inputArea: {
    padding: "16px 24px 20px",
    borderTop: "1px solid #e8e2da",
    background: "#f0ece6",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-end",
  },
  voiceBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "1px solid #ddd8d0",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
    transition: "all 0.2s",
  },
  voiceBtnActive: {
    background: "#fdf2f2",
    border: "1.5px solid #b85c5c",
    animation: "breathe 1.5s ease-in-out infinite",
  },
  listeningDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#b85c5c",
    display: "block",
    animation: "pulse 1s ease-in-out infinite",
  },
  textarea: {
    flex: 1,
    resize: "none",
    border: "1px solid #ddd8d0",
    borderRadius: "14px",
    padding: "11px 16px",
    fontSize: "14.5px",
    fontFamily: "'DM Sans', sans-serif",
    background: "#fff",
    color: "#2c2420",
    outline: "none",
    lineHeight: "1.5",
    transition: "border-color 0.2s",
    maxHeight: "120px",
    overflowY: "auto",
  },
  textareaListening: {
    border: "1.5px solid #b85c5c",
    background: "#fdf9f9",
  },
  sendBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "none",
    background: "#c17f5a",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s",
    fontWeight: "500",
  },
  listeningHint: {
    fontSize: "12px",
    color: "#b85c5c",
    marginTop: "8px",
    textAlign: "center",
    fontStyle: "italic",
  },
  errorBanner: {
    background: "#fdf2f2",
    border: "1px solid #f5c6c6",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "13px",
    color: "#b85c5c",
    marginBottom: "12px",
    textAlign: "center",
  },
};