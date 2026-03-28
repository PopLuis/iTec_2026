// client/src/App.jsx
import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import CodeEditor from "./components/CodeEditor";
import {
  Box, VStack, HStack, Text, Input, Button, useToast,
} from "@chakra-ui/react";

// ── Ecran de login ────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [name, setName] = useState("");
  const toast = useToast();

  function handleLogin() {
    if (!name.trim()) {
      toast({ title: "Introdu un nume", status: "warning", duration: 2000 });
      return;
    }
    localStorage.setItem("itec_username", name.trim());
    onLogin(name.trim());
  }

  return (
    <Box minH="100vh" bg="#0a0a0f" display="flex" alignItems="center" justifyContent="center">
      {/* Glow background */}
      <Box position="absolute" top="15%" left="20%" w="350px" h="350px"
        borderRadius="full" bg="rgba(110,72,255,0.07)" filter="blur(90px)" pointerEvents="none" />
      <Box position="absolute" bottom="10%" right="15%" w="400px" h="400px"
        borderRadius="full" bg="rgba(78,205,196,0.05)" filter="blur(100px)" pointerEvents="none" />

      <Box
        w="100%" maxW="400px"
        bg="rgba(255,255,255,0.03)"
        border="1px solid rgba(255,255,255,0.07)"
        borderRadius="16px" p={10}
        backdropFilter="blur(20px)"
        boxShadow="0 24px 64px rgba(0,0,0,0.5)"
      >
        {/* Logo */}
        <VStack spacing={1} mb={8} align="start">
          <HStack spacing={3}>
            <Box w="36px" h="36px" borderRadius="10px"
              bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
              display="flex" alignItems="center" justifyContent="center"
              fontSize="18px" boxShadow="0 0 20px rgba(110,72,255,0.4)">⚡</Box>
            <VStack spacing={0} align="start">
              <Text fontSize="18px" fontWeight="800" color="white" letterSpacing="-0.5px">
                CollabCode
              </Text>
              <Text fontSize="10px" color="gray.500" fontFamily="mono">iTec 2026</Text>
            </VStack>
          </HStack>
          <Text color="gray.500" fontSize="13px" mt={3}>
            Editor colaborativ în timp real
          </Text>
        </VStack>

        <VStack spacing={4}>
          <Box w="100%">
            <Text color="gray.400" fontSize="10px" mb={1.5}
              fontFamily="mono" letterSpacing="1px" textTransform="uppercase">
              Nume utilizator
            </Text>
            <Input
              placeholder="ex: PopLuis, Darius99..."
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              bg="rgba(255,255,255,0.05)"
              border="1px solid rgba(255,255,255,0.1)"
              borderRadius="10px" color="white"
              fontFamily="mono" fontSize="14px"
              _placeholder={{ color: "gray.600" }}
              _focus={{ border: "1px solid rgba(110,72,255,0.5)", boxShadow: "none" }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </Box>

          <Button w="100%" h="46px"
            bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
            color="white" borderRadius="10px"
            fontFamily="mono" fontWeight="700" fontSize="13px"
            _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
            transition="all 0.2s"
            boxShadow="0 4px 16px rgba(110,72,255,0.3)"
            onClick={handleLogin}
          >
            Intră →
          </Button>
        </VStack>

        <Text color="gray.700" fontSize="10px" textAlign="center" mt={6} fontFamily="mono">
          Numele tău va fi vizibil colegilor în timp real
        </Text>
      </Box>
    </Box>
  );
}

