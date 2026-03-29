// client/src/components/JoinRoom.jsx
import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import styles from "./JoinRoom.module.css";

const generateRoomId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// Pinguinul — același ca în Dashboard
const PenguinSVG = ({ size = 28 }) => (
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

const JoinRoom = ({ onJoin, onClose }) => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId]     = useState("");
  const [mode, setMode]         = useState(null);
  const toast = useToast();

  const handleSubmit = () => {
    if (!username.trim()) {
      toast({ title: "Introdu un nume de utilizator", status: "warning", duration: 2000 });
      return;
    }
    const finalRoomId = mode === "create" ? generateRoomId() : roomId.trim().toUpperCase();
    if (mode === "join" && !finalRoomId) {
      toast({ title: "Introdu ID-ul camerei", status: "warning", duration: 2000 });
      return;
    }
    onJoin({ username: username.trim(), roomId: finalRoomId });
  };

  return (
    <div className={styles.page}>
      <div className={styles.cardWrapper}>

        {/* Buton X */}
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} title="Închide">×</button>
        )}

        <div className={styles.card}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.logoRow}>
              <div className={styles.logoBox}>
                <PenguinSVG size={28} />
              </div>
              <div>
                <p className={styles.logoName}>iTECify</p>
                <p className={styles.logoSub}>iTec 2026</p>
              </div>
            </div>
            <p className={styles.subtitle}>Editor colaborativ în timp real</p>
          </div>

          {/* Username */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nume utilizator</label>
            <input
              className={styles.input}
              placeholder="ex: PopLuis"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && mode && handleSubmit()}
              autoFocus
            />
          </div>

          {/* Mode selector */}
          {!mode && (
            <div className={styles.btnGroup}>
              <button className={styles.btnPrimary} onClick={() => setMode("create")}>
                + Creează cameră nouă
              </button>
              <div className={styles.divider}>
                <div className={styles.dividerLine} />
                <span>sau</span>
                <div className={styles.dividerLine} />
              </div>
              <button className={styles.btnSecondary} onClick={() => setMode("join")}>
                Intră într-o cameră
              </button>
            </div>
          )}

          {/* Join mode */}
          {mode === "join" && (
            <>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>ID Cameră</label>
                <input
                  className={`${styles.input} ${styles.inputCode}`}
                  placeholder="ABC123"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  maxLength={8}
                />
              </div>
              <div className={styles.btnRow}>
                <button className={styles.btnBack}
                  onClick={() => { setMode(null); setRoomId(""); }}>
                  Înapoi
                </button>
                <button className={styles.btnConfirm} onClick={handleSubmit}>
                  Intră
                </button>
              </div>
            </>
          )}

          {/* Create mode */}
          {mode === "create" && (
            <div className={styles.btnRow}>
              <button className={styles.btnBack} onClick={() => setMode(null)}>
                Înapoi
              </button>
              <button className={styles.btnConfirm} onClick={handleSubmit}>
                Creează
              </button>
            </div>
          )}

          <p className={styles.footer}>iTECify · Editor colaborativ</p>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;