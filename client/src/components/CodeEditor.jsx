// client/src/components/CodeEditor.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import UsersList from "./UsersList";
import Chat from "./Chat";
import FileSidebar from "./FileSidebar";
import { useSocket } from "../hooks/useSocket";
import styles from "./CodeEditor.module.css";

const TYPING_DEBOUNCE = 1500;

const DEFAULT_FILES = [
  { name: "main.js",    lang: "javascript", content: '// main.js\nconsole.log("Hello, iTec 2026!")\n' },
  { name: "index.html", lang: "html",        content: '<!DOCTYPE html>\n<html>\n<head><title>iTec</title></head>\n<body>\n  <h1>Hello!</h1>\n</body>\n</html>\n' },
  { name: "style.css",  lang: "css",         content: 'body {\n  background: #1e1e1e;\n  color: white;\n}\n' },
  { name: "README.md",  lang: "markdown",    content: '# Proiect iTec 2026\n\nEditor colaborativ în timp real.\n' },
];

function detectLang(name) {
  if (name.toLowerCase() === "dockerfile") return "dockerfile";
  const ext = name.split(".").pop().toLowerCase();
  const map = {
    js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
    py: "python", html: "html", css: "css", json: "json",
    md: "markdown", yaml: "yaml", yml: "yaml", rs: "rust",
    go: "go", java: "java", cpp: "cpp", sql: "sql", sh: "shell",
  };
  return map[ext] || "javascript";
}

function loadFiles(roomId) {
  try {
    const saved = JSON.parse(localStorage.getItem(`itec_files_${roomId}`) || "null");
    return saved || DEFAULT_FILES;
  } catch { return DEFAULT_FILES; }
}

function saveFiles(roomId, files) {
  localStorage.setItem(`itec_files_${roomId}`, JSON.stringify(files));
}