// ════════════════════════════════════════════════════════════
export default function App() {
  const [username, setUsername] = useState(() =>
    localStorage.getItem("itec_username") || ""
  );
  const [screen, setScreen] = useState("dashboard"); // "dashboard" | "editor"
  const [session, setSession] = useState({ roomId: "", projectName: "" });
  const [showSwitchUser, setShowSwitchUser] = useState(false);
  const [newName, setNewName] = useState("");
  const toast = useToast();

  // ── Login ────────────────────────────────────────────────
  function handleLogin(name) {
    setUsername(name);
    setScreen("dashboard");
  }

  // ── Logout ───────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem("itec_username");
    setUsername("");
    setScreen("dashboard");
    setSession({ roomId: "", projectName: "" });
  }

  // ── Schimbă utilizator ───────────────────────────────────
  function handleSwitchUser() {
    if (!newName.trim()) return;
    localStorage.setItem("itec_username", newName.trim());
    setUsername(newName.trim());
    setNewName("");
    setShowSwitchUser(false);
    setScreen("dashboard");
    toast({ title: `👤 Conectat ca ${newName.trim()}`, status: "success", duration: 2000 });
  }

  // ── Intră în proiect ─────────────────────────────────────
  function handleJoin({ roomId, projectName }) {
    setSession({ roomId, projectName });
    setScreen("editor");
  }

  // ── Ecran login dacă nu avem username ────────────────────
  if (!username) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // ── Editor ───────────────────────────────────────────────
  if (screen === "editor") {
    return (
      <CodeEditor
        username={username}
        roomId={session.roomId}
        projectName={session.projectName}
        onBack={() => setScreen("dashboard")}
      />
    );
  }

  // ── Dashboard ────────────────────────────────────────────
  return (
    <Box position="relative">
      {/* Modal schimba user */}
      {showSwitchUser && (
        <Box
          position="fixed" inset={0} zIndex={200}
          bg="rgba(0,0,0,0.7)" backdropFilter="blur(6px)"
          display="flex" alignItems="center" justifyContent="center"
          onClick={() => setShowSwitchUser(false)}
        >
          <Box
            bg="rgba(15,10,25,0.98)"
            border="1px solid rgba(110,72,255,0.3)"
            borderRadius="14px" p={6} w="340px"
            boxShadow="0 24px 64px rgba(0,0,0,0.6)"
            onClick={e => e.stopPropagation()}
          >
            <Text fontSize="15px" fontWeight="700" color="white" mb={1}>
              Schimbă utilizatorul
            </Text>
            <Text fontSize="12px" color="gray.500" mb={4}>
              Conectat acum ca <strong style={{ color: "#a78bfa" }}>{username}</strong>
            </Text>

            <Input
              placeholder="Nume nou..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              bg="rgba(255,255,255,0.05)"
              border="1px solid rgba(255,255,255,0.1)"
              borderRadius="8px" color="white"
              fontFamily="mono" mb={3}
              _placeholder={{ color: "gray.600" }}
              _focus={{ border: "1px solid rgba(110,72,255,0.4)", boxShadow: "none" }}
              onKeyDown={e => {
                if (e.key === "Enter") handleSwitchUser();
                if (e.key === "Escape") setShowSwitchUser(false);
              }}
            />

            <HStack spacing={2}>
              <Button flex={1} h="38px"
                bg="linear-gradient(135deg,#6E48FF,#4ECDC4)"
                color="white" borderRadius="8px"
                fontFamily="mono" fontWeight="700" fontSize="12px"
                _hover={{ opacity: 0.9 }}
                onClick={handleSwitchUser}
              >
                Schimbă →
              </Button>
              <Button flex={1} h="38px" variant="ghost"
                color="gray.500" borderRadius="8px" fontSize="12px"
                onClick={() => setShowSwitchUser(false)}
              >
                Anulează
              </Button>
            </HStack>

            <Box
              as="button" w="100%" mt={3} py={2}
              bg="rgba(255,95,126,0.08)"
              border="1px solid rgba(255,95,126,0.2)"
              borderRadius="8px" cursor="pointer"
              _hover={{ bg: "rgba(255,95,126,0.15)" }}
              onClick={handleLogout}
            >
              <Text fontSize="11px" color="#ff5f7e" fontWeight="600" fontFamily="mono">
                🚪 Deconectează-te complet
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      <Dashboard
        username={username}
        onJoin={handleJoin}
        onSwitchUser={() => setShowSwitchUser(true)}
        onLogout={handleLogout}
      />
    </Box>
  );
}