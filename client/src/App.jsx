// client/src/App.jsx
import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import CodeEditor from "./components/CodeEditor";
import { authApi } from "./services/api";
import styles from "./App.module.css";

const PenguinSVG = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="100" cy="130" rx="60" ry="65" fill="#1a3a5c"/>
    <ellipse cx="100" cy="130" rx="35" ry="45" fill="#a8c8e8"/>
    <ellipse cx="100" cy="80" rx="40" ry="45" fill="#1a3a5c"/>
    <ellipse cx="100" cy="72" rx="22" ry="25" fill="#a8c8e8"/>
    <ellipse cx="88" cy="68" rx="7" ry="8" fill="#1a3a5c"/>
    <ellipse cx="112" cy="68" rx="7" ry="8" fill="#1a3a5c"/>
    <ellipse cx="89" cy="67" rx="3" ry="3.5" fill="white"/>
    <ellipse cx="113" cy="67" rx="3" ry="3.5" fill="white"/>
    <ellipse cx="100" cy="78" rx="7" ry="4" fill="#f4a261"/>
    <ellipse cx="65" cy="115" rx="18" ry="10" fill="#1a3a5c" transform="rotate(-30 65 115)"/>
    <ellipse cx="135" cy="115" rx="18" ry="10" fill="#1a3a5c" transform="rotate(30 135 115)"/>
    <ellipse cx="82" cy="185" rx="14" ry="8" fill="#f4a261"/>
    <ellipse cx="118" cy="185" rx="14" ry="8" fill="#f4a261"/>
  </svg>
);

// ── Auth Screen ───────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode]         = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      setError("Completează toate câmpurile"); return;
    }
    setLoading(true); setError("");
    try {
      const data = mode === "login"
        ? await authApi.login(username.trim(), password)
        : await authApi.register(username.trim(), password);
      localStorage.setItem("itec_token", data.token);
      localStorage.setItem("itec_username", data.user.username);
      onLogin(data.user.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logoRow}>
          <div className={styles.logoBox}>
            <PenguinSVG size={32} />
          </div>
          <div>
            <p className={styles.logoName}>iTECify</p>
            <p className={styles.logoSub}>iTec 2026</p>
          </div>
        </div>
        <p className={styles.subtitle}>
          {mode === "login" ? "Bun venit înapoi!" : "Creează un cont nou"}
        </p>

        {/* Toggle */}
        <div className={styles.toggle}>
          {["login", "register"].map(m => (
            <button key={m}
              className={`${styles.toggleBtn} ${mode === m ? styles.toggleBtnActive : ""}`}
              onClick={() => { setMode(m); setError(""); }}>
              {m === "login" ? "Intră" : "Înregistrare"}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Nume utilizator</label>
          <input className={styles.input}
            placeholder="ex: PopLuis"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Parolă</label>
          <input className={styles.input}
            placeholder="minim 4 caractere"
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {error && (
          <p style={{ color: "#f85149", fontSize: "12px", marginBottom: "8px" }}>{error}</p>
        )}

        <button
          className={`${styles.submitBtn} ${loading ? styles.submitBtnLoading : ""}`}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Se procesează..." : mode === "login" ? "Intră" : "Creează cont"}
        </button>

        <p className={styles.footer}>Datele sunt stocate în siguranță în MongoDB</p>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [username, setUsername]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [screen, setScreen]       = useState("dashboard");
  const [session, setSession]     = useState({ roomId: "", projectName: "" });
  const [showSwitch, setShowSwitch] = useState(false);
  const [newUser, setNewUser]     = useState("");
  const [newPass, setNewPass]     = useState("");
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchError, setSwitchError]     = useState("");

  useEffect(() => {
    const token = localStorage.getItem("itec_token");
    const saved = localStorage.getItem("itec_username");
    if (token && saved) {
      authApi.me()
        .then(() => setUsername(saved))
        .catch(() => {
          localStorage.removeItem("itec_token");
          localStorage.removeItem("itec_username");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function handleLogin(name) {
    setUsername(name);
    setScreen("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("itec_token");
    localStorage.removeItem("itec_username");
    setUsername(null);
    setScreen("dashboard");
    setSession({ roomId: "", projectName: "" });
  }

  async function handleSwitchUser() {
    if (!newUser.trim() || !newPass.trim()) return;
    setSwitchLoading(true); setSwitchError("");
    try {
      const data = await authApi.login(newUser.trim(), newPass);
      localStorage.setItem("itec_token", data.token);
      localStorage.setItem("itec_username", data.user.username);
      setUsername(data.user.username);
      setNewUser(""); setNewPass("");
      setShowSwitch(false);
      setScreen("dashboard");
    } catch (err) {
      setSwitchError(err.message);
    } finally {
      setSwitchLoading(false);
    }
  }

  function handleJoin({ roomId, projectName }) {
    setSession({ roomId, projectName });
    setScreen("editor");
  }

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!username) return <AuthScreen onLogin={handleLogin} />;

  if (screen === "editor") {
    return (
      <CodeEditor
        username={username}
        roomId={session.roomId}
        projectName={session.projectName}
        onBack={() => setScreen("dashboard")}
      />
    );
  }

  return (
    <div>
      {/* Switch user modal */}
      {showSwitch && (
        <div className={styles.overlay} onClick={() => setShowSwitch(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Schimbă utilizatorul</h2>
            <p className={styles.modalSub}>
              Conectat ca <strong style={{ color: "#58a6ff" }}>{username}</strong>
            </p>
            <input className={styles.modalInput} placeholder="Nume utilizator"
              value={newUser} onChange={e => setNewUser(e.target.value)} autoFocus />
            <input className={styles.modalInput} placeholder="Parolă" type="password"
              value={newPass} onChange={e => setNewPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSwitchUser()} />
            {switchError && (
              <p style={{ color: "#f85149", fontSize: "12px", margin: "0 0 8px" }}>{switchError}</p>
            )}
            <div className={styles.modalActions}>
              <button className={styles.modalConfirm}
                onClick={handleSwitchUser} disabled={switchLoading}>
                {switchLoading ? "..." : "Schimbă"}
              </button>
              <button className={styles.modalCancel} onClick={() => setShowSwitch(false)}>
                Anulează
              </button>
            </div>
            <button className={styles.modalDanger} onClick={handleLogout}>
              Deconectează-te complet
            </button>
          </div>
        </div>
      )}

      <Dashboard
        username={username}
        onJoin={handleJoin}
        onSwitchUser={() => setShowSwitch(true)}
        onLogout={handleLogout}
      />
    </div>
  );
}