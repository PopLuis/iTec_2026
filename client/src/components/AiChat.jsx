// client/src/components/AiChat.jsx
import { useState, useRef, useEffect } from "react";
import { Box, VStack, HStack, Text, Input, IconButton } from "@chakra-ui/react";
import { useAiChat } from "../hooks/useAiChat";

function MessageContent({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <Box>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].replace("```", "").trim() || "code";
          const code = lines.slice(1, -1).join("\n");
          return (
            <Box key={i} bg="rgba(0,0,0,0.4)" border="1px solid rgba(255,255,255,0.08)"
              borderRadius="md" p={3} mt={2} mb={2} overflowX="auto">
              <Text fontSize="9px" color="rgba(78,205,196,0.6)" fontFamily="mono"
                mb={1} textTransform="uppercase" letterSpacing="1px">{lang}</Text>
              <Text color="#e2e8f0" fontSize="12px"
                fontFamily="'JetBrains Mono', monospace" whiteSpace="pre" lineHeight="1.6">
                {code}
              </Text>
            </Box>
          );
        }
        const boldParts = part.split(/(\*\*.*?\*\*)/g);
        return (
          <Text key={i} color="gray.100" fontSize="sm" lineHeight="1.6" as="span" display="block">
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

const AiChat = ({ isOpen, onToggle, getEditorCode }) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const { messages, loading, sendMessage, clearMessages } = useAiChat(getEditorCode);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const quickActions = [
    { label: "✦ Explică codul", prompt: "Explică codul din editor pe scurt" },
    { label: "🐛 Fix bug",      prompt: "Găsește și fixează bug-urile din codul din editor" },
    { label: "⚡ Optimizează",  prompt: "Optimizează codul din editor" },
    { label: "📝 Comentarii",   prompt: "Adaugă comentarii explicative în codul din editor" },
  ];

  if (!isOpen) return null;

  return (
    <Box position="fixed" bottom="20px" right={350}
      w="340px" h="480px"
      bg="rgba(10, 8, 20, 0.97)"
      border="1px solid rgba(110, 72, 255, 0.3)"
      borderRadius="xl" display="flex" flexDirection="column"
      backdropFilter="blur(20px)"
      boxShadow="0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(110,72,255,0.1)"
      zIndex={999} overflow="hidden"
    >
      {/* Header */}
      <HStack px={4} py={3} borderBottom="1px solid rgba(110,72,255,0.15)"
        justify="space-between" bg="rgba(110,72,255,0.08)">
        <HStack spacing={2}>
          <Box w="8px" h="8px" borderRadius="full"
            bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
            boxShadow="0 0 8px rgba(110,72,255,0.8)"
            style={{ animation: "pulse 2s infinite" }} />
          <Text color="white" fontSize="sm" fontFamily="mono" fontWeight="700">✦ AI Copilot</Text>
          <Text color="gray.600" fontSize="xs">GPT-3.5</Text>
        </HStack>
        <HStack spacing={1}>
          <IconButton size="xs" variant="ghost" color="gray.600"
            title="Resetează" icon={<Text fontSize="sm">↺</Text>}
            onClick={clearMessages} _hover={{ color: "white" }} aria-label="Clear" />
          <IconButton size="xs" variant="ghost" color="gray.600"
            icon={<Text fontSize="lg" lineHeight="1">×</Text>}
            onClick={onToggle} _hover={{ color: "white" }} aria-label="Close" />
        </HStack>
      </HStack>

      {/* Quick actions */}
      <Box px={3} py={2} borderBottom="1px solid rgba(255,255,255,0.05)">
        <HStack spacing={1} flexWrap="wrap" gap={1}>
          {quickActions.map((action) => (
            <Box key={action.label} as="button" px={2} py={1}
              bg="rgba(110,72,255,0.1)" border="1px solid rgba(110,72,255,0.2)"
              borderRadius="md" cursor="pointer"
              onClick={() => !loading && sendMessage(action.prompt)}
              _hover={{ bg: "rgba(110,72,255,0.2)", borderColor: "rgba(110,72,255,0.4)" }}
              transition="all 0.15s">
              <Text color="gray.300" fontSize="10px" fontFamily="mono" fontWeight="500">
                {action.label}
              </Text>
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Messages */}
      <Box flex={1} overflowY="auto" px={3} py={3}
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(110,72,255,0.3)", borderRadius: "4px" },
        }}>
        <VStack align="stretch" spacing={3}>
          {messages.map((msg) => (
            <Box key={msg.id}
              alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
              maxW="90%">
              {msg.role === "assistant" && (
                <HStack spacing={1} mb={1}>
                  <Box w="14px" h="14px" borderRadius="full"
                    bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
                    display="flex" alignItems="center" justifyContent="center"
                    fontSize="8px" color="white">✦</Box>
                  <Text fontSize="9px" color="rgba(110,72,255,0.8)" fontFamily="mono" fontWeight="600">
                    AI Copilot
                  </Text>
                </HStack>
              )}
              <Box px={3} py={2}
                borderRadius={msg.role === "user" ? "12px 12px 2px 12px" : "2px 12px 12px 12px"}
                bg={msg.role === "user" ? "rgba(110,72,255,0.25)" : "rgba(255,255,255,0.04)"}
                border={`1px solid ${msg.role === "user" ? "rgba(110,72,255,0.35)" : "rgba(255,255,255,0.06)"}`}>
                <MessageContent text={msg.text} />
              </Box>
            </Box>
          ))}

          {loading && (
            <Box alignSelf="flex-start">
              <Box px={3} py={2} borderRadius="2px 12px 12px 12px"
                bg="rgba(255,255,255,0.04)" border="1px solid rgba(255,255,255,0.06)">
                <HStack spacing={1}>
                  {[0, 1, 2].map((i) => (
                    <Box key={i} w="5px" h="5px" borderRadius="full"
                      bg="rgba(110,72,255,0.7)"
                      style={{ animation: `aiTyping 1s ${i * 0.2}s infinite` }} />
                  ))}
                  <Text color="gray.600" fontSize="xs" ml={1} fontFamily="mono">
                    GPT gândește...
                  </Text>
                </HStack>
              </Box>
            </Box>
          )}
          <div ref={bottomRef} />
        </VStack>
      </Box>

      {/* Input */}
      <HStack px={3} py={3} borderTop="1px solid rgba(110,72,255,0.1)" spacing={2}>
        <Input ref={inputRef} value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Întreabă despre cod..."
          size="sm" bg="rgba(255,255,255,0.04)"
          border="1px solid rgba(110,72,255,0.2)"
          borderRadius="lg" color="white" fontFamily="mono" fontSize="sm"
          _placeholder={{ color: "gray.700" }}
          _focus={{ border: "1px solid rgba(110,72,255,0.5)", boxShadow: "0 0 0 1px rgba(110,72,255,0.2)" }}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
          isDisabled={loading} />
        <IconButton size="sm" bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
          color="white" borderRadius="lg"
          icon={<Text fontSize="sm">{loading ? "⏳" : "↑"}</Text>}
          onClick={handleSend} _hover={{ opacity: 0.85 }}
          aria-label="Send" minW="36px" isDisabled={loading} />
      </HStack>

      <style>{`
        @keyframes aiTyping {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Box>
  );
};

export default AiChat;