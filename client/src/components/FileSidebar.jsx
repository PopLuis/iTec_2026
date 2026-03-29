// client/src/components/FileSidebar.jsx
import { useState, useRef } from "react";
import styles from "./FileSidebar.module.css";

const FILE_COLORS = {
  js: "#e8d44d", jsx: "#61dafb", ts: "#3178c6", tsx: "#61dafb",
  py: "#3572A5", html: "#e44b23", css: "#563d7c", json: "#cbcb41",
  md: "#cccccc", rs: "#dea584", go: "#00add8", java: "#b07219",
  cpp: "#f34b7d", sql: "#e38c00", sh: "#89e051",
};

const FILE_LABELS = {
  js: "JS", jsx: "JSX", ts: "TS", tsx: "TSX",
  py: "PY", html: "HTM", css: "CSS", json: "JSN",
  md: "MD", rs: "RS", go: "GO", java: "JV",
  cpp: "C++", sql: "SQL", sh: "SH",
};

function getExt(name) {
  return name.split(".").pop().toLowerCase();
}

const FileSidebar = ({
  files, activeFile, onSelectFile, onCreateFile, onDeleteFile,
  projectName, roomId, users, currentSocketId,
}) => {
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [hoveredFile, setHoveredFile] = useState(null);
  const inputRef = useRef(null);

  function handleCreate() {
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName(""); setShowNewFile(false);
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>Explorer</span>
        <button className={styles.addBtn}
          onClick={() => { setShowNewFile(v => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
          title="Fișier nou">+</button>
      </div>

      {/* Project name */}
      <div className={styles.projectName}>{projectName || roomId}</div>

      {/* New file input */}
      {showNewFile && (
        <div className={styles.newFileArea}>
          <input
            ref={inputRef}
            className={styles.newFileInput}
            placeholder="filename.js"
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setShowNewFile(false); setNewFileName(""); }
            }}
          />
          <button className={styles.newFileOk} onClick={handleCreate}>OK</button>
        </div>
      )}

      {/* Files */}
      <div className={styles.fileList}>
        {files.map(file => {
          const ext = getExt(file.name);
          const color = FILE_COLORS[ext] || "#cccccc";
          const label = FILE_LABELS[ext] || ext.toUpperCase().slice(0, 3);
          const isActive = activeFile === file.name;
          const usersOnFile = users?.filter(u => u.id !== currentSocketId && u.currentFile === file.name) || [];

          return (
            <div
              key={file.name}
              className={`${styles.fileItem} ${isActive ? styles.fileItemActive : ""}`}
              onClick={() => onSelectFile(file)}
              onMouseEnter={() => setHoveredFile(file.name)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              <span className={styles.fileBadge} style={{ color }}>{label}</span>
              <span className={`${styles.fileName} ${isActive ? styles.fileNameActive : ""}`}>
                {file.name}
              </span>

              {usersOnFile.length > 0 && (
                <div className={styles.userDots}>
                  {usersOnFile.slice(0, 2).map((u, i) => (
                    <div key={i} className={styles.userDot}
                      style={{ background: u.color || "#4ec994" }} title={u.username} />
                  ))}
                </div>
              )}

              {hoveredFile === file.name && (
                <button className={styles.deleteBtn}
                  onClick={e => { e.stopPropagation(); onDeleteFile(file.name); }}
                  title="Șterge">×</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Online users */}
      <div className={styles.onlineSection}>
        <div className={styles.onlineTitle}>Online</div>
        {users?.slice(0, 5).map((u, i) => (
          <div key={i} className={styles.onlineUser}>
            <div className={styles.onlineDot} style={{ background: u.color || "#4ec994" }} />
            <span className={styles.onlineUsername}>
              {u.username}{u.id === currentSocketId ? " (tu)" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileSidebar;