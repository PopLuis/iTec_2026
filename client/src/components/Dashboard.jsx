// client/src/components/Dashboard.jsx
import { useState, useEffect } from "react";
import {
  Box, VStack, HStack, Text, Input, Button,
  Grid, GridItem, useToast,
} from "@chakra-ui/react";

const generateRoomId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// ── Proiecte per user ─────────────────────────────────────────
function getProjects(username) {
  try {
    return JSON.parse(localStorage.getItem(`itec_projects_${username}`) || "[]");
  } catch { return []; }
}

function saveProjects(username, projects) {
  localStorage.setItem(`itec_projects_${username}`, JSON.stringify(projects));
}

const PROJECT_ICONS = ["⚡", "🚀", "🔥", "💎", "🌟", "🎯", "🛠️", "🎨", "🧩", "🦄"];

const Dashboard = ({ username, onJoin, onSwitchUser, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName]   = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode]         = useState(null);
  const [search, setSearch]     = useState("");
  const toast = useToast();

  // Încarcă proiectele userului curent
  useEffect(() => {
    setProjects(getProjects(username));
  }, [username]);

  function createProject() {
    if (!newName.trim()) {
      toast({ title: "Introdu un nume", status: "warning", duration: 2000 });
      return;
    }
    const project = {
      id: generateRoomId(),
      name: newName.trim(),
      icon: PROJECT_ICONS[Math.floor(Math.random() * PROJECT_ICONS.length)],
      createdAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      owner: username,
    };
    const updated = [project, ...projects];
    setProjects(updated);
    saveProjects(username, updated);
    setNewName("");
    setMode(null);
    onJoin({ roomId: project.id, projectName: project.name });
  }

  function joinByCode() {
    const id = joinCode.trim().toUpperCase();
    if (id.length < 4) {
      toast({ title: "Cod invalid — minim 4 caractere", status: "warning", duration: 2000 });
      return;
    }

    // Verifică dacă proiectul e deja în lista userului
    const exists = projects.find(p => p.id === id);

    if (!exists) {
      // Adaugă proiectul în lista userului curent
      const project = {
        id,
        name: `Proiect ${id}`,
        icon: PROJECT_ICONS[Math.floor(Math.random() * PROJECT_ICONS.length)],
        createdAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
        owner: "shared",
      };
      const updated = [project, ...projects];
      setProjects(updated);
      saveProjects(username, updated);
      toast({ title: `✅ Acces acordat la proiectul ${id}`, status: "success", duration: 2000 });
    } else {
      // Actualizează lastOpenedAt
      const updated = projects.map(p =>
        p.id === id ? { ...p, lastOpenedAt: new Date().toISOString() } : p
      );
      setProjects(updated);
      saveProjects(username, updated);
    }

    setJoinCode("");
    setMode(null);
    onJoin({ roomId: id, projectName: exists?.name || `Proiect ${id}` });
  }

  function openProject(project) {
    const updated = projects.map(p =>
      p.id === project.id ? { ...p, lastOpenedAt: new Date().toISOString() } : p
    );
    setProjects(updated);
    saveProjects(username, updated);
    onJoin({ roomId: project.id, projectName: project.name });
  }

  function deleteProject(e, id) {
    e.stopPropagation();
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveProjects(username, updated);
    toast({ title: "Proiect eliminat din lista ta", status: "info", duration: 2000 });
  }

  function renameProject(e, project) {
    e.stopPropagation();
    const newNameVal = prompt("Nume nou pentru proiect:", project.name);
    if (!newNameVal?.trim()) return;
    const updated = projects.map(p =>
      p.id === project.id ? { ...p, name: newNameVal.trim() } : p
    );
    setProjects(updated);
    saveProjects(username, updated);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return "acum";
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ore`;
    return d.toLocaleDateString("ro-RO");
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const myProjects     = filtered.filter(p => p.owner === username);
  const sharedProjects = filtered.filter(p => p.owner !== username);

  return (
    <Box minH="100vh" bg="#0a0a0f" color="white">

      {/* ── Header ─────────────────────────────────────────── */}
      <Box
        bg="rgba(255,255,255,0.02)"
        borderBottom="1px solid rgba(255,255,255,0.06)"
        px={8} py={4}
      >
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Box w="30px" h="30px" borderRadius="8px"
              bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
              display="flex" alignItems="center" justifyContent="center"
              fontSize="15px" boxShadow="0 0 14px rgba(110,72,255,0.4)">⚡</Box>
            <VStack spacing={0} align="start">
              <Text fontSize="14px" fontWeight="800" letterSpacing="-0.3px">CollabCode</Text>
              <Text fontSize="9px" color="gray.600" fontFamily="mono">iTec 2026</Text>
            </VStack>
          </HStack>

          <HStack spacing={2}>
            {/* Avatar + nume — click pentru schimbare user */}
            <Box
              px={3} py={1.5}
              bg="rgba(110,72,255,0.08)"
              border="1px solid rgba(110,72,255,0.15)"
              borderRadius="20px"
              cursor="pointer"
              onClick={onSwitchUser}
              _hover={{ bg: "rgba(110,72,255,0.15)", borderColor: "rgba(110,72,255,0.3)" }}
              transition="all 0.15s"
              title="Schimbă utilizatorul"
            >
              <HStack spacing={1.5}>
                <Box w="18px" h="18px" borderRadius="full"
                  bg="linear-gradient(135deg,#6E48FF,#4ECDC4)"
                  display="flex" alignItems="center" justifyContent="center"
                  fontSize="9px" color="#000" fontWeight="800">
                  {username[0]?.toUpperCase()}
                </Box>
                <Text fontSize="12px" color="rgba(167,139,250,0.9)" fontWeight="600">
                  {username}
                </Text>
                <Text fontSize="10px" color="gray.600">▾</Text>
              </HStack>
            </Box>

            {/* Logout */}
            <Box
              as="button"
              px={3} py={1.5}
              bg="rgba(255,95,126,0.06)"
              border="1px solid rgba(255,95,126,0.15)"
              borderRadius="8px"
              cursor="pointer"
              onClick={onLogout}
              _hover={{ bg: "rgba(255,95,126,0.12)", borderColor: "rgba(255,95,126,0.25)" }}
              transition="all 0.15s"
              title="Deconectează-te"
            >
              <Text fontSize="11px" color="rgba(255,95,126,0.8)" fontWeight="600">
                🚪 Ieși
              </Text>
            </Box>
          </HStack>
        </HStack>
      </Box>

      <Box px={8} py={6} maxW="1100px" mx="auto">

        {/* Titlu + search */}
        <HStack justify="space-between" mb={6} align="flex-end">
          <VStack spacing={1} align="start">
            <Text fontSize="22px" fontWeight="800" letterSpacing="-0.5px">
              Proiectele tale
            </Text>
            <Text fontSize="12px" color="gray.600">
              Bun venit, <strong style={{ color: "#a78bfa" }}>{username}</strong>
              {" "}· {projects.length} proiect{projects.length !== 1 ? "e" : ""}
            </Text>
          </VStack>
          <Input
            placeholder="🔍  Caută..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            w="200px" size="sm"
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.07)"
            borderRadius="8px" color="white" fontSize="12px" fontFamily="mono"
            _placeholder={{ color: "gray.600" }}
            _focus={{ border: "1px solid rgba(110,72,255,0.3)", boxShadow: "none" }}
          />
        </HStack>

        {/* Butoane acțiuni */}
        {!mode && (
          <HStack spacing={3} mb={8}>
            <Box as="button" onClick={() => setMode("create")}
              px={5} py={2.5}
              bg="linear-gradient(135deg, #6E48FF, #4ECDC4)"
              borderRadius="10px" cursor="pointer"
              _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
              transition="all 0.2s"
              boxShadow="0 4px 16px rgba(110,72,255,0.25)">
              <HStack spacing={2}>
                <Text fontSize="15px">+</Text>
                <Text fontSize="12px" fontWeight="700">Proiect nou</Text>
              </HStack>
            </Box>

            <Box as="button" onClick={() => setMode("join")}
              px={5} py={2.5}
              bg="rgba(78,205,196,0.08)"
              border="1px solid rgba(78,205,196,0.2)"
              borderRadius="10px" cursor="pointer"
              _hover={{ bg: "rgba(78,205,196,0.14)" }}
              transition="all 0.2s">
              <HStack spacing={2}>
                <Text fontSize="13px">🔗</Text>
                <Text fontSize="12px" fontWeight="600" color="#4ECDC4">
                  Intră cu cod
                </Text>
              </HStack>
            </Box>
          </HStack>
        )}

        {/* Formular creare proiect */}
        {mode === "create" && (
          <Box mb={8} p={5}
            bg="rgba(110,72,255,0.06)"
            border="1px solid rgba(110,72,255,0.2)"
            borderRadius="12px">
            <Text fontSize="12px" fontWeight="700" color="gray.400" mb={1}
              fontFamily="mono" textTransform="uppercase" letterSpacing="1px">
              Proiect nou
            </Text>
            <Text fontSize="11px" color="gray.600" mb={3}>
              Se va genera un cod unic pe care îl poți trimite colegilor
            </Text>
            <HStack spacing={3}>
              <Input
                placeholder="ex: Backend API, Frontend App..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                autoFocus
                bg="rgba(255,255,255,0.05)"
                border="1px solid rgba(255,255,255,0.1)"
                borderRadius="8px" color="white" fontFamily="mono"
                _placeholder={{ color: "gray.600" }}
                _focus={{ border: "1px solid rgba(110,72,255,0.5)", boxShadow: "none" }}
                onKeyDown={e => {
                  if (e.key === "Enter") createProject();
                  if (e.key === "Escape") { setMode(null); setNewName(""); }
                }}
              />
              <Button onClick={createProject} flexShrink={0}
                bg="linear-gradient(135deg,#6E48FF,#4ECDC4)"
                color="white" borderRadius="8px" fontFamily="mono" fontWeight="700"
                _hover={{ opacity: 0.9 }}>
                Creează →
              </Button>
              <Button onClick={() => { setMode(null); setNewName(""); }}
                variant="ghost" color="gray.500" borderRadius="8px" flexShrink={0}>
                ✕
              </Button>
            </HStack>
          </Box>
        )}

        {/* Formular join cu cod */}
        {mode === "join" && (
          <Box mb={8} p={5}
            bg="rgba(78,205,196,0.05)"
            border="1px solid rgba(78,205,196,0.15)"
            borderRadius="12px">
            <Text fontSize="12px" fontWeight="700" color="gray.400" mb={1}
              fontFamily="mono" textTransform="uppercase" letterSpacing="1px">
              Intră în proiect cu cod
            </Text>
            <Text fontSize="11px" color="gray.600" mb={3}>
              Codul îl primești de la creatorul proiectului — apasă pe codul din cardul lui
            </Text>
            <HStack spacing={3}>
              <Input
                placeholder="ex: A3B7K2"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                autoFocus
                letterSpacing="4px" fontSize="18px"
                bg="rgba(255,255,255,0.05)"
                border="1px solid rgba(78,205,196,0.2)"
                borderRadius="8px" color="white" fontFamily="mono"
                maxLength={8}
                _placeholder={{ color: "gray.600", letterSpacing: "2px", fontSize: "13px" }}
                _focus={{ border: "1px solid rgba(78,205,196,0.5)", boxShadow: "none" }}
                onKeyDown={e => {
                  if (e.key === "Enter") joinByCode();
                  if (e.key === "Escape") { setMode(null); setJoinCode(""); }
                }}
              />
              <Button onClick={joinByCode} flexShrink={0}
                bg="rgba(78,205,196,0.15)"
                border="1px solid rgba(78,205,196,0.3)"
                color="#4ECDC4" borderRadius="8px" fontFamily="mono" fontWeight="700"
                _hover={{ bg: "rgba(78,205,196,0.25)" }}>
                Intră →
              </Button>
              <Button onClick={() => { setMode(null); setJoinCode(""); }}
                variant="ghost" color="gray.500" borderRadius="8px" flexShrink={0}>
                ✕
              </Button>
            </HStack>
          </Box>
        )}

        {/* Empty state */}
        {filtered.length === 0 && !mode && (
          <Box textAlign="center" py={16}
            border="1px dashed rgba(255,255,255,0.07)" borderRadius="12px">
            <Text fontSize="36px" mb={3}>📂</Text>
            <Text fontSize="13px" color="gray.500" mb={1}>
              {search ? "Niciun proiect găsit" : "Nu ai niciun proiect încă"}
            </Text>
            <Text fontSize="11px" color="gray.600">
              {search
                ? "Încearcă alt termen"
                : "Apasă \"Proiect nou\" sau intră cu codul unui proiect existent"}
            </Text>
          </Box>
        )}

        {/* ── Proiectele mele ─────────────────────────────── */}
        {myProjects.length > 0 && (
          <Box mb={8}>
            <HStack mb={3} spacing={2}>
              <Text fontSize="10px" fontWeight="700" color="gray.600"
                letterSpacing="1.2px" textTransform="uppercase">
                Proiectele mele
              </Text>
              <Box px={2} py={0.5}
                bg="rgba(110,72,255,0.1)"
                border="1px solid rgba(110,72,255,0.15)"
                borderRadius="20px">
                <Text fontSize="9px" color="rgba(167,139,250,0.8)" fontFamily="mono">
                  {myProjects.length}
                </Text>
              </Box>
            </HStack>
            <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={3}>
              {myProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  username={username}
                  onOpen={() => openProject(project)}
                  onDelete={e => deleteProject(e, project.id)}
                  onRename={e => renameProject(e, project)}
                  formatDate={formatDate}
                  toast={toast}
                />
              ))}
            </Grid>
          </Box>
        )}

        {/* ── Proiecte comune ──────────────────────────────── */}
        {sharedProjects.length > 0 && (
          <Box>
            <HStack mb={3} spacing={2}>
              <Text fontSize="10px" fontWeight="700" color="gray.600"
                letterSpacing="1.2px" textTransform="uppercase">
                Proiecte comune
              </Text>
              <Box px={2} py={0.5}
                bg="rgba(78,205,196,0.08)"
                border="1px solid rgba(78,205,196,0.15)"
                borderRadius="20px">
                <Text fontSize="9px" color="rgba(78,205,196,0.8)" fontFamily="mono">
                  {sharedProjects.length}
                </Text>
              </Box>
            </HStack>
            <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={3}>
              {sharedProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  username={username}
                  onOpen={() => openProject(project)}
                  onDelete={e => deleteProject(e, project.id)}
                  onRename={e => renameProject(e, project)}
                  formatDate={formatDate}
                  toast={toast}
                  isShared
                />
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ── Card proiect ──────────────────────────────────────────────
function ProjectCard({ project, username, onOpen, onDelete, onRename, formatDate, toast, isShared }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      p={4}
      bg="rgba(255,255,255,0.03)"
      border={`1px solid ${isShared ? "rgba(78,205,196,0.1)" : "rgba(255,255,255,0.06)"}`}
      borderRadius="12px"
      cursor="pointer"
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      _hover={{
        bg: "rgba(255,255,255,0.055)",
        border: `1px solid ${isShared ? "rgba(78,205,196,0.25)" : "rgba(110,72,255,0.22)"}`,
        transform: "translateY(-2px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      }}
      transition="all 0.2s"
      position="relative"
    >
      {/* Azioni hover */}
      {hovered && (
        <HStack position="absolute" top={3} right={3} spacing={1} onClick={e => e.stopPropagation()}>
          <Box w="20px" h="20px" borderRadius="5px"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="11px" color="gray.500"
            _hover={{ bg: "rgba(255,255,255,0.1)", color: "white" }}
            onClick={onRename} title="Redenumește">✎</Box>
          <Box w="20px" h="20px" borderRadius="5px"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="12px" color="gray.500"
            _hover={{ bg: "rgba(255,95,126,0.15)", color: "#ff5f7e" }}
            onClick={onDelete} title="Elimină din lista ta">×</Box>
        </HStack>
      )}

      <HStack spacing={3} mb={3}>
        <Box w="36px" h="36px" borderRadius="9px"
          bg={isShared ? "rgba(78,205,196,0.1)" : "rgba(110,72,255,0.1)"}
          border={`1px solid ${isShared ? "rgba(78,205,196,0.12)" : "rgba(110,72,255,0.12)"}`}
          display="flex" alignItems="center" justifyContent="center"
          fontSize="17px" flexShrink={0}>
          {project.icon}
        </Box>
        <VStack spacing={0} align="start" flex={1} minW={0}>
          <Text fontSize="13px" fontWeight="700" color="white"
            overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" w="100%">
            {project.name}
          </Text>
          <Text fontSize="10px" color={isShared ? "rgba(78,205,196,0.6)" : "gray.600"}>
            {isShared ? "🔗 proiect comun" : "👤 al tău"}
          </Text>
        </VStack>
      </HStack>

      <HStack justify="space-between">
        {/* Cod proiect — click to copy */}
        <Box
          as="button"
          px={2} py={0.5}
          bg={isShared ? "rgba(78,205,196,0.07)" : "rgba(110,72,255,0.07)"}
          border={`1px solid ${isShared ? "rgba(78,205,196,0.12)" : "rgba(110,72,255,0.12)"}`}
          borderRadius="5px"
          onClick={e => {
            e.stopPropagation();
            navigator.clipboard.writeText(project.id);
            toast({ title: `🔗 Cod copiat: ${project.id}`, status: "success", duration: 1500 });
          }}
          _hover={{ opacity: 0.8 }}
          title="Copiază codul pentru colegi"
        >
          <Text fontSize="10px"
            color={isShared ? "#4ECDC4" : "rgba(167,139,250,0.8)"}
            fontFamily="mono" letterSpacing="1px">
            {project.id} ⎘
          </Text>
        </Box>
        <Text fontSize="10px" color="gray.600">
          {formatDate(project.lastOpenedAt)}
        </Text>
      </HStack>
    </Box>
  );
}

export default Dashboard;