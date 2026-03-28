// client/src/components/Chat.jsx
import { useState, useRef, useEffect } from "react";
import {
  Box, VStack, HStack, Text, Input, IconButton, Textarea,
} from "@chakra-ui/react";

// ── Parsează și randează mesajul ──────────────────────────────
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
            <Box key={i} mt={2} mb={2} borderRadius="8px" overflow="hidden"
              border="1px solid rgba(110,72,255,0.25)">
              {/* Header bloc cod */}
              <HStack px={3} py={1.5}
                bg="rgba(110,72,255,0.15)"
                justify="space-between">
                <Text fontSize="9px" color="rgba(168,139,250,0.8)"
                  fontFamily="mono" textTransform="uppercase" letterSpacing="1px">
                  {lang}
                </Text>
                <HStack spacing={1}>
                  <Box
                    as="button"
                    px={2} py={0.5}
                    bg="rgba(0,229,160,0.15)"
                    border="1px solid rgba(0,229,160,0.3)"
                    borderRadius="5px"
                    cursor="pointer"
                    onClick={() => onInsertCode(code)}
                    _hover={{ bg: "rgba(0,229,160,0.25)" }}
                    transition="all 0.15s"
                  >
                    <Text fontSize="9px" color="#00e5a0" fontWeight="700" fontFamily="mono">
                      ✓ Inserează
                    </Text>
                  </Box>
                  <Box
                    as="button"
                    px={2} py={0.5}
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid rgba(255,255,255,0.1)"
                    borderRadius="5px"
                    cursor="pointer"
                    onClick={() => navigator.clipboard.writeText(code)}
                    _hover={{ bg: "rgba(255,255,255,0.1)" }}
                    transition="all 0.15s"
                  >
                    <Text fontSize="9px" color="gray.400" fontFamily="mono">
                      ⎘ Copiază
                    </Text>
                  </Box>
                </HStack>
              </HStack>
              {/* Codul */}
              <Box bg="rgba(0,0,0,0.5)" p={3} overflowX="auto">
                <Text color="#c4e8ff" fontSize="12px"
                  fontFamily="'JetBrains Mono', monospace"
                  whiteSpace="pre" lineHeight="1.7">
                  {code}
                </Text>
              </Box>
            </Box>
          );
        }
        // Text normal cu bold
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return (
          <Text key={i} color="gray.100" fontSize="sm" lineHeight="1.65"
            as="span" display="block">
            {boldParts.map((bp, j) =>
              bp.startsWith("**") ? (
                <Text key={j} as="span" fontWeight="700" color="white">
                  {bp.replace(/\*\*/g, "")}
                </Text>
              ) : <span key={j}>{bp}</span>
            )}
          </Text>
        );
      })}
    </Box>
  );
}

// ── Quick actions ─────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "✦ Explică",     prompt: "Explică codul din editor pe scurt" },
  { label: "🐛 Fix bug",    prompt: "Găsește și fixează bug-urile din codul din editor. Returnează codul fix complet." },
  { label: "⚡ Optimizează", prompt: "Optimizează codul din editor pentru performanță. Returnează codul optimizat complet." },
  { label: "📝 Comentarii", prompt: "Adaugă comentarii explicative în codul din editor. Returnează codul cu comentarii." },
  { label: "🧪 Teste",      prompt: "Generează teste pentru funcțiile din codul din editor." },
];

