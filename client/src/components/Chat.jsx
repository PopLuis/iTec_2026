import { useState, useRef, useEffect } from "react";
import {
  Box, VStack, HStack, Text, Input, IconButton,
  Avatar, Flex,
} from "@chakra-ui/react";

const Chat = ({ messages, typingUsers, onSend, currentUser, isOpen, onToggle }) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  const typingList = Object.values(typingUsers).filter(Boolean);

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      bottom="20px"
      right="20px"
      w="320px"
      h="420px"
      bg="rgba(15, 10, 25, 0.95)"
      border="1px solid rgba(255,255,255,0.08)"
      borderRadius="xl"
      display="flex"
      flexDirection="column"
      backdropFilter="blur(20px)"
      boxShadow="0 20px 60px rgba(0,0,0,0.6)"
      zIndex={1000}
      overflow="hidden"
    >
      {/* Header */}
      <HStack
        px={4}
        py={3}
        borderBottom="1px solid rgba(255,255,255,0.06)"
        justify="space-between"
      >
        <HStack spacing={2}>
          <Box w="8px" h="8px" borderRadius="full" bg="#4ECDC4" boxShadow="0 0 8px #4ECDC4" />
          <Text color="white" fontSize="sm" fontFamily="mono" fontWeight="600">
            Chat
          </Text>
          <Text color="gray.600" fontSize="xs">
            {messages.length} mesaje
          </Text>
        </HStack>
        <IconButton
          size="xs"
          variant="ghost"
          color="gray.600"
          icon={<Text fontSize="lg" lineHeight="1">×</Text>}
          onClick={onToggle}
          _hover={{ color: "white" }}
          aria-label="Close chat"
        />
      </HStack>

      {/* Messages */}
      <Box flex={1} overflowY="auto" px={3} py={3}
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.1)", borderRadius: "4px" },
        }}
      >
        <VStack align="stretch" spacing={2}>
          {messages.length === 0 && (
            <Text color="gray.700" fontSize="xs" textAlign="center" mt={4} fontFamily="mono">
              Niciun mesaj încă.<br />Spune ceva! 👋
            </Text>
          )}
          {messages.map((msg) => {
            const isMe = msg.username === currentUser;
            return (
              <Box key={msg.id} alignSelf={isMe ? "flex-end" : "flex-start"} maxW="85%">
                {!isMe && (
                  <Text fontSize="9px" color={msg.color} fontFamily="mono" mb="2px" pl={1}>
                    {msg.username}
                  </Text>
                )}
                <Box
                  px={3}
                  py={2}
                  borderRadius={isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px"}
                  bg={isMe ? "rgba(110, 72, 255, 0.3)" : "rgba(255,255,255,0.06)"}
                  border={`1px solid ${isMe ? "rgba(110,72,255,0.4)" : "rgba(255,255,255,0.08)"}`}
                >
                  <Text color="gray.100" fontSize="sm" lineHeight="1.4">
                    {msg.text}
                  </Text>
                </Box>
                <Text fontSize="9px" color="gray.700" fontFamily="mono" mt="2px"
                  textAlign={isMe ? "right" : "left"} px={1}>
                  {msg.timestamp}
                </Text>
              </Box>
            );
          })}

          {typingList.length > 0 && (
            <Box alignSelf="flex-start" maxW="85%">
              <Box
                px={3} py={2}
                borderRadius="12px 12px 12px 2px"
                bg="rgba(255,255,255,0.04)"
                border="1px solid rgba(255,255,255,0.06)"
              >
                <HStack spacing={1}>
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      w="4px" h="4px"
                      borderRadius="full"
                      bg="gray.500"
                      style={{
                        animation: `bounce 1s ${i * 0.15}s infinite`,
                      }}
                    />
                  ))}
                  <Text color="gray.600" fontSize="xs" ml={1}>
                    {typingList.join(", ")} scrie...
                  </Text>
                </HStack>
              </Box>
            </Box>
          )}
          <div ref={bottomRef} />
        </VStack>
      </Box>

      {/* Input */}
      <HStack
        px={3}
        py={3}
        borderTop="1px solid rgba(255,255,255,0.06)"
        spacing={2}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrie un mesaj..."
          size="sm"
          bg="rgba(255,255,255,0.04)"
          border="1px solid rgba(255,255,255,0.08)"
          borderRadius="lg"
          color="white"
          fontFamily="mono"
          fontSize="sm"
          _placeholder={{ color: "gray.700" }}
          _focus={{ border: "1px solid rgba(78,205,196,0.4)", boxShadow: "none" }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <IconButton
          size="sm"
          bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
          color="white"
          borderRadius="lg"
          icon={<Text fontSize="sm">↑</Text>}
          onClick={handleSend}
          _hover={{ opacity: 0.85 }}
          aria-label="Send"
          minW="36px"
        />
      </HStack>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </Box>
  );
};

export default Chat;
