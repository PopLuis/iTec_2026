import { useState } from "react";
import { Box, Button, Text, HStack, useToast } from "@chakra-ui/react";
import { executeCode } from "../api";

const SIZES = [
  { label: "Mic",   w: "20%",  icon: "◫" },
  { label: "Mediu", w: "35%",  icon: "◨" },
  { label: "Mare",  w: "50%",  icon: "◩" },
];

const Output = ({ editorRef, language }) => {
  const toast = useToast();
  const [output, setOutput]       = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError]     = useState(false);
  const [sizeIdx, setSizeIdx]     = useState(2); // default mare
  const [collapsed, setCollapsed] = useState(false);

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    setCollapsed(false);
    try {
      setIsLoading(true);
      const { run: result } = await executeCode(language, sourceCode);
      setOutput(result.output.split("\n"));
      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      toast({
        title: "Eroare la rulare",
        description: error.message || "Unable to run code",
        status: "error",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      w={collapsed ? "36px" : SIZES[sizeIdx].w}
      minW={collapsed ? "36px" : "120px"}
      maxW={collapsed ? "36px" : "50%"}   // ← nu depășește jumătate din ecran
      flexShrink={0}
      transition="width 0.2s ease, min-width 0.2s ease"
      overflow="hidden"
    >
      {/* Header */}
      <HStack justify="space-between" mb={2} align="center" h="28px">
        {!collapsed && (
          <Text fontSize="sm" fontWeight="600" color="gray.300" flexShrink={0}>
            Output
          </Text>
        )}
        <HStack spacing={1} ml="auto">
          {!collapsed && SIZES.map((s, i) => (
            <Box key={i} as="button"
              w="20px" h="20px" borderRadius="4px"
              display="flex" alignItems="center" justifyContent="center"
              fontSize="12px"
              bg={sizeIdx === i ? "rgba(110,72,255,0.2)" : "rgba(255,255,255,0.04)"}
              border={`1px solid ${sizeIdx === i ? "rgba(110,72,255,0.4)" : "rgba(255,255,255,0.08)"}`}
              color={sizeIdx === i ? "rgba(167,139,250,0.9)" : "gray.500"}
              cursor="pointer"
              onClick={() => setSizeIdx(i)}
              _hover={{ bg: "rgba(110,72,255,0.15)", color: "white" }}
              transition="all 0.15s"
              title={s.label}
            >
              {s.icon}
            </Box>
          ))}

          {/* Collapse/expand */}
          <Box as="button"
            w="20px" h="20px" borderRadius="4px"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="10px"
            bg="rgba(255,255,255,0.04)"
            border="1px solid rgba(255,255,255,0.08)"
            color="gray.500"
            cursor="pointer"
            onClick={() => setCollapsed(v => !v)}
            _hover={{ bg: "rgba(255,255,255,0.1)", color: "white" }}
            transition="all 0.15s"
            title={collapsed ? "Extinde" : "Ascunde"}
          >
            {collapsed ? "◁" : "▷"}
          </Box>
        </HStack>
      </HStack>

      {/* Conținut */}
      {!collapsed && (
        <>
          <Button
            variant="outline" colorScheme="green"
            mb={3} size="sm" w="100%"
            isLoading={isLoading}
            onClick={runCode}
            borderRadius="8px" fontFamily="mono" fontSize="12px"
          >
            ▶ Run Code
          </Button>

          <Box
            height="calc(75vh - 72px)"
            p={3}
            overflowY="auto"
            overflowX="hidden"
            color={isError ? "red.400" : "gray.200"}
            border="1px solid"
            borderRadius="8px"
            borderColor={isError ? "red.500" : "rgba(255,255,255,0.1)"}
            bg="rgba(0,0,0,0.3)"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="12px"
            lineHeight="1.7"
            css={{
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.1)", borderRadius: "2px" },
            }}
          >
            {output ? (
              output.map((line, i) => (
                <Text key={i} whiteSpace="pre-wrap" wordBreak="break-all">
                  {line || " "}
                </Text>
              ))
            ) : (
              <Text color="gray.600" fontSize="11px">
                Click "Run Code" to see the output here
              </Text>
            )}
          </Box>
        </>
      )}

      {/* Label vertical când e colapsat */}
      {collapsed && (
        <Box
          mt={4}
          cursor="pointer"
          onClick={() => setCollapsed(false)}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
        >
          <Text
            fontSize="9px" color="gray.600"
            fontFamily="mono" letterSpacing="1.5px"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
          >
            OUTPUT
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default Output;