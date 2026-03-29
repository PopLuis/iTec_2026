// client/src/components/Dashboard.jsx
import { useState, useEffect, useRef } from "react";
import { useToast } from "@chakra-ui/react";
import styles from "./Dashboard.module.css";

const generateRoomId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

function getProjects(username) {
  try { return JSON.parse(localStorage.getItem(`itec_projects_${username}`) || "[]"); }
  catch { return []; }
}

function saveProjects(username, projects) {
  localStorage.setItem(`itec_projects_${username}`, JSON.stringify(projects));
}

// Pinguinul ca SVG inline — nu depinde de assets externe
const PenguinSVG = ({ size = 64 }) => (
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
    <text x="55" y="50" fontSize="22" fill="white" fontWeight="bold" fontFamily="system-ui">z</text>
    <text x="72" y="35" fontSize="18" fill="white" fontWeight="bold" fontFamily="system-ui">z</text>
    <text x="86" y="22" fontSize="14" fill="white" fontWeight="bold" fontFamily="system-ui">z</text>
  </svg>
);

// Mesaje random ale pinguinului
const PENGUIN_MESSAGES = [
  "Ai commituit codul azi?",
  "Nu uita să dai push!",
  "iTECify te salută!",
  "Merge proiectul?",
  "Pauza de cod? Eu dorm...",
  "Push it. Push it real good.",
  "Bug-uri? Nu la mine.",
  "Bun venit la bord!",
];