// ════════════════════════════════════════════════════════════════
const Chat = ({ isOpen, onToggle, currentUser, getEditorCode, onInsertCode }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Salut! Sunt **AI Copilot** — pot să explic codul, să fixez bug-uri și să generez funcții noi.\n\nCând generez cod, poți apăsa **✓ Inserează** ca să îl pun direct în editor. 🚀",
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

  // ── Trimite mesaj ─────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text }]);
    setLoading(true);

    try {
      const editorCode = getEditorCode?.() || "";
      const history = messages
        .filter((m) => m.id !== 1)
        .slice(-9)
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.text,
        }));
      history.push({ role: "user", content: text });

      const response = await fetch("http://localhost:3001/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, editorCode }),
      });

      if (!response.ok) throw new Error("Server error " + response.status);
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", text: data.text },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "❌ Nu mă pot conecta la server.\n\nAsigură-te că rulezi:\n```bash\ncd server && node server.js\n```",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput("");
  };

  // ── Inserează codul în editor ─────────────────────────────
  const handleInsertCode = (code, msgId) => {
    onInsertCode?.(code);
    setInsertedId(msgId);
    setTimeout(() => setInsertedId(null), 2000);
  };

  const clearChat = () => setMessages([{
    id: Date.now(),
    role: "assistant",
    text: "Conversație resetată. Cu ce te pot ajuta? 🚀",
  }]);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      bottom="20px" right="20px"
      w="360px" h="540px"
      bg="rgba(8, 6, 18, 0.98)"
      border="1px solid rgba(110,72,255,0.25)"
      borderRadius="16px"
      display="flex" flexDirection="column"
      backdropFilter="blur(24px)"
      boxShadow="0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(110,72,255,0.1) inset"
      zIndex={1000}
      overflow="hidden"
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <HStack px={4} py={3}
        borderBottom="1px solid rgba(255,255,255,0.06)"
        justify="space-between"
        bg="linear-gradient(135deg, rgba(110,72,255,0.12), rgba(78,205,196,0.06))"
      >
        <HStack spacing={2}>
          <Box w="8px" h="8px" borderRadius="full"
            bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
            boxShadow="0 0 10px rgba(110,72,255,0.9)"
            style={{ animation: "aiGlow 2s ease-in-out infinite" }}
          />
          <Text color="white" fontSize="13px" fontFamily="mono" fontWeight="700"
            letterSpacing="-0.3px">
            ✦ AI Copilot
          </Text>
          <Box px={2} py={0.5}
            bg="rgba(0,229,160,0.12)"
            border="1px solid rgba(0,229,160,0.2)"
            borderRadius="20px">
            <Text fontSize="9px" color="#00e5a0" fontWeight="700" letterSpacing="0.5px">
              LIVE
            </Text>
          </Box>
        </HStack>
        <HStack spacing={1}>
          <IconButton size="xs" variant="ghost" color="gray.600"
            title="Resetează" icon={<Text fontSize="12px">↺</Text>}
            onClick={clearChat} _hover={{ color: "white" }} aria-label="Clear" />
          <IconButton size="xs" variant="ghost" color="gray.600"
            icon={<Text fontSize="16px" lineHeight="1">×</Text>}
            onClick={onToggle} _hover={{ color: "white" }} aria-label="Close" />
        </HStack>
      </HStack>

      {/* ── Quick actions ───────────────────────────────────── */}
      <Box px={3} py={2} borderBottom="1px solid rgba(255,255,255,0.04)"
        bg="rgba(0,0,0,0.2)">
        <HStack spacing={1} flexWrap="wrap" gap={1}>
          {QUICK_ACTIONS.map((action) => (
            <Box key={action.label} as="button"
              px={2} py={1}
              bg="rgba(110,72,255,0.08)"
              border="1px solid rgba(110,72,255,0.15)"
              borderRadius="6px" cursor="pointer"
              onClick={() => !loading && sendMessage(action.prompt)}
              _hover={{ bg: "rgba(110,72,255,0.18)", borderColor: "rgba(110,72,255,0.35)" }}
              transition="all 0.15s">
              <Text color="gray.300" fontSize="10px" fontFamily="mono" fontWeight="500">
                {action.label}
              </Text>
            </Box>
          ))}
        </HStack>
      </Box>

      {/* ── Messages ────────────────────────────────────────── */}
      <Box flex={1} overflowY="auto" px={3} py={3}
        css={{
          "&::-webkit-scrollbar": { width: "3px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(110,72,255,0.25)", borderRadius: "3px" },
        }}>
        <VStack align="stretch" spacing={3}>
          {messages.map((msg) => (
            <Box key={msg.id}
              alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
              maxW="95%">
              {msg.role === "assistant" && (
                <HStack spacing={1} mb={1}>
                  <Box w="14px" h="14px" borderRadius="full"
                    bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
                    display="flex" alignItems="center" justifyContent="center"
                    fontSize="8px" color="white" flexShrink={0}>✦</Box>
                  <Text fontSize="9px" color="rgba(110,72,255,0.7)"
                    fontFamily="mono" fontWeight="600">AI Copilot</Text>
                  {insertedId === msg.id && (
                    <Text fontSize="9px" color="#00e5a0" fontWeight="700">✓ Inserat!</Text>
                  )}
                </HStack>
              )}
              {msg.role === "user" && (
                <Text fontSize="9px" color="gray.600" fontFamily="mono"
                  mb="2px" textAlign="right">{currentUser || "Tu"}</Text>
              )}
              <Box px={msg.role === "user" ? 3 : 0}
                py={msg.role === "user" ? 2 : 0}
                borderRadius={msg.role === "user" ? "12px 12px 2px 12px" : "0"}
                bg={msg.role === "user" ? "rgba(110,72,255,0.2)" : "transparent"}
                border={msg.role === "user" ? "1px solid rgba(110,72,255,0.3)" : "none"}
              >
                <MessageContent
                  text={msg.text}
                  onInsertCode={(code) => handleInsertCode(code, msg.id)}
                />
              </Box>
            </Box>
          ))}

          {/* Loading */}
          {loading && (
            <Box alignSelf="flex-start">
              <HStack spacing={1} mb={1}>
                <Box w="14px" h="14px" borderRadius="full"
                  bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
                  display="flex" alignItems="center" justifyContent="center"
                  fontSize="8px" color="white">✦</Box>
                <Text fontSize="9px" color="rgba(110,72,255,0.7)" fontFamily="mono" fontWeight="600">
                  AI Copilot
                </Text>
              </HStack>
              <HStack spacing={1} px={3} py={2}
                bg="rgba(255,255,255,0.03)"
                border="1px solid rgba(255,255,255,0.06)"
                borderRadius="2px 12px 12px 12px"
                width="fit-content">
                {[0, 1, 2].map((i) => (
                  <Box key={i} w="5px" h="5px" borderRadius="full"
                    bg="rgba(110,72,255,0.6)"
                    style={{ animation: `aiTyping 1s ${i * 0.2}s infinite` }} />
                ))}
                <Text color="gray.600" fontSize="11px" ml={1} fontFamily="mono">
                  generează...
                </Text>
              </HStack>
            </Box>
          )}
          <div ref={bottomRef} />
        </VStack>
      </Box>

      {/* ── Input ───────────────────────────────────────────── */}
      <Box px={3} py={3} borderTop="1px solid rgba(255,255,255,0.06)"
        bg="rgba(0,0,0,0.2)">
        <HStack spacing={2} align="flex-end">
          <Box flex={1}
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(110,72,255,0.2)"
            borderRadius="10px"
            px={3} py={2}
            _focusWithin={{ border: "1px solid rgba(110,72,255,0.5)" }}
            transition="border 0.15s">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Întreabă sau descrie ce cod vrei..."
              variant="unstyled"
              color="white"
              fontFamily="mono"
              fontSize="12.5px"
              _placeholder={{ color: "rgba(255,255,255,0.2)" }}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
              isDisabled={loading}
            />
          </Box>
          <IconButton
            size="sm"
            bg={loading ? "rgba(110,72,255,0.3)" : "linear-gradient(135deg, #6E48FF, #4ECDC4)"}
            color="white" borderRadius="10px"
            icon={<Text fontSize="14px" fontWeight="700">{loading ? "⏳" : "↑"}</Text>}
            onClick={handleSend}
            _hover={{ opacity: 0.85, transform: "translateY(-1px)" }}
            transition="all 0.15s"
            aria-label="Send" minW="36px" h="36px"
            isDisabled={loading}
          />
        </HStack>
        <Text fontSize="9px" color="rgba(255,255,255,0.15)" mt={1.5}
          fontFamily="mono" textAlign="center">
          Enter pentru a trimite · codul generat poate fi inserat direct în editor
        </Text>
      </Box>

      <style>{`
        @keyframes aiTyping {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes aiGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(110,72,255,0.9); }
          50% { box-shadow: 0 0 18px rgba(78,205,196,0.7); }
        }
      `}</style>
    </Box>
  );
};

export default Chat;