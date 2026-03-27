import { useRef, useState, useEffect, useCallback } from "react";
import { Box, HStack, Text, IconButton, Tooltip, useToast } from "@chakra-ui/react";
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

  const [value, setValue] = useState(CODE_SNIPPETS["javascript"]);
  const [language, setLanguage] = useState("javascript");

  const {
    isConnected,
    users,
    messages,
    typingUsers,
    remoteCode,
    remoteLanguage,
    emitCodeChange,
    emitLanguageChange,
    emitTyping,
    sendMessage,
    socketId,
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

  const typingList = Object.values(typingUsers).filter(Boolean);

  return (
    <Box position="relative">
      <HStack justify="space-between" mb={3} align="center">
        <HStack spacing={3}>
          <HStack spacing={1.5}>
            <Box
              w="7px"
              h="7px"
              borderRadius="full"
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

        <Box position="relative">
          <Box
            as="button"
            onClick={() => setChatOpen((o) => !o)}
            bg={chatOpen ? "rgba(110, 72, 255, 0.2)" : "rgba(255,255,255,0.04)"}
            border={`1px solid ${chatOpen ? "rgba(110,72,255,0.4)" : "rgba(255,255,255,0.08)"}`}
            borderRadius="lg"
            px={3}
            py={1.5}
            cursor="pointer"
            _hover={{ bg: "rgba(255,255,255,0.08)" }}
            transition="all 0.2s"
          >
            <HStack spacing={1.5}>
              <Text fontSize="sm">💬</Text>
              <Text color="gray.300" fontSize="xs" fontFamily="mono">Chat</Text>
              {unreadCount > 0 && (
                <Box
                  bg="#FF6B6B"
                  borderRadius="full"
                  minW="16px"
                  h="16px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  px={1}
                >
                  <Text color="white" fontSize="9px" fontWeight="700">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </Box>
              )}
            </HStack>
          </Box>
        </Box>
      </HStack>

      <UsersList users={users} roomId={roomId} currentSocketId={socketId} />

      <HStack spacing={4} align="stretch">
        <Box w="50%">
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
        </Box>
        <Output editorRef={editorRef} language={language} />
      </HStack>

      <Chat
        messages={messages}
        typingUsers={typingUsers}
        onSend={sendMessage}
        currentUser={username}
        isOpen={chatOpen}
        onToggle={() => setChatOpen((o) => !o)}
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
