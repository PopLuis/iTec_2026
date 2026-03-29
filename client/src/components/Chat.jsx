// client/src/components/Chat.jsx
import { useState, useRef, useEffect } from "react";
import styles from "./Chat.module.css";

function MessageContent({ text, onTypewriteCode }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].replace("```", "").trim() || "code";
          const code = lines.slice(1, -1).join("\n");
          return (
            <div key={i} className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <span className={styles.codeLang}>{lang}</span>
                <div className={styles.codeActions}>
                  <button className={styles.codeInsertBtn}
                    onClick={() => onTypewriteCode(code)}>
                    Insert in Editor
                  </button>
                  <button className={styles.codeCopyBtn}
                    onClick={() => navigator.clipboard.writeText(code)}>
                    Copy
                  </button>
                </div>
              </div>
              <pre className={styles.codeContent}>{code}</pre>
            </div>
          );
        }
        return (
          <p key={i} style={{ color: "#cccccc", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
            {part}
          </p>
        );
      })}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Explică codul",     prompt: "Explică codul din editor pe scurt" },
  { label: "Fix bug",           prompt: "Găsește și fixează bug-urile din codul din editor. Returnează codul fix complet." },
  { label: "Optimizează",       prompt: "Optimizează codul din editor. Returnează codul optimizat complet." },
  { label: "Adaugă comentarii", prompt: "Adaugă comentarii explicative în codul din editor." },
  { label: "Generează teste",   prompt: "Generează teste pentru funcțiile din codul din editor." },
];

const Chat = ({ isOpen, onToggle, currentUser, getEditorCode, onTypewriteCode }) => {
  const [messages, setMessages] = useState([{
    id: 1, role: "assistant",
    text: "Bună ziua! Sunt asistentul AI integrat în editor.\n\nPot să explic cod, să fixez erori sau să generez funcții noi. Apasă **Insert in Editor** ca să scriu codul direct în editor — caracter cu caracter.",
  }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { id: Date.now(), role: "user", text }]);
    setLoading(true);
    try {
      const editorCode = getEditorCode?.() || "";
      const history = messages.filter(m => m.id !== 1).slice(-9)
        .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }));
      history.push({ role: "user", content: text });
      const response = await fetch("http://localhost:3001/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, editorCode }),
      });
      if (!response.ok) throw new Error("Server error " + response.status);
      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", text: data.text }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "assistant",
        text: "Eroare de conectare. Verificați că serverul rulează.",
      }]);
    } finally { setLoading(false); }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim()); setInput("");
  };

  const clearChat = () => setMessages([{
    id: Date.now(), role: "assistant",
    text: "Conversație resetată. Cu ce vă pot ajuta?",
  }]);

  if (!isOpen) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>AI Assistant</span>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn} onClick={clearChat} title="Resetează">↺</button>
          <button className={styles.iconBtn} onClick={onToggle} title="Închide">×</button>
        </div>
      </div>

      <div className={styles.quickActions}>
        {QUICK_ACTIONS.map(action => (
          <button key={action.label} className={styles.quickBtn}
            onClick={() => !loading && sendMessage(action.prompt)}>
            {action.label}
          </button>
        ))}
      </div>

      <div className={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id}
            className={`${styles.messageWrapper} ${msg.role === "user" ? styles.messageWrapperUser : styles.messageWrapperAssistant}`}>
            {msg.role === "assistant" && (
              <div className={styles.messageMeta}>AI Assistant</div>
            )}
            {msg.role === "user" && (
              <div className={`${styles.messageMeta} ${styles.messageMetaUser}`}>
                {currentUser || "Tu"}
              </div>
            )}
            <div className={msg.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant}>
              <MessageContent
                text={msg.text}
                onTypewriteCode={onTypewriteCode}
              />
            </div>
          </div>
        ))}

        {loading && (
          <div className={styles.messageWrapperAssistant}>
            <div className={styles.messageMeta}>AI Assistant</div>
            <p className={styles.loadingText}>Generează răspuns...</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Întreabă despre cod..."
          disabled={loading}
          onKeyDown={e => e.key === "Enter" && !loading && handleSend()}
        />
        <button
          className={`${styles.sendBtn} ${loading ? styles.sendBtnLoading : ""}`}
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chat;