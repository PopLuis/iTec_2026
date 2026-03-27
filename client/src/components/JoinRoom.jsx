import { useState } from "react";
import {
  Box, Button, Input, Text, VStack, HStack, Heading,
  InputGroup, InputLeftElement, Divider, useToast,
} from "@chakra-ui/react";

const generateRoomId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const JoinRoom = ({ onJoin }) => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState(null); // "create" | "join"
  const toast = useToast();

  const handleSubmit = () => {
    if (!username.trim()) {
      toast({ title: "Introdu un nume de utilizator", status: "warning", duration: 2000 });
      return;
    }
    const finalRoomId = mode === "create" ? generateRoomId() : roomId.trim().toUpperCase();
    if (mode === "join" && !finalRoomId) {
      toast({ title: "Introdu ID-ul camerei", status: "warning", duration: 2000 });
      return;
    }
    onJoin({ username: username.trim(), roomId: finalRoomId });
  };

  return (
    <Box
      minH="100vh"
      bg="#0f0a19"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
    >
      {/* Background glow effects */}
      <Box
        position="absolute"
        top="10%"
        left="15%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="rgba(110, 72, 255, 0.08)"
        filter="blur(80px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="15%"
        right="10%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="rgba(78, 205, 196, 0.06)"
        filter="blur(100px)"
        pointerEvents="none"
      />

      <Box
        bg="rgba(255,255,255,0.03)"
        border="1px solid rgba(255,255,255,0.08)"
        borderRadius="2xl"
        p={10}
        w="100%"
        maxW="440px"
        backdropFilter="blur(20px)"
        boxShadow="0 25px 50px rgba(0,0,0,0.5)"
      >
        {/* Header */}
        <VStack spacing={2} mb={8} align="start">
          <HStack>
            <Box w="8px" h="8px" borderRadius="full" bg="#4ECDC4" />
            <Box w="8px" h="8px" borderRadius="full" bg="#FF6B6B" />
            <Box w="8px" h="8px" borderRadius="full" bg="#FFEAA7" />
          </HStack>
          <Heading
            size="lg"
            color="white"
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="-0.5px"
          >
            Code Together
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Editor colaborativ în timp real · iTec 2026
          </Text>
        </VStack>

        <VStack spacing={4}>
          {/* Username */}
          <Box w="100%">
            <Text color="gray.400" fontSize="xs" mb={1} fontFamily="mono" letterSpacing="1px">
              NUME UTILIZATOR
            </Text>
            <Input
              placeholder="ex: alex_dev"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              bg="rgba(255,255,255,0.05)"
              border="1px solid rgba(255,255,255,0.1)"
              borderRadius="lg"
              color="white"
              fontFamily="'JetBrains Mono', monospace"
              _placeholder={{ color: "gray.600" }}
              _focus={{ border: "1px solid rgba(78, 205, 196, 0.5)", boxShadow: "0 0 0 1px rgba(78,205,196,0.2)" }}
              onKeyDown={(e) => e.key === "Enter" && mode && handleSubmit()}
            />
          </Box>

          {/* Mode selector */}
          {!mode && (
            <VStack w="100%" spacing={3} pt={2}>
              <Button
                w="100%"
                bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
                color="white"
                borderRadius="lg"
                h="48px"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="600"
                _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                transition="all 0.2s"
                onClick={() => setMode("create")}
              >
                + Creează cameră nouă
              </Button>
              <HStack w="100%">
                <Divider borderColor="rgba(255,255,255,0.08)" />
                <Text color="gray.600" fontSize="xs" whiteSpace="nowrap">sau</Text>
                <Divider borderColor="rgba(255,255,255,0.08)" />
              </HStack>
              <Button
                w="100%"
                variant="outline"
                borderColor="rgba(255,255,255,0.12)"
                color="gray.300"
                borderRadius="lg"
                h="48px"
                fontFamily="'JetBrains Mono', monospace"
                _hover={{ bg: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.2)" }}
                onClick={() => setMode("join")}
              >
                → Intră într-o cameră
              </Button>
            </VStack>
          )}

          {mode === "join" && (
            <>
              <Box w="100%">
                <Text color="gray.400" fontSize="xs" mb={1} fontFamily="mono" letterSpacing="1px">
                  ID CAMERĂ
                </Text>
                <Input
                  placeholder="ex: ABC123"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid rgba(255,255,255,0.1)"
                  borderRadius="lg"
                  color="white"
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing="3px"
                  fontSize="lg"
                  _placeholder={{ color: "gray.600", letterSpacing: "1px" }}
                  _focus={{ border: "1px solid rgba(78, 205, 196, 0.5)", boxShadow: "0 0 0 1px rgba(78,205,196,0.2)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </Box>
              <HStack w="100%" spacing={3}>
                <Button
                  flex={1}
                  variant="ghost"
                  color="gray.500"
                  borderRadius="lg"
                  onClick={() => { setMode(null); setRoomId(""); }}
                >
                  ← Înapoi
                </Button>
                <Button
                  flex={2}
                  bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
                  color="white"
                  borderRadius="lg"
                  h="48px"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="600"
                  _hover={{ opacity: 0.9 }}
                  onClick={handleSubmit}
                >
                  Intră →
                </Button>
              </HStack>
            </>
          )}

          {mode === "create" && (
            <HStack w="100%" spacing={3}>
              <Button
                flex={1}
                variant="ghost"
                color="gray.500"
                borderRadius="lg"
                onClick={() => setMode(null)}
              >
                ← Înapoi
              </Button>
              <Button
                flex={2}
                bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
                color="white"
                borderRadius="lg"
                h="48px"
                fontFamily="'JetBrains Mono', monospace"
                fontWeight="600"
                _hover={{ opacity: 0.9 }}
                onClick={handleSubmit}
              >
                Creează →
              </Button>
            </HStack>
          )}
        </VStack>

        <Text color="gray.700" fontSize="xs" textAlign="center" mt={6} fontFamily="mono">
          LAD Stack · iTec 2026
        </Text>
      </Box>
    </Box>
  );
};

export default JoinRoom;