function Dashboard({ username, onJoin, onSwitchUser, onLogout }) {
  const [projects, setProjects]         = useState([]);
  const [newName, setNewName]           = useState("");
  const [joinCode, setJoinCode]         = useState("");
  const [mode, setMode]                 = useState(null);
  const [search, setSearch]             = useState("");
  const [showModal, setShowModal]       = useState(false);
  const [newUser, setNewUser]           = useState("");
  const [newPass, setNewPass]           = useState("");
  // Easter egg
  const [penguinVisible, setPenguinVisible] = useState(false);
  const [penguinMsg, setPenguinMsg]         = useState("");
  const [showTooltip, setShowTooltip]       = useState(false);
  const penguinTimer = useRef(null);
  const toast = useToast();

  useEffect(() => {
    setProjects(getProjects(username));
  }, [username]);

  // Easter egg — apare după 8 secunde de inactivitate
  useEffect(() => {
    const show = () => {
      setPenguinMsg(PENGUIN_MESSAGES[Math.floor(Math.random() * PENGUIN_MESSAGES.length)]);
      setPenguinVisible(true);
      setShowTooltip(true);
      penguinTimer.current = setTimeout(() => {
        setShowTooltip(false);
        setTimeout(() => setPenguinVisible(false), 400);
      }, 4000);
    };

    const reset = () => {
      clearTimeout(penguinTimer.current);
      setPenguinVisible(false);
      setShowTooltip(false);
      penguinTimer.current = setTimeout(show, 12000);
    };

    penguinTimer.current = setTimeout(show, 8000);
    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);

    return () => {
      clearTimeout(penguinTimer.current);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
    };
  }, []);

  function createProject() {
    if (!newName.trim()) {
      toast({ title: "Introdu un nume", status: "warning", duration: 2000 }); return;
    }
    const project = {
      id: generateRoomId(),
      name: newName.trim(),
      icon: null,
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      owner: username,
    };
    const updated = [project, ...projects];
    setProjects(updated);
    saveProjects(username, updated);
    setNewName(""); setMode(null);
    onJoin({ roomId: project.id, projectName: project.name });
  }

  function joinByCode() {
    const id = joinCode.trim().toUpperCase();
    if (id.length < 4) {
      toast({ title: "Cod invalid", status: "warning", duration: 2000 }); return;
    }
    const exists = projects.find(p => p.id === id);
    if (!exists) {
      const project = {
        id, name: `Proiect ${id}`, icon: null,
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
        owner: "shared",
      };
      const updated = [project, ...projects];
      setProjects(updated);
      saveProjects(username, updated);
    } else {
      const updated = projects.map(p => p.id === id ? { ...p, lastOpenedAt: new Date().toISOString() } : p);
      setProjects(updated);
      saveProjects(username, updated);
    }
    setJoinCode(""); setMode(null);
    onJoin({ roomId: id, projectName: exists?.name || `Proiect ${id}` });
  }

  function openProject(project) {
    const updated = projects.map(p => p.id === project.id ? { ...p, lastOpenedAt: new Date().toISOString() } : p);
    setProjects(updated);
    saveProjects(username, updated);
    onJoin({ roomId: project.id, projectName: project.name });
  }

  function deleteProject(e, id) {
    e.stopPropagation();
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveProjects(username, updated);
  }

  function renameProject(e, project) {
    e.stopPropagation();
    const val = prompt("Nume nou:", project.name);
    if (!val?.trim()) return;
    const updated = projects.map(p => p.id === project.id ? { ...p, name: val.trim() } : p);
    setProjects(updated);
    saveProjects(username, updated);
  }

  function copyCode(e, id) {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    toast({ title: `Cod copiat: ${id}`, status: "success", duration: 1500 });
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return "acum";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString("ro-RO");
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const myProjects     = filtered.filter(p => p.owner === username);
  const sharedProjects = filtered.filter(p => p.owner !== username);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoImg}>
            <PenguinSVG size={28} />
          </div>
          <div>
            <div className={styles.logoName}>iTECify</div>
            <div className={styles.logoSub}>Editor colaborativ · iTec 2026</div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <button className={styles.userBtn} onClick={() => setShowModal(true)}>
            <div className={styles.userAvatar}>{username[0]?.toUpperCase()}</div>
            <span className={styles.userName}>{username}</span>
            <span className={styles.chevron}>▾</span>
          </button>
          <button className={styles.logoutBtn} onClick={onLogout}>Ieși</button>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.pageTop}>
          <div>
            <h1 className={styles.pageTitle}>Proiectele tale</h1>
            <p className={styles.pageSubtitle}>
              {username} · {projects.length} proiect{projects.length !== 1 ? "e" : ""}
            </p>
          </div>
          <input
            className={styles.searchInput}
            placeholder="Caută proiect..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Action buttons */}
        {!mode && (
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={() => setMode("create")}>
              <span>+</span> Proiect nou
            </button>
            <button className={styles.btnSecondary} onClick={() => setMode("join")}>
              Intră cu cod
            </button>
          </div>
        )}

        {/* Create form */}
        {mode === "create" && (
          <div className={styles.formBox}>
            <div className={styles.formTitle}>Proiect nou</div>
            <div className={styles.formSub}>Se va genera un cod unic pentru colaborare</div>
            <div className={styles.formRow}>
              <input
                className={styles.formInput}
                placeholder="Nume proiect..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") createProject();
                  if (e.key === "Escape") { setMode(null); setNewName(""); }
                }}
              />
              <button className={styles.btnConfirm} onClick={createProject}>Creează</button>
              <button className={styles.btnCancel} onClick={() => { setMode(null); setNewName(""); }}>Anulează</button>
            </div>
          </div>
        )}

        {/* Join form */}
        {mode === "join" && (
          <div className={styles.formBox}>
            <div className={styles.formTitle}>Intră cu cod</div>
            <div className={styles.formSub}>Codul îl primești de la creatorul proiectului</div>
            <div className={styles.formRow}>
              <input
                className={`${styles.formInput} ${styles.formInputCode}`}
                placeholder="A3B7K2"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                autoFocus
                maxLength={8}
                onKeyDown={e => {
                  if (e.key === "Enter") joinByCode();
                  if (e.key === "Escape") { setMode(null); setJoinCode(""); }
                }}
              />
              <button className={styles.btnConfirm} onClick={joinByCode}>Intră</button>
              <button className={styles.btnCancel} onClick={() => { setMode(null); setJoinCode(""); }}>Anulează</button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && !mode && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>
              {search ? "Niciun proiect găsit" : "Nu ai niciun proiect încă"}
            </p>
            <p className={styles.emptyHint}>
              {search ? "Încearcă alt termen" : "Apasă Proiect nou sau intră cu un cod"}
            </p>
          </div>
        )}

        {/* My projects */}
        {myProjects.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Proiectele mele</span>
              <span className={styles.sectionCount}>{myProjects.length}</span>
            </div>
            <div className={styles.grid}>
              {myProjects.map(p => (
                <ProjectCard key={p.id} project={p} username={username}
                  onOpen={() => openProject(p)}
                  onDelete={e => deleteProject(e, p.id)}
                  onRename={e => renameProject(e, p)}
                  onCopy={e => copyCode(e, p.id)}
                  formatDate={formatDate} />
              ))}
            </div>
          </div>
        )}

        {/* Shared projects */}
        {sharedProjects.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Proiecte comune</span>
              <span className={styles.sectionCount}>{sharedProjects.length}</span>
            </div>
            <div className={styles.grid}>
              {sharedProjects.map(p => (
                <ProjectCard key={p.id} project={p} username={username}
                  onOpen={() => openProject(p)}
                  onDelete={e => deleteProject(e, p.id)}
                  onRename={e => renameProject(e, p)}
                  onCopy={e => copyCode(e, p.id)}
                  formatDate={formatDate} isShared />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Easter egg penguin */}
      <div
        className={`${styles.easterEgg} ${penguinVisible ? styles.easterEggVisible : ""}`}
        onClick={() => {
          setPenguinMsg(PENGUIN_MESSAGES[Math.floor(Math.random() * PENGUIN_MESSAGES.length)]);
          setShowTooltip(true);
          clearTimeout(penguinTimer.current);
          penguinTimer.current = setTimeout(() => setShowTooltip(false), 3000);
        }}
      >
        {showTooltip && (
          <div className={styles.easterEggTooltip}>{penguinMsg}</div>
        )}
        <PenguinSVG size={64} />
      </div>

      {/* Switch user modal */}
      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Schimbă utilizatorul</h2>
            <p className={styles.modalSub}>Conectat ca <strong>{username}</strong></p>
            <input className={styles.modalInput} placeholder="Utilizator nou"
              value={newUser} onChange={e => setNewUser(e.target.value)} autoFocus />
            <input className={styles.modalInput} placeholder="Parolă" type="password"
              value={newPass} onChange={e => setNewPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSwitchUser()} />
            <div className={styles.modalActions}>
              <button className={styles.btnConfirm} style={{ flex: 1 }} onClick={onSwitchUser}>
                Schimbă
              </button>
              <button className={styles.btnCancel} style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                Anulează
              </button>
            </div>
            <button className={styles.btnDanger} onClick={onLogout}>
              Deconectează-te complet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, username, onOpen, onDelete, onRename, onCopy, formatDate, isShared }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`${styles.card} ${isShared ? styles.cardShared : ""}`}
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div className={styles.cardActions} onClick={e => e.stopPropagation()}>
          <button className={styles.cardActionBtn} onClick={onRename} title="Redenumește">✎</button>
          <button className={`${styles.cardActionBtn} ${styles.cardActionBtnDelete}`}
            onClick={onDelete} title="Șterge">×</button>
        </div>
      )}

      <div className={styles.cardTop}>
        <div className={styles.cardIconBox}>
          <PenguinSVG size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className={styles.cardName}>{project.name}</p>
          <p className={`${styles.cardOwner} ${isShared ? styles.cardOwnerShared : ""}`}>
            {isShared ? "proiect comun" : "al tău"}
          </p>
        </div>
      </div>

      <div className={styles.cardBottom}>
        <button className={styles.cardCode} onClick={onCopy} title="Copiază codul">
          {project.id}
        </button>
        <span className={styles.cardDate}>{formatDate(project.lastOpenedAt)}</span>
      </div>
    </div>
  );
}

export default Dashboard;