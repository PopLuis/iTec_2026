// client/src/components/Chat.jsx
import { useState, useRef, useEffect } from "react";
import { Box, VStack, HStack, Text, Input } from "@chakra-ui/react";

function MessageContent({ text, onInsertCode }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <Box>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].replace("```", "").trim() || "code";
          const code = lines.slice(1, -1).join("\n");
          return (
            <Box key={i} mt={1.5} mb={1.5} border="1px solid #3c3c3c" borderRadius="3px" overflow="hidden">
              <HStack px={2} py={1} bg="#2d2d2d" justify="space-between">
                <Text fontSize="10px" color="#9d9d9d" fontFamily="Consolas, monospace">
                  {lang}
                </Text>
                <HStack spacing={2}>
                  <Box as="button" px={2} py={0.5} bg="#0e639c" borderRadius="2px"
                    cursor="pointer" onClick={() => onInsertCode(code)}
                    _hover={{ bg: "#1177bb" }} fontSize="10px" color="white">
                    Insert
                  </Box>
                  <Box as="button" px={2} py={0.5} bg="#37373d" borderRadius="2px"
                    cursor="pointer" onClick={() => navigator.clipboard.writeText(code)}
                    _hover={{ bg: "#424242" }} fontSize="10px" color="#9d9d9d">
                    Copy
                  </Box>
                </HStack>
              </HStack>
              <Box bg="#1e1e1e" p={2} overflowX="auto">
                <Text color="#d4d4d4" fontSize="12px" fontFamily="Consolas, monospace"
                  whiteSpace="pre" lineHeight="1.6">
                  {code}
                </Text>
              </Box>
            </Box>
          );
        }
        return (
          <Text key={i} color="#cccccc" fontSize="13px" lineHeight="1.6" as="span" display="block">
            {part}
          </Text>
        );
      })}
    </Box>
  );
}

const QUICK_ACTIONS = [
  { label: "Explică codul",  prompt: "Explică codul din editor pe scurt" },
  { label: "Fix bug",        prompt: "Găsește și fixează bug-urile din codul din editor. Returnează codul fix complet." },
  { label: "Optimizează",    prompt: "Optimizează codul din editor. Returnează codul optimizat complet." },
  { label: "Adaugă comentarii", prompt: "Adaugă comentarii explicative în codul din editor." },
  { label: "Generează teste", prompt: "Generează teste pentru funcțiile din codul din editor." },
];

