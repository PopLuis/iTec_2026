// client/src/components/CodeEditor.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import { Box, HStack, Text, useToast } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";
import UsersList from "./UsersList";
import Chat from "./Chat";
import { useSocket } from "../hooks/useSocket";

const TYPING_DEBOUNCE = 1500;

const CodeEditor = ({ username, roomId }) => {
  const editorRef = useRef();
  const toast = useToast();
  const isRemoteChange = useRef(false);
  const typingTimer = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMsgCount = useRef(0);

  // ── State pentru cod AI pending (highlight + accept/reject) ──
  const [pendingCode, setPendingCode] = useState(null);
  const [originalCode, setOriginalCode] = useState(null);

  const [value, setValue] = useState(CODE_SNIPPETS["javascript"]);
  const [language, setLanguage] = useState("javascript");

  const {
    isConnected, users, messages, typingUsers,
    remoteCode, remoteLanguage,
    emitCodeChange, emitLanguageChange, emitTyping,
    sendMessage, socketId,
  } = useSocket(roomId, username);

  useEffect(() => {
    if (remoteCode === null) return;
    isRemoteChange.current = true;
    setValue(remoteCode);
  }, [remoteCode]);

  useEffect(() => {
    if (!remoteLanguage) return;
    setLanguage(remoteLanguage);
    setValue(CODE_SNIPPETS[remoteLanguage] || "");
  }, [remoteLanguage]);

  useEffect(() => {
    if (!chatOpen && messages.length > prevMsgCount.current) {
      setUnreadCount((c) => c + (messages.length - prevMsgCount.current));
    }
    prevMsgCount.current = messages.length;
  }, [messages, chatOpen]);

  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  useEffect(() => {
    if (isConnected) {
      toast({
        title: "Conectat la sesiune",
        description: `Camera: ${roomId}`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  }, [isConnected]);

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleCodeChange = (newValue) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    setValue(newValue);
    emitCodeChange(newValue);
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      emitTyping(false);
    }, TYPING_DEBOUNCE);
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    const snippet = CODE_SNIPPETS[lang] || "";
    setValue(snippet);
    emitLanguageChange(lang);
    emitCodeChange(snippet);
  };

  // ── Returnează codul curent din editor ───────────────────
  const getEditorCode = useCallback(() => {
    return editorRef.current?.getValue() || value;
  }, [value]);

  // ── AI inserează cod — salvează originalul și arată preview ──
  const handleInsertCode = useCallback((aiCode) => {
    const current = editorRef.current?.getValue() || "";
    setOriginalCode(current);
    setPendingCode(aiCode);

    // Pune codul AI în editor cu highlight vizual
    const newCode = current
      ? `${current}\n\n// ── Cod generat de AI ──────────────────\n${aiCode}`
      : aiCode;

    setValue(newCode);
    if (editorRef.current) {
      editorRef.current.setValue(newCode);
      // Scroll la codul nou
      const model = editorRef.current.getModel();
      const lineCount = model.getLineCount();
      editorRef.current.revealLine(lineCount);
    }
  }, []);

  // ── Acceptă codul AI ─────────────────────────────────────
  const acceptCode = useCallback(() => {
    const current = editorRef.current?.getValue() || "";
    // Elimină doar comentariul, păstrează codul
    const clean = current.replace("// ── Cod generat de AI ──────────────────\n", "");
    setValue(clean);
    editorRef.current?.setValue(clean);
    emitCodeChange(clean);
    setPendingCode(null);
    setOriginalCode(null);
    toast({ title: "✓ Cod acceptat", status: "success", duration: 2000, position: "bottom-right" });
  }, [emitCodeChange, toast]);

  // ── Respinge codul AI ─────────────────────────────────────
  const rejectCode = useCallback(() => {
    if (originalCode !== null) {
      setValue(originalCode);
      editorRef.current?.setValue(originalCode);
    }
    setPendingCode(null);
    setOriginalCode(null);
    toast({ title: "✗ Cod respins", status: "warning", duration: 2000, position: "bottom-right" });
  }, [originalCode, toast]);

  const typingList = Object.values(typingUsers).filter(Boolean);

  return (
    <Box position="relative">
      {/* ── Topbar ─────────────────────────────────────────── */}
      <HStack justify="space-between" mb={3} align="center">
        <HStack spacing={3}>
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

        {/* Buton AI Copilot */}
        <Box as="button"
          onClick={() => setChatOpen((o) => !o)}
          bg={chatOpen ? "rgba(110,72,255,0.25)" : "rgba(110,72,255,0.08)"}
          border={`1px solid ${chatOpen ? "rgba(110,72,255,0.5)" : "rgba(110,72,255,0.2)"}`}
          borderRadius="lg" px={3} py={1.5} cursor="pointer"
          _hover={{ bg: "rgba(110,72,255,0.2)" }} transition="all 0.2s"
        >
          <HStack spacing={1.5}>
            <Box w="6px" h="6px" borderRadius="full"
              bg="linear-gradient(135deg,#6E48FF,#4ECDC4)"
              boxShadow="0 0 6px rgba(110,72,255,0.8)"
              style={{ animation: "pulse 2s infinite" }}
            />
            <Text color="gray.200" fontSize="xs" fontFamily="mono" fontWeight="600">
              ✦ AI Copilot
            </Text>
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

      {/* ── Editor + Output ──────────────────────────────────── */}
      <HStack spacing={4} align="stretch">
        <Box w="50%" position="relative">
          <LanguageSelector language={language} onSelect={handleLanguageSelect} />
          <Editor
            options={{ minimap: { enabled: false } }}
            height="75vh"
            theme="vs-dark"
            language={language}
            value={value}
            onMount={onMount}
            onChange={handleCodeChange}
          />

          {/* ── Bara Accept/Reject cod AI ─────────────────── */}
          {pendingCode && (
            <Box
              position="absolute"
              bottom="12px"
              left="50%"
              transform="translateX(-50%)"
              zIndex={10}
              bg="rgba(8,6,18,0.97)"
              border="1px solid rgba(110,72,255,0.4)"
              borderRadius="12px"
              px={4} py={3}
              boxShadow="0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(110,72,255,0.15)"
              backdropFilter="blur(12px)"
              minW="280px"
            >
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
                  <Box as="button"
                    px={3} py={1.5}
                    bg="rgba(0,229,160,0.12)"
                    border="1px solid rgba(0,229,160,0.35)"
                    borderRadius="8px"
                    cursor="pointer"
                    onClick={acceptCode}
                    _hover={{ bg: "rgba(0,229,160,0.22)", transform: "translateY(-1px)" }}
                    transition="all 0.15s"
                  >
                    <Text fontSize="11px" color="#00e5a0" fontWeight="700" fontFamily="mono">
                      ✓ Acceptă
                    </Text>
                  </Box>
                  <Box as="button"
                    px={3} py={1.5}
                    bg="rgba(255,95,126,0.1)"
                    border="1px solid rgba(255,95,126,0.3)"
                    borderRadius="8px"
                    cursor="pointer"
                    onClick={rejectCode}
                    _hover={{ bg: "rgba(255,95,126,0.2)", transform: "translateY(-1px)" }}
                    transition="all 0.15s"
                  >
                    <Text fontSize="11px" color="#ff5f7e" fontWeight="700" fontFamily="mono">
                      ✗ Respinge
                    </Text>
                  </Box>
                </HStack>
              </HStack>
            </Box>
          )}
        </Box>

        <Output editorRef={editorRef} language={language} />
      </HStack>

      {/* ── AI Chat ──────────────────────────────────────────── */}
      <Chat
        isOpen={chatOpen}
        onToggle={() => setChatOpen((o) => !o)}
        currentUser={username}
        getEditorCode={getEditorCode}
        onInsertCode={handleInsertCode}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Box>
  );
};

export default CodeEditor;