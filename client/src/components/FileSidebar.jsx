// client/src/components/FileSidebar.jsx
import { useState, useRef } from "react";
import { Box, VStack, HStack, Text, Input } from "@chakra-ui/react";

const FILE_ICONS = {
  js: "🟨", jsx: "⚛", ts: "🔷", tsx: "⚛",
  py: "🐍", html: "🌐", css: "🎨", json: "📋",
  md: "📝", yaml: "📄", yml: "📄", sh: "💻",
  rs: "🦀", go: "🐹", java: "☕", cpp: "⚙️",
  sql: "🗄️", dockerfile: "🐳", txt: "📄",
};

function getIcon(name) {
  if (name.toLowerCase() === "dockerfile") return "🐳";
  const ext = name.split(".").pop().toLowerCase();
  return FILE_ICONS[ext] || "📄";
}

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

const FileSidebar = ({
  files,            // [{ name, lang }]
  activeFile,       // string — numele fișierului activ
  onSelectFile,     // (file) => void
  onCreateFile,     // (name) => void
  onDeleteFile,     // (name) => void
  projectName,      // string
  roomId,           // string
  users,            // useri conectați
  currentSocketId,  // socketId propriu
}) => {
  const [showNewFile, setShowNewFile]   = useState(false);
  const [newFileName, setNewFileName]   = useState("");
  const [search, setSearch]             = useState("");
  const [hoveredFile, setHoveredFile]   = useState(null);
  const inputRef = useRef(null);

  function handleCreate() {
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName("");
    setShowNewFile(false);
  }

  const filtered = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box
      w="220px"
      minW="220px"
      h="75vh"
      bg="rgba(255,255,255,0.02)"
      border="1px solid rgba(255,255,255,0.07)"
      borderRadius="10px"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      mr={3}
    >
      {/* Header */}
      <Box px={3} py={2.5}
        borderBottom="1px solid rgba(255,255,255,0.06)"
        bg="rgba(255,255,255,0.02)">
        <HStack justify="space-between" mb={1}>
          <Text fontSize="10px" fontWeight="700" color="gray.500"
            letterSpacing="1.2px" textTransform="uppercase">
            Explorer
          </Text>
          <HStack spacing={1}>
            <Box as="button" w="18px" h="18px" borderRadius="4px"
              display="flex" alignItems="center" justifyContent="center"
              fontSize="14px" color="gray.500" cursor="pointer"
              onClick={() => { setShowNewFile(v => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
              _hover={{ bg: "rgba(255,255,255,0.08)", color: "white" }}
              title="Fișier nou"
            >+</Box>
          </HStack>
        </HStack>

        {/* Proiect info */}
        <HStack spacing={1.5}>
          <Text fontSize="11px" color="gray.400" fontWeight="600"
            overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
            📁 {projectName || roomId}
          </Text>
        </HStack>
      </Box>

      {/* Search */}
      <Box px={2} py={1.5} borderBottom="1px solid rgba(255,255,255,0.04)">
        <Input
          placeholder="🔍 caută..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="xs"
          bg="rgba(255,255,255,0.04)"
          border="1px solid rgba(255,255,255,0.06)"
          borderRadius="5px"
          color="white"
          fontSize="11px"
          fontFamily="mono"
          _placeholder={{ color: "gray.600" }}
          _focus={{ border: "1px solid rgba(110,72,255,0.3)", boxShadow: "none" }}
        />
      </Box>

      {/* New file input */}
      {showNewFile && (
        <Box px={2} py={1.5} borderBottom="1px solid rgba(255,255,255,0.04)">
          <HStack spacing={1}>
            <Input
              ref={inputRef}
              placeholder="ex: utils.js"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              size="xs"
              bg="rgba(110,72,255,0.08)"
              border="1px solid rgba(110,72,255,0.3)"
              borderRadius="5px"
              color="white"
              fontSize="11px"
              fontFamily="mono"
              _placeholder={{ color: "gray.600" }}
              _focus={{ boxShadow: "none" }}
              onKeyDown={e => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setShowNewFile(false); setNewFileName(""); }
              }}
            />
            <Box as="button" px={2} py={1}
              bg="rgba(0,229,160,0.12)"
              border="1px solid rgba(0,229,160,0.25)"
              borderRadius="4px" cursor="pointer"
              fontSize="10px" color="#00e5a0" fontWeight="700"
              onClick={handleCreate}
              _hover={{ bg: "rgba(0,229,160,0.2)" }}
            >✓</Box>
          </HStack>
        </Box>
      )}

      {/* Files list */}
      <Box flex={1} overflowY="auto"
        css={{
          "&::-webkit-scrollbar": { width: "3px" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.08)", borderRadius: "2px" },
        }}>
        {filtered.length === 0 && (
          <Text fontSize="11px" color="gray.600" textAlign="center" mt={4} px={3}>
            {search ? "Niciun fișier găsit" : "Niciun fișier"}
          </Text>
        )}
        {filtered.map(file => {
          // Găsește userii care sunt pe acest fișier
          const usersOnFile = users?.filter(u =>
            u.id !== currentSocketId && u.currentFile === file.name
          ) || [];

          return (
            <Box
              key={file.name}
              display="flex" alignItems="center"
              px={3} py={1.5}
              cursor="pointer"
              borderLeft={activeFile === file.name
                ? "2px solid rgba(110,72,255,0.8)"
                : "2px solid transparent"}
              bg={activeFile === file.name
                ? "rgba(110,72,255,0.1)"
                : "transparent"}
              _hover={{ bg: activeFile === file.name ? "rgba(110,72,255,0.12)" : "rgba(255,255,255,0.04)" }}
              transition="all 0.1s"
              onClick={() => onSelectFile(file)}
              onMouseEnter={() => setHoveredFile(file.name)}
              onMouseLeave={() => setHoveredFile(null)}
              role="group"
            >
              <Text fontSize="12px" mr={1.5} flexShrink={0}>{getIcon(file.name)}</Text>
              <Text
                fontSize="11.5px"
                fontFamily="mono"
                color={activeFile === file.name ? "white" : "gray.400"}
                flex={1}
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
              >
                {file.name}
              </Text>

              {/* Useri pe fișier */}
              {usersOnFile.length > 0 && (
                <HStack spacing={0.5} mr={1}>
                  {usersOnFile.slice(0, 2).map((u, i) => (
                    <Box key={i}
                      w="6px" h="6px" borderRadius="full"
                      bg={u.color || "#4ECDC4"}
                      title={u.username}
                    />
                  ))}
                </HStack>
              )}

              {/* Delete button on hover */}
              <Box
                as="button"
                w="16px" h="16px"
                borderRadius="3px"
                display="flex" alignItems="center" justifyContent="center"
                fontSize="12px"
                color="gray.600"
                opacity={hoveredFile === file.name ? 1 : 0}
                _hover={{ bg: "rgba(255,95,126,0.15)", color: "#ff5f7e" }}
                transition="all 0.1s"
                onClick={e => { e.stopPropagation(); onDeleteFile(file.name); }}
                title="Șterge fișier"
                flexShrink={0}
              >×</Box>
            </Box>
          );
        })}
      </Box>

      {/* Footer — useri conectați */}
      <Box px={3} py={2}
        borderTop="1px solid rgba(255,255,255,0.06)"
        bg="rgba(255,255,255,0.01)">
        <Text fontSize="9px" fontWeight="700" color="gray.600"
          letterSpacing="1px" textTransform="uppercase" mb={1.5}>
          Online
        </Text>
        <VStack spacing={1} align="stretch">
          {users?.slice(0, 4).map((u, i) => (
            <HStack key={i} spacing={1.5}>
              <Box w="5px" h="5px" borderRadius="full"
                bg={u.color || "#4ECDC4"}
                boxShadow={`0 0 4px ${u.color || "#4ECDC4"}`}
                flexShrink={0}
              />
              <Text fontSize="10px" color="gray.400" fontFamily="mono"
                overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {u.username}
                {u.id === currentSocketId ? " (tu)" : ""}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

export default FileSidebar;