const Chat = ({ isOpen, onToggle, currentUser, getEditorCode, onInsertCode }) => {
  const [messages, setMessages] = useState([
    {
      id: 1, role: "assistant",
      text: "Bună ziua! Sunt asistentul AI integrat în editor.\n\nPot să explic cod, să fixez erori sau să generez funcții noi. Când generez cod, apasă **Insert** ca să îl adaug direct în editor.",
    },
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [insertedId, setInsertedId] = useState(null);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim()); setInput("");
  };

  const handleInsertCode = (code, msgId) => {
    onInsertCode?.(code);
    setInsertedId(msgId);
    setTimeout(() => setInsertedId(null), 2000);
  };

  const clearChat = () => setMessages([{
    id: Date.now(), role: "assistant",
    text: "Conversație resetată. Cu ce vă pot ajuta?",
  }]);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed" bottom="0" right="0"
      w="320px" h="460px"
      bg="#252526"
      border="1px solid #3c3c3c"
      borderBottom="none" borderRight="none"
      display="flex" flexDirection="column"
      zIndex={1000}
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      {/* Header */}
      <HStack
        px={3} py={2}
        borderBottom="1px solid #3c3c3c"
        justify="space-between"
        bg="#2d2d2d"
        flexShrink={0}
      >
        <Text fontSize="12px" fontWeight="600" color="#cccccc">
          AI Assistant
        </Text>
        <HStack spacing={1}>
          <Box as="button" w="20px" h="20px" display="flex" alignItems="center" justifyContent="center"
            fontSize="12px" color="#9d9d9d" bg="transparent" border="none" cursor="pointer"
            onClick={clearChat} _hover={{ color: "#cccccc" }} title="Resetează">
            ↺
          </Box>
          <Box as="button" w="20px" h="20px" display="flex" alignItems="center" justifyContent="center"
            fontSize="16px" color="#9d9d9d" bg="transparent" border="none" cursor="pointer"
            onClick={onToggle} _hover={{ color: "#cccccc" }} title="Închide">
            ×
          </Box>
        </HStack>
      </HStack>

      {/* Quick actions */}
      <Box px={2} py={1.5} borderBottom="1px solid #3c3c3c" flexShrink={0}>
        <HStack spacing={1} flexWrap="wrap" gap={1}>
          {QUICK_ACTIONS.map(action => (
            <Box key={action.label} as="button"
              px={2} py={0.5}
              bg="#37373d" borderRadius="2px"
              cursor="pointer" fontSize="11px" color="#9d9d9d"
              onClick={() => !loading && sendMessage(action.prompt)}
              _hover={{ bg: "#424242", color: "#cccccc" }}
              transition="all 0.1s"
            >
              {action.label}
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Messages */}
      <Box
        flex={1} overflowY="auto" px={3} py={2}
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { background: "#424242", borderRadius: "2px" },
        }}
      >
        <VStack align="stretch" spacing={3}>
          {messages.map(msg => (
            <Box key={msg.id} alignSelf={msg.role === "user" ? "flex-end" : "flex-start"} maxW="95%">
              {msg.role === "assistant" && (
                <HStack spacing={1} mb={0.5}>
                  <Text fontSize="10px" color="#9d9d9d">AI Assistant</Text>
                  {insertedId === msg.id && (
                    <Text fontSize="10px" color="#4ec994">— inserat</Text>
                  )}
                </HStack>
              )}
              {msg.role === "user" && (
                <Text fontSize="10px" color="#9d9d9d" mb="2px" textAlign="right">
                  {currentUser || "Tu"}
                </Text>
              )}
              <Box
                px={msg.role === "user" ? 2 : 0}
                py={msg.role === "user" ? 1.5 : 0}
                bg={msg.role === "user" ? "#2d2d2d" : "transparent"}
                border={msg.role === "user" ? "1px solid #3c3c3c" : "none"}
                borderRadius="3px"
              >
                <MessageContent
                  text={msg.text}
                  onInsertCode={code => handleInsertCode(code, msg.id)}
                />
              </Box>
            </Box>
          ))}

          {loading && (
            <Box alignSelf="flex-start">
              <Text fontSize="10px" color="#9d9d9d" mb={0.5}>AI Assistant</Text>
              <Text fontSize="12px" color="#6d6d6d" fontFamily="Consolas, monospace">
                Generează răspuns...
              </Text>
            </Box>
          )}
          <div ref={bottomRef} />
        </VStack>
      </Box>

      {/* Input */}
      <Box px={2} py={2} borderTop="1px solid #3c3c3c" bg="#2d2d2d" flexShrink={0}>
        <HStack spacing={2}>
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Întreabă despre cod..."
            size="sm"
            bg="#3c3c3c"
            border="1px solid #555"
            borderRadius="3px"
            color="#cccccc"
            fontSize="12px"
            fontFamily="system-ui, sans-serif"
            _placeholder={{ color: "#6d6d6d" }}
            _focus={{ border: "1px solid #0e639c", boxShadow: "none" }}
            onKeyDown={e => e.key === "Enter" && !loading && handleSend()}
            isDisabled={loading}
          />
          <Box
            as="button" px={3} py={1.5}
            bg={loading ? "#37373d" : "#0e639c"}
            borderRadius="3px" cursor={loading ? "default" : "pointer"}
            onClick={handleSend}
            _hover={{ bg: loading ? "#37373d" : "#1177bb" }}
            transition="background 0.1s"
            flexShrink={0}
            isDisabled={loading}
          >
            <Text fontSize="12px" color="white" fontWeight="500">
              {loading ? "..." : "Send"}
            </Text>
          </Box>
        </HStack>
      </Box>
    </Box>
  );
};

export default Chat;