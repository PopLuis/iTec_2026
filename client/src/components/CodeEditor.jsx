// client/src/components/CodeEditor.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import { Box, HStack, Text, useToast } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import UsersList from "./UsersList";
import Chat from "./Chat";
import FileSidebar from "./FileSidebar";
import { useSocket } from "../hooks/useSocket";

const TYPING_DEBOUNCE = 1500;

const DEFAULT_FILES = [
  { name: "main.js",    lang: "javascript", content: '// main.js\nconsole.log("Hello, iTec 2026!")\n' },
  { name: "index.html", lang: "html",        content: '<!DOCTYPE html>\n<html>\n<head><title>iTec</title></head>\n<body>\n  <h1>Hello!</h1>\n</body>\n</html>\n' },
  { name: "style.css",  lang: "css",         content: 'body {\n  background: #0a0a0f;\n  color: white;\n}\n' },
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
  const toast          = useToast();
  const isRemoteChange = useRef(false);
  const typingTimer    = useRef(null);

  const [isTyping, setIsTyping]       = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMsgCount = useRef(0);

  const [pendingCode, setPendingCode]   = useState(null);
  const [originalCode, setOriginalCode] = useState(null);

  const [files, setFiles]           = useState(() => loadFiles(roomId));
  const [activeFile, setActiveFile] = useState(files[0]);
  const [language, setLanguage]     = useState(files[0]?.lang || "javascript");
  const [value, setValue]           = useState(files[0]?.content || "");

  const {
    isConnected, users, messages, typingUsers,
    remoteCursors, remoteCodeUpdate, remoteLanguageUpdate,
    fileContent, serverFiles,
    remoteFileCreated, remoteFileDeleted,
    emitOpenFile, emitCreateFile, emitDeleteFile,
    emitCodeChange, emitLanguageChange,
    emitCursorMove, emitTyping, sendMessage, socketId,
  } = useSocket(roomId, username);

  // ── La conectare ──────────────────────────────────────────
  useEffect(() => {
    if (isConnected && activeFile) {
      emitOpenFile(activeFile.name);
    }
  }, [isConnected]);

  // ── Fișier nou creat de alt user ──────────────────────────
  useEffect(() => {
    if (!remoteFileCreated) return;
    setFiles(prev => {
      if (prev.find(f => f.name === remoteFileCreated.fileName)) return prev;
      const newFile = {
        name: remoteFileCreated.fileName,
        lang: remoteFileCreated.lang,
        content: remoteFileCreated.content,
      };
      const updated = [...prev, newFile];
      saveFiles(roomId, updated);
      toast({
        title: `📄 ${remoteFileCreated.fileName} adăugat de un coleg`,
        status: "info",
        duration: 2000,
        position: "bottom-right",
      });
      return updated;
    });
  }, [remoteFileCreated]);

  // ── Fișier șters de alt user ──────────────────────────────
  useEffect(() => {
    if (!remoteFileDeleted) return;
    const { fileName } = remoteFileDeleted;
    setFiles(prev => {
      const updated = prev.filter(f => f.name !== fileName);
      saveFiles(roomId, updated);
      if (activeFile?.name === fileName && updated.length > 0) {
        setActiveFile(updated[0]);
        setLanguage(updated[0].lang);
        setValue(updated[0].content || "");
        if (editorRef.current) editorRef.current.setValue(updated[0].content || "");
      }
      return updated;
    });
    toast({
      title: `🗑 ${fileName} șters de un coleg`,
      status: "warning",
      duration: 2000,
      position: "bottom-right",
    });
  }, [remoteFileDeleted]);

  // ── Conținut fișier de la server ──────────────────────────
  useEffect(() => {
    if (!fileContent) return;
    if (fileContent.fileName !== activeFile?.name) return;
    isRemoteChange.current = true;
    setValue(fileContent.code);
    if (editorRef.current) editorRef.current.setValue(fileContent.code);
    if (fileContent.language) setLanguage(fileContent.language);
    setFiles(prev => {
      const updated = prev.map(f =>
        f.name === fileContent.fileName
          ? { ...f, content: fileContent.code, lang: fileContent.language || f.lang }
          : f
      );
      saveFiles(roomId, updated);
      return updated;
    });
  }, [fileContent]);

  // ── Update cod remote ─────────────────────────────────────
  useEffect(() => {
    if (!remoteCodeUpdate) return;
    if (remoteCodeUpdate.fileName !== activeFile?.name) return;
    isRemoteChange.current = true;
    setValue(remoteCodeUpdate.code);
    if (editorRef.current) editorRef.current.setValue(remoteCodeUpdate.code);
    setFiles(prev => {
      const updated = prev.map(f =>
        f.name === remoteCodeUpdate.fileName ? { ...f, content: remoteCodeUpdate.code } : f
      );
      saveFiles(roomId, updated);
      return updated;
    });
  }, [remoteCodeUpdate]);

  // ── Update limbaj remote ──────────────────────────────────
  useEffect(() => {
    if (!remoteLanguageUpdate) return;
    if (remoteLanguageUpdate.fileName !== activeFile?.name) return;
    setLanguage(remoteLanguageUpdate.language);
  }, [remoteLanguageUpdate]);

  // ── Unread + toast ────────────────────────────────────────
  useEffect(() => {
    if (!chatOpen && messages.length > prevMsgCount.current)
      setUnreadCount(c => c + (messages.length - prevMsgCount.current));
    prevMsgCount.current = messages.length;
  }, [messages, chatOpen]);

  useEffect(() => { if (chatOpen) setUnreadCount(0); }, [chatOpen]);

  useEffect(() => {
    if (isConnected)
      toast({ title: "Conectat", description: `Camera: ${roomId}`, status: "success", duration: 3000, position: "bottom-right" });
  }, [isConnected]);

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
      const safeColor = color || "#4ECDC4";

      const styleId = `cs-${userId.slice(0,8)}`;
      if (!document.getElementById(styleId)) {
        const s = document.createElement("style");
        s.id = styleId;
        s.textContent = `
          .rcursor-line-${styleId} { background: ${safeColor}12; }
          .rcursor-char-${styleId} { border-left: 2px solid ${safeColor}; opacity: 0.7; }
        `;
        document.head.appendChild(s);
      }

      const prev = decorationsRef.current[userId] || [];
      decorationsRef.current[userId] = editor.deltaDecorations(prev, [{
        range: { startLineNumber: line, startColumn: col, endLineNumber: line, endColumn: col + 1 },
        options: {
          className: `rcursor-char-${styleId}`,
          lineHighlightClassName: `rcursor-line-${styleId}`,
        },
      }]);

      const oldWidget = widgetsRef.current[userId];
      if (oldWidget) { try { editor.removeContentWidget(oldWidget); } catch (_) {} }

      const labelEl = document.createElement("div");
      labelEl.textContent = uName;
      labelEl.style.cssText = `
        background: ${safeColor}; color: #000; font-size: 9px; font-weight: 700;
        font-family: 'Outfit', sans-serif; padding: 1px 6px;
        border-radius: 3px 3px 3px 0; white-space: nowrap;
        pointer-events: none; opacity: 0.85; margin-top: -18px;
        margin-left: -1px; position: relative; z-index: 100;
      `;

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

  // ── Mount ─────────────────────────────────────────────────
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

  // ── Editare ───────────────────────────────────────────────
  const handleCodeChange = (newValue) => {
    if (isRemoteChange.current) { isRemoteChange.current = false; return; }
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

  // ── Selectează fișier ─────────────────────────────────────
  function handleSelectFile(file) {
    // Salvează conținutul curent
    const currentContent = editorRef.current?.getValue() || "";
    setFiles(prev => {
      const updated = prev.map(f =>
        f.name === activeFile?.name ? { ...f, content: currentContent } : f
      );
      saveFiles(roomId, updated);
      return updated;
    });
    // Deschide fișierul nou
    setActiveFile(file);
    setLanguage(file.lang);
    setValue(file.content || "");
    if (editorRef.current) editorRef.current.setValue(file.content || "");
    emitOpenFile(file.name);
  }

  // ── Creare fișier ─────────────────────────────────────────
  function handleCreateFile(name) {
    if (files.find(f => f.name === name)) {
      toast({ title: "Fișier există deja", status: "warning", duration: 2000 });
      return;
    }
    const lang = detectLang(name);
    const content = `// ${name}\n`;
    const newFile = { name, lang, content };

    // Adaugă în state și salvează LOCAL
    setFiles(prev => {
      const updated = [...prev, newFile];
      saveFiles(roomId, updated);
      return updated;
    });

    // Trimite la colegi
    emitCreateFile(name, lang, content);

    // Deschide fișierul nou direct
    setActiveFile(newFile);
    setLanguage(lang);
    setValue(content);
    if (editorRef.current) editorRef.current.setValue(content);
    emitOpenFile(name);

    toast({ title: `📄 ${name} creat`, status: "success", duration: 1500 });
  }

  // ── Ștergere fișier ───────────────────────────────────────
  function handleDeleteFile(name) {
    if (files.length <= 1) {
      toast({ title: "Nu poți șterge ultimul fișier", status: "warning", duration: 2000 });
      return;
    }
    const updated = files.filter(f => f.name !== name);
    setFiles(updated);
    saveFiles(roomId, updated);
    emitDeleteFile(name);
    if (activeFile?.name === name) handleSelectFile(updated[0]);
    toast({ title: `🗑 ${name} șters`, status: "info", duration: 1500 });
  }

  const getEditorCode = useCallback(() => editorRef.current?.getValue() || value, [value]);

  const handleInsertCode = useCallback((aiCode) => {
    const current = editorRef.current?.getValue() || "";
    setOriginalCode(current);
    setPendingCode(aiCode);
    const newCode = current
      ? `${current}\n\n// ── Cod generat de AI ──────────────────\n${aiCode}`
      : aiCode;
    setValue(newCode);
    if (editorRef.current) {
      editorRef.current.setValue(newCode);
      editorRef.current.revealLine(editorRef.current.getModel().getLineCount());
    }
  }, []);

  const acceptCode = useCallback(() => {
    const clean = (editorRef.current?.getValue() || "").replace("// ── Cod generat de AI ──────────────────\n", "");
    setValue(clean);
    editorRef.current?.setValue(clean);
    emitCodeChange(activeFile.name, clean);
    setPendingCode(null); setOriginalCode(null);
    toast({ title: "✓ Cod acceptat", status: "success", duration: 2000, position: "bottom-right" });
  }, [emitCodeChange, activeFile, toast]);

  const rejectCode = useCallback(() => {
    if (originalCode !== null) { setValue(originalCode); editorRef.current?.setValue(originalCode); }
    setPendingCode(null); setOriginalCode(null);
    toast({ title: "✗ Cod respins", status: "warning", duration: 2000, position: "bottom-right" });
  }, [originalCode, toast]);

  const typingList = Object.values(typingUsers).filter(Boolean);

  return (
    <Box position="relative">
      {/* Topbar */}
      <HStack justify="space-between" mb={3} align="center">
        <HStack spacing={2}>
          {onBack && (
            <Box as="button" onClick={onBack}
              px={2} py={1}
              bg="rgba(255,255,255,0.04)"
              border="1px solid rgba(255,255,255,0.08)"
              borderRadius="6px" cursor="pointer"
              _hover={{ bg: "rgba(255,255,255,0.08)" }}>
              <Text fontSize="11px" color="gray.400">← Dashboard</Text>
            </Box>
          )}
          <Box as="button" onClick={() => setSidebarOpen(v => !v)}
            px={2} py={1}
            bg={sidebarOpen ? "rgba(110,72,255,0.1)" : "rgba(255,255,255,0.04)"}
            border={`1px solid ${sidebarOpen ? "rgba(110,72,255,0.2)" : "rgba(255,255,255,0.08)"}`}
            borderRadius="6px" cursor="pointer"
            _hover={{ bg: "rgba(110,72,255,0.12)" }}>
            <Text fontSize="11px" color={sidebarOpen ? "rgba(110,72,255,0.9)" : "gray.400"}>📁</Text>
          </Box>
          <HStack spacing={1.5}>
            <Box w="7px" h="7px" borderRadius="full"
              bg={isConnected ? "#4ECDC4" : "#FF6B6B"}
              boxShadow={isConnected ? "0 0 8px #4ECDC4" : "0 0 8px #FF6B6B"}
              style={{ animation: isConnected ? "pulse 2s infinite" : "none" }}
            />
            <Text color={isConnected ? "#4ECDC4" : "#FF6B6B"} fontSize="xs" fontFamily="mono">
              {isConnected ? "online" : "offline"}
            </Text>
          </HStack>
          {typingList.length > 0 && (
            <Text color="gray.600" fontSize="xs" fontFamily="mono" fontStyle="italic">
              {typingList.join(", ")} {typingList.length === 1 ? "scrie" : "scriu"}...
            </Text>
          )}
        </HStack>

        <Box as="button" onClick={() => setChatOpen(o => !o)}
          bg={chatOpen ? "rgba(110,72,255,0.25)" : "rgba(110,72,255,0.08)"}
          border={`1px solid ${chatOpen ? "rgba(110,72,255,0.5)" : "rgba(110,72,255,0.2)"}`}
          borderRadius="lg" px={3} py={1.5} cursor="pointer"
          _hover={{ bg: "rgba(110,72,255,0.2)" }} transition="all 0.2s">
          <HStack spacing={1.5}>
            <Box w="6px" h="6px" borderRadius="full"
              bg="linear-gradient(135deg,#6E48FF,#4ECDC4)"
              boxShadow="0 0 6px rgba(110,72,255,0.8)"
              style={{ animation: "pulse 2s infinite" }} />
            <Text color="gray.200" fontSize="xs" fontFamily="mono" fontWeight="600">✦ AI Copilot</Text>
            {unreadCount > 0 && (
              <Box bg="#FF6B6B" borderRadius="full" minW="16px" h="16px"
                display="flex" alignItems="center" justifyContent="center" px={1}>
                <Text color="white" fontSize="9px" fontWeight="700">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </Box>
            )}
          </HStack>
        </Box>
      </HStack>

      <UsersList users={users} roomId={roomId} currentSocketId={socketId} />

      <HStack spacing={0} align="stretch" overflow="hidden">
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

        <Box flex={1} minW={0} position="relative">
          <LanguageSelector language={language} onSelect={handleLanguageSelect} />
          <Editor
            options={{ minimap: { enabled: false } }}
            height="75vh" theme="vs-dark"
            language={language} value={value}
            onMount={onMount} onChange={handleCodeChange}
          />

          {pendingCode && (
            <Box position="absolute" bottom="12px" left="50%"
              transform="translateX(-50%)" zIndex={10}
              bg="rgba(8,6,18,0.97)" border="1px solid rgba(110,72,255,0.4)"
              borderRadius="12px" px={4} py={3}
              boxShadow="0 8px 32px rgba(0,0,0,0.7)"
              backdropFilter="blur(12px)" minW="280px">
              <HStack spacing={3} justify="center">
                <HStack spacing={1.5}>
                  <Box w="6px" h="6px" borderRadius="full"
                    bg="linear-gradient(135deg,#6E48FF,#4ECDC4)"
                    style={{ animation: "pulse 1.5s infinite" }} />
                  <Text fontSize="11px" color="gray.300" fontFamily="mono" fontWeight="600">
                    Cod AI generat
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Box as="button" px={3} py={1.5}
                    bg="rgba(0,229,160,0.12)" border="1px solid rgba(0,229,160,0.35)"
                    borderRadius="8px" cursor="pointer" onClick={acceptCode}
                    _hover={{ bg: "rgba(0,229,160,0.22)" }} transition="all 0.15s">
                    <Text fontSize="11px" color="#00e5a0" fontWeight="700" fontFamily="mono">✓ Acceptă</Text>
                  </Box>
                  <Box as="button" px={3} py={1.5}
                    bg="rgba(255,95,126,0.1)" border="1px solid rgba(255,95,126,0.3)"
                    borderRadius="8px" cursor="pointer" onClick={rejectCode}
                    _hover={{ bg: "rgba(255,95,126,0.2)" }} transition="all 0.15s">
                    <Text fontSize="11px" color="#ff5f7e" fontWeight="700" fontFamily="mono">✗ Respinge</Text>
                  </Box>
                </HStack>
              </HStack>
            </Box>
          )}
        </Box>

        <Output editorRef={editorRef} language={language} />
      </HStack>

      <Chat
        isOpen={chatOpen}
        onToggle={() => setChatOpen(o => !o)}
        currentUser={username}
        getEditorCode={getEditorCode}
        onInsertCode={handleInsertCode}
      />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </Box>
  );
};

export default CodeEditor;