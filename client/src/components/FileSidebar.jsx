// client/src/components/FileSidebar.jsx
import { useState, useRef } from "react";
import { Box, VStack, HStack, Text, Input } from "@chakra-ui/react";

const FILE_ICONS = {
  js: "JS", jsx: "JSX", ts: "TS", tsx: "TSX",
  py: "PY", html: "HTML", css: "CSS", json: "JSON",
  md: "MD", yaml: "YML", yml: "YML", sh: "SH",
  rs: "RS", go: "GO", java: "JV", cpp: "C++",
  sql: "SQL", txt: "TXT",
};

const FILE_COLORS = {
  js: "#e8d44d", jsx: "#61dafb", ts: "#3178c6", tsx: "#61dafb",
  py: "#3572A5", html: "#e44b23", css: "#563d7c", json: "#cbcb41",
  md: "#cccccc", rs: "#dea584", go: "#00add8", java: "#b07219",
  cpp: "#f34b7d", sql: "#e38c00", sh: "#89e051",
};

function getExt(name) {
  if (name.toLowerCase() === "dockerfile") return "dockerfile";
  return name.split(".").pop().toLowerCase();
}

function getColor(name) {
  return FILE_COLORS[getExt(name)] || "#cccccc";
}

function getLabel(name) {
  return FILE_ICONS[getExt(name)] || getExt(name).toUpperCase().slice(0, 3);
}

const FileSidebar = ({
  files, activeFile, onSelectFile, onCreateFile, onDeleteFile,
  projectName, roomId, users, currentSocketId,
}) => {
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [hoveredFile, setHoveredFile] = useState(null);
  const inputRef = useRef(null);

  function handleCreate() {
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim());
    setNewFileName(""); setShowNewFile(false);
  }

  return (
    <Box
      w="200px" minW="200px"
      bg="#252526"
      borderRight="1px solid #1e1e1e"
      display="flex" flexDirection="column"
      h="calc(100vh - 100px)"
      overflow="hidden"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      {/* Header */}
      <HStack
        px={3} py={2}
        justify="space-between"
        borderBottom="1px solid #1e1e1e"
      >
        <Text fontSize="11px" fontWeight="700" color="#bbb"
          letterSpacing="0.8px" textTransform="uppercase">
          Explorer
        </Text>
        <Box
          as="button" w="16px" h="16px"
          display="flex" alignItems="center" justifyContent="center"
          fontSize="16px" color="#9d9d9d" cursor="pointer" bg="transparent" border="none"
          onClick={() => { setShowNewFile(v => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
          _hover={{ color: "#cccccc" }}
          title="Fișier nou"
        >+</Box>
      </HStack>

      {/* Project name */}
      <Box px={3} py={1.5} borderBottom="1px solid #1e1e1e">
        <Text fontSize="11px" color="#9d9d9d" fontWeight="600"
          overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
          {projectName || roomId}
        </Text>
      </Box>

      {/* New file input */}
      {showNewFile && (
        <Box px={2} py={1.5} borderBottom="1px solid #1e1e1e">
          <HStack spacing={1}>
            <Input
              ref={inputRef}
              placeholder="filename.js"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              size="xs"
              bg="#3c3c3c"
              border="1px solid #0e639c"
              borderRadius="2px"
              color="#cccccc"
              fontSize="12px"
              fontFamily="Consolas, monospace"
              _placeholder={{ color: "#6d6d6d" }}
              _focus={{ border: "1px solid #0e639c", boxShadow: "none" }}
              onKeyDown={e => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setShowNewFile(false); setNewFileName(""); }
              }}
            />
            <Box
              as="button" px={1.5} py={1}
              bg="#0e639c" borderRadius="2px"
              cursor="pointer" fontSize="10px" color="white" fontWeight="600"
              onClick={handleCreate}
              _hover={{ bg: "#1177bb" }}
              flexShrink={0}
            >OK</Box>
          </HStack>
        </Box>
      )}

      {/* Files */}
      <Box
        flex={1} overflowY="auto"
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { background: "#424242", borderRadius: "2px" },
        }}
      >
        {files.map(file => {
          const usersOnFile = users?.filter(u => u.id !== currentSocketId && u.currentFile === file.name) || [];
          const isActive = activeFile === file.name;

          return (
            <Box
              key={file.name}
              display="flex" alignItems="center"
              px={3} py={1}
              cursor="pointer"
              bg={isActive ? "#37373d" : "transparent"}
              borderLeft={isActive ? "1px solid #0e639c" : "1px solid transparent"}
              _hover={{ bg: isActive ? "#37373d" : "#2a2d2e" }}
              transition="background 0.05s"
              onClick={() => onSelectFile(file)}
              onMouseEnter={() => setHoveredFile(file.name)}
              onMouseLeave={() => setHoveredFile(null)}
            >
              {/* File type badge */}
              <Box
                w="20px" h="14px" borderRadius="2px"
                bg="transparent"
                display="flex" alignItems="center" justifyContent="center"
                mr={1.5} flexShrink={0}
              >
                <Text
                  fontSize="9px" fontWeight="700"
                  color={getColor(file.name)}
                  fontFamily="Consolas, monospace"
                  letterSpacing="-0.5px"
                >
                  {getLabel(file.name)}
                </Text>
              </Box>

              <Text
                fontSize="13px"
                color={isActive ? "#cccccc" : "#9d9d9d"}
                flex={1}
                overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap"
                _hover={{ color: "#cccccc" }}
              >
                {file.name}
              </Text>

              {/* Users on file */}
              {usersOnFile.length > 0 && (
                <HStack spacing={0.5} mr={1}>
                  {usersOnFile.slice(0, 2).map((u, i) => (
                    <Box key={i} w="5px" h="5px" borderRadius="full"
                      bg={u.color || "#4ec994"} title={u.username} />
                  ))}
                </HStack>
              )}

              {/* Delete on hover */}
              {hoveredFile === file.name && (
                <Box
                  as="button" w="14px" h="14px"
                  display="flex" alignItems="center" justifyContent="center"
                  fontSize="14px" color="#9d9d9d" bg="transparent" border="none"
                  cursor="pointer"
                  _hover={{ color: "#f44747" }}
                  onClick={e => { e.stopPropagation(); onDeleteFile(file.name); }}
                  title="Șterge"
                  flexShrink={0}
                >×</Box>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Users online */}
      <Box px={3} py={2} borderTop="1px solid #1e1e1e">
        <Text fontSize="10px" fontWeight="700" color="#6d6d6d"
          letterSpacing="0.8px" textTransform="uppercase" mb={1}>
          Online
        </Text>
        <VStack spacing={0.5} align="stretch">
          {users?.slice(0, 5).map((u, i) => (
            <HStack key={i} spacing={1.5}>
              <Box w="5px" h="5px" borderRadius="full"
                bg={u.color || "#4ec994"} flexShrink={0} />
              <Text fontSize="11px" color="#9d9d9d"
                overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {u.username}{u.id === currentSocketId ? " (tu)" : ""}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};

export default FileSidebar;