const CodeEditor = ({ username, roomId, projectName, onBack }) => {
  const editorRef      = useRef();
  const decorationsRef = useRef({});
  const widgetsRef     = useRef({});
  const cursorTimerRef = useRef(null);
  const labelTimersRef = useRef({});
  const typewriterRef  = useRef(null); // interval typewriter
  const toast          = useToast();
  const isRemoteChange = useRef(false);
  const typingTimer    = useRef(null);

  const [isTyping, setIsTyping]       = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMsgCount = useRef(0);

  // Typewriter state
  const [isTypewriting, setIsTypewriting] = useState(false);
  const [pendingCode, setPendingCode]     = useState(null);
  const [originalCode, setOriginalCode]   = useState(null);
  const [typewrittenSoFar, setTypewrittenSoFar] = useState("");

  const [files, setFiles]           = useState(() => loadFiles(roomId));
  const [activeFile, setActiveFile] = useState(files[0]);
  const [language, setLanguage]     = useState(files[0]?.lang || "javascript");
  const [value, setValue]           = useState(files[0]?.content || "");

  const {
    isConnected, users, messages, typingUsers,
    remoteCursors, remoteCodeUpdate, remoteLanguageUpdate,
    fileContent, remoteFileCreated, remoteFileDeleted,
    emitOpenFile, emitCreateFile, emitDeleteFile,
    emitCodeChange, emitLanguageChange,
    emitCursorMove, emitTyping, socketId,
  } = useSocket(roomId, username);

  useEffect(() => {
    if (isConnected && activeFile) emitOpenFile(activeFile.name);
  }, [isConnected]);

  useEffect(() => {
    if (!remoteFileCreated) return;
    setFiles(prev => {
      if (prev.find(f => f.name === remoteFileCreated.fileName)) return prev;
      const newFile = { name: remoteFileCreated.fileName, lang: remoteFileCreated.lang, content: remoteFileCreated.content };
      const updated = [...prev, newFile];
      saveFiles(roomId, updated);
      toast({ title: `${remoteFileCreated.fileName} adăugat`, status: "info", duration: 2000, position: "bottom-right" });
      return updated;
    });
  }, [remoteFileCreated]);

  useEffect(() => {
    if (!remoteFileDeleted) return;
    const { fileName } = remoteFileDeleted;
    setFiles(prev => {
      const updated = prev.filter(f => f.name !== fileName);
      saveFiles(roomId, updated);
      if (activeFile?.name === fileName && updated.length > 0) {
        setActiveFile(updated[0]); setLanguage(updated[0].lang);
        setValue(updated[0].content || "");
        if (editorRef.current) editorRef.current.setValue(updated[0].content || "");
      }
      return updated;
    });
    toast({ title: `${fileName} șters`, status: "warning", duration: 2000, position: "bottom-right" });
  }, [remoteFileDeleted]);

  useEffect(() => {
    if (!fileContent || fileContent.fileName !== activeFile?.name) return;
    isRemoteChange.current = true;
    setValue(fileContent.code);
    if (editorRef.current) editorRef.current.setValue(fileContent.code);
    if (fileContent.language) setLanguage(fileContent.language);
    setFiles(prev => {
      const updated = prev.map(f => f.name === fileContent.fileName
        ? { ...f, content: fileContent.code, lang: fileContent.language || f.lang } : f);
      saveFiles(roomId, updated);
      return updated;
    });
  }, [fileContent]);

  useEffect(() => {
    if (!remoteCodeUpdate || remoteCodeUpdate.fileName !== activeFile?.name) return;
    isRemoteChange.current = true;
    setValue(remoteCodeUpdate.code);
    if (editorRef.current) editorRef.current.setValue(remoteCodeUpdate.code);
    setFiles(prev => {
      const updated = prev.map(f => f.name === remoteCodeUpdate.fileName
        ? { ...f, content: remoteCodeUpdate.code } : f);
      saveFiles(roomId, updated);
      return updated;
    });
  }, [remoteCodeUpdate]);

  useEffect(() => {
    if (!remoteLanguageUpdate || remoteLanguageUpdate.fileName !== activeFile?.name) return;
    setLanguage(remoteLanguageUpdate.language);
  }, [remoteLanguageUpdate]);

  useEffect(() => {
    if (!chatOpen && messages.length > prevMsgCount.current)
      setUnreadCount(c => c + (messages.length - prevMsgCount.current));
    prevMsgCount.current = messages.length;
  }, [messages, chatOpen]);

  useEffect(() => { if (chatOpen) setUnreadCount(0); }, [chatOpen]);

  useEffect(() => {
    if (isConnected)
      toast({ title: "Conectat", description: `Camera: ${roomId}`, status: "success", duration: 2000, position: "bottom-right" });
  }, [isConnected]);

  // ── Typewriter effect ─────────────────────────────────────
  const handleTypewriteCode = useCallback((aiCode) => {
    if (isTypewriting) return; // nu porni dacă rulează deja

    const editor = editorRef.current;
    if (!editor) return;

    // Salvează codul original
    const current = editor.getValue();
    setOriginalCode(current);
    setPendingCode(aiCode);
    setIsTypewriting(true);
    setTypewrittenSoFar("");

    // Separator vizual
    const separator = current ? `${current}\n\n// --- AI ---\n` : "";
    editor.setValue(separator);

    let index = 0;
    const CHAR_DELAY = 12; // ms per caracter — ajustează viteza

    typewriterRef.current = setInterval(() => {
      if (index >= aiCode.length) {
        clearInterval(typewriterRef.current);
        setIsTypewriting(false);
        setTypewrittenSoFar(aiCode);
        return;
      }
      // Adaugă câte un caracter
      const partial = aiCode.slice(0, index + 1);
      const newVal = separator + partial;
      editor.setValue(newVal);
      // Scroll la ultima linie
      const model = editor.getModel();
      if (model) editor.revealLine(model.getLineCount());
      index++;
    }, CHAR_DELAY);
  }, [isTypewriting]);

  // ── Accept / Reject ───────────────────────────────────────
  const acceptCode = useCallback(() => {
    clearInterval(typewriterRef.current);
    const editor = editorRef.current;
    if (!editor) return;
    const clean = editor.getValue().replace("// --- AI ---\n", "");
    setValue(clean);
    editor.setValue(clean);
    emitCodeChange(activeFile.name, clean);
    setFiles(prev => {
      const updated = prev.map(f => f.name === activeFile?.name ? { ...f, content: clean } : f);
      saveFiles(roomId, updated);
      return updated;
    });
    setPendingCode(null); setOriginalCode(null);
    setIsTypewriting(false); setTypewrittenSoFar("");
    toast({ title: "Cod acceptat", status: "success", duration: 2000, position: "bottom-right" });
  }, [emitCodeChange, activeFile, roomId, toast]);

  const rejectCode = useCallback(() => {
    clearInterval(typewriterRef.current);
    if (originalCode !== null) {
      setValue(originalCode);
      editorRef.current?.setValue(originalCode);
    }
    setPendingCode(null); setOriginalCode(null);
    setIsTypewriting(false); setTypewrittenSoFar("");
    toast({ title: "Cod respins", status: "warning", duration: 2000, position: "bottom-right" });
  }, [originalCode, toast]);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(typewriterRef.current), []);

  // ── Cursori remote ────────────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    Object.entries(remoteCursors).forEach(([userId, data]) => {
      if (userId === socketId) return;
      if (data.fileName && data.fileName !== activeFile?.name) {
        const prev = decorationsRef.current[userId] || [];
        decorationsRef.current[userId] = editor.deltaDecorations(prev, []);
        const w = widgetsRef.current[userId];
        if (w) { try { editor.removeContentWidget(w); } catch (_) {} delete widgetsRef.current[userId]; }
        return;
      }
      const { username: uName, color, position } = data;
      const line = position?.lineNumber || 1;
      const col  = position?.column || 1;
      const safeColor = color || "#4ec994";
      const styleId = `cs-${userId.slice(0,8)}`;
      if (!document.getElementById(styleId)) {
        const s = document.createElement("style");
        s.id = styleId;
        s.textContent = `.rcursor-line-${styleId}{background:${safeColor}12}.rcursor-char-${styleId}{border-left:2px solid ${safeColor};opacity:.7}`;
        document.head.appendChild(s);
      }
      const prev = decorationsRef.current[userId] || [];
      decorationsRef.current[userId] = editor.deltaDecorations(prev, [{
        range: { startLineNumber: line, startColumn: col, endLineNumber: line, endColumn: col + 1 },
        options: { className: `rcursor-char-${styleId}`, lineHighlightClassName: `rcursor-line-${styleId}` },
      }]);
      const oldWidget = widgetsRef.current[userId];
      if (oldWidget) { try { editor.removeContentWidget(oldWidget); } catch (_) {} }
      const labelEl = document.createElement("div");
      labelEl.textContent = uName;
      labelEl.style.cssText = `background:${safeColor};color:#000;font-size:10px;font-weight:600;font-family:system-ui,sans-serif;padding:1px 6px;border-radius:2px 2px 2px 0;white-space:nowrap;pointer-events:none;opacity:.9;margin-top:-18px;margin-left:-1px;position:relative;z-index:100;`;
      const widget = {
        getId: () => `cursor-widget-${userId}`,
        getDomNode: () => labelEl,
        getPosition: () => ({ position: { lineNumber: line, column: col }, preference: [0] }),
      };
      editor.addContentWidget(widget);
      widgetsRef.current[userId] = widget;
      clearTimeout(labelTimersRef.current[userId]);
      labelTimersRef.current[userId] = setTimeout(() => {
        try { editor.removeContentWidget(widget); } catch (_) {}
        if (widgetsRef.current[userId] === widget) delete widgetsRef.current[userId];
      }, 2000);
    });
    Object.keys(decorationsRef.current).forEach(userId => {
      if (!remoteCursors[userId]) {
        editor.deltaDecorations(decorationsRef.current[userId] || [], []);
        delete decorationsRef.current[userId];
        const w = widgetsRef.current[userId];
        if (w) { try { editor.removeContentWidget(w); } catch (_) {} delete widgetsRef.current[userId]; }
      }
    });
  }, [remoteCursors, activeFile, socketId]);

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
    editor.onDidChangeCursorPosition(e => {
      clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(() => {
        emitCursorMove({ lineNumber: e.position.lineNumber, column: e.position.column });
      }, 100);
    });
  };

  const handleCodeChange = (newValue) => {
    if (isRemoteChange.current) { isRemoteChange.current = false; return; }
    if (isTypewriting) return; // nu interfera cu typewriter
    setValue(newValue);
    emitCodeChange(activeFile.name, newValue);
    setFiles(prev => {
      const updated = prev.map(f => f.name === activeFile?.name ? { ...f, content: newValue } : f);
      saveFiles(roomId, updated);
      return updated;
    });
    if (!isTyping) { setIsTyping(true); emitTyping(true); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { setIsTyping(false); emitTyping(false); }, TYPING_DEBOUNCE);
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    const snippet = CODE_SNIPPETS[lang] || "";
    setValue(snippet);
    emitLanguageChange(activeFile.name, lang);
    emitCodeChange(activeFile.name, snippet);
    setFiles(prev => {
      const updated = prev.map(f => f.name === activeFile?.name ? { ...f, lang, content: snippet } : f);
      saveFiles(roomId, updated);
      return updated;
    });
  };

  function handleSelectFile(file) {
    if (isTypewriting) rejectCode();
    const currentContent = editorRef.current?.getValue() || "";
    setFiles(prev => {
      const updated = prev.map(f => f.name === activeFile?.name ? { ...f, content: currentContent } : f);
      saveFiles(roomId, updated);
      return updated;
    });
    setActiveFile(file); setLanguage(file.lang); setValue(file.content || "");
    if (editorRef.current) editorRef.current.setValue(file.content || "");
    emitOpenFile(file.name);
  }

  function handleCreateFile(name) {
    if (files.find(f => f.name === name)) {
      toast({ title: "Fișier există deja", status: "warning", duration: 2000 }); return;
    }
    const lang = detectLang(name);
    const content = `// ${name}\n`;
    const newFile = { name, lang, content };
    setFiles(prev => { const updated = [...prev, newFile]; saveFiles(roomId, updated); return updated; });
    emitCreateFile(name, lang, content);
    setActiveFile(newFile); setLanguage(lang); setValue(content);
    if (editorRef.current) editorRef.current.setValue(content);
    emitOpenFile(name);
    toast({ title: `${name} creat`, status: "success", duration: 1500 });
  }

  function handleDeleteFile(name) {
    if (files.length <= 1) {
      toast({ title: "Nu poți șterge ultimul fișier", status: "warning", duration: 2000 }); return;
    }
    const updated = files.filter(f => f.name !== name);
    setFiles(updated); saveFiles(roomId, updated); emitDeleteFile(name);
    if (activeFile?.name === name) handleSelectFile(updated[0]);
    toast({ title: `${name} șters`, status: "info", duration: 1500 });
  }

  const getEditorCode = useCallback(() => editorRef.current?.getValue() || value, [value]);

  const typingList = Object.values(typingUsers).filter(Boolean);

  // Bara de status typewriter
  const showPendingBar = pendingCode !== null;

  return (
    <div className={styles.container}>
      <div className={styles.titlebar}>
        <div className={styles.titlebarLeft}>
          {onBack && (
            <button className={styles.navBtn} onClick={onBack}>Dashboard</button>
          )}
          <button
            className={`${styles.navBtn} ${sidebarOpen ? styles.navBtnActive : ""}`}
            onClick={() => setSidebarOpen(v => !v)}
          >
            Files
          </button>
          <div className={styles.statusDot}
            style={{ background: isConnected ? "#4ec994" : "#f44747" }} />
          <span className={styles.statusText}>
            {isConnected ? "online" : "offline"}
          </span>
          {typingList.length > 0 && (
            <span className={styles.typingText}>
              {typingList.join(", ")} editează...
            </span>
          )}
        </div>

        <div className={styles.titlebarRight}>
          <span className={styles.roomId}>{roomId}</span>
          <button
            className={`${styles.aiBtn} ${chatOpen ? styles.aiBtnActive : ""}`}
            onClick={() => setChatOpen(o => !o)}
          >
            <span className={styles.aiBtnText}>
              AI Assistant
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </span>
          </button>
        </div>
      </div>

      {users?.length > 0 && (
        <div className={styles.usersBar}>
          <UsersList users={users} roomId={roomId} currentSocketId={socketId} />
        </div>
      )}

      <div className={styles.editorRow}>
        {sidebarOpen && (
          <FileSidebar
            files={files}
            activeFile={activeFile?.name}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            projectName={projectName}
            roomId={roomId}
            users={users}
            currentSocketId={socketId}
          />
        )}

        <div className={styles.editorBox}>
          <LanguageSelector language={language} onSelect={handleLanguageSelect} />
          <Editor
            options={{ minimap: { enabled: false } }}
            height="calc(100vh - 100px)"
            theme="vs-dark"
            language={language}
            value={value}
            onMount={onMount}
            onChange={handleCodeChange}
          />

          {/* Pending bar — Accept / Reject */}
          {showPendingBar && (
            <div className={styles.pendingBar}>
              {isTypewriting ? (
                <>
                  <span className={styles.pendingText}>
                    <span className={styles.typingDot} />
                    AI scrie cod...
                  </span>
                  <button className={styles.rejectBtn} onClick={rejectCode}>
                    Oprește
                  </button>
                </>
              ) : (
                <>
                  <span className={styles.pendingText}>Cod generat — accepti?</span>
                  <button className={styles.acceptBtn} onClick={acceptCode}>
                    Acceptă
                  </button>
                  <button className={styles.rejectBtn} onClick={rejectCode}>
                    Respinge
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <Output editorRef={editorRef} language={language} />
      </div>

      <Chat
        isOpen={chatOpen}
        onToggle={() => setChatOpen(o => !o)}
        currentUser={username}
        getEditorCode={getEditorCode}
        onTypewriteCode={handleTypewriteCode}
      />
    </div>
  );
};

export default CodeEditor;