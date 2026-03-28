import { useState } from "react";
import { Box, Text, HStack, useToast } from "@chakra-ui/react";
import { executeCode } from "../api";

const Output = ({ editorRef, language }) => {
  const toast = useToast();
  const [output, setOutput]       = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError]     = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth]         = useState("40%");

  const WIDTHS = ["20%", "30%", "40%"];
  const LABELS = ["S", "M", "L"];

  const runCode = async () => {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;
    setCollapsed(false);
    setIsLoading(true);
    try {
      const result = await executeCode(language, sourceCode);
      const run = result?.run;
      if (!run) { setOutput(["Eroare: răspuns invalid"]); setIsError(true); return; }
      const text = run.output || run.stderr || "";
      setOutput(text.split("\n"));
      setIsError(!!run.stderr && !run.output);
    } catch (error) {
      toast({ title: "Eroare la rulare", description: error.message, status: "error", duration: 4000 });
      setOutput([`Eroare: ${error.message}`]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      w={collapsed ? "28px" : width}
      minW={collapsed ? "28px" : "160px"}
      maxW={collapsed ? "28px" : "50%"}
      flexShrink={0}
      bg="#1e1e1e"
      borderLeft="1px solid #1e1e1e"
      transition="width 0.15s ease"
      overflow="hidden"
      fontFamily="system-ui, -apple-system, sans-serif"
      display="flex"
      flexDirection="column"
    >
      {/* Panel header */}
      <Box
        h="35px"
        bg="#252526"
        borderBottom="1px solid #1e1e1e"
        display="flex"
        alignItems="center"
        px={2}
        justifyContent="space-between"
        flexShrink={0}
      >
        {!collapsed && (
          <Text fontSize="11px" fontWeight="700" color="#bbb"
            letterSpacing="0.8px" textTransform="uppercase">
            Output
          </Text>
        )}
        <HStack spacing={1} ml={collapsed ? 0 : "auto"}>
          {!collapsed && WIDTHS.map((w, i) => (
            <Box key={i} as="button"
              w="18px" h="18px" borderRadius="2px"
              display="flex" alignItems="center" justifyContent="center"
              fontSize="10px" fontWeight="700"
              bg={width === w ? "#37373d" : "transparent"}
              color={width === w ? "#cccccc" : "#6d6d6d"}
              border="none" cursor="pointer"
              onClick={() => setWidth(w)}
              _hover={{ color: "#cccccc", bg: "#37373d" }}
            >
              {LABELS[i]}
            </Box>
          ))}
          <Box as="button"
            w="18px" h="18px" borderRadius="2px"
            display="flex" alignItems="center" justifyContent="center"
            fontSize="10px" color="#6d6d6d"
            bg="transparent" border="none" cursor="pointer"
            onClick={() => setCollapsed(v => !v)}
            _hover={{ color: "#cccccc", bg: "#37373d" }}
            title={collapsed ? "Deschide" : "Închide"}
          >
            {collapsed ? "«" : "»"}
          </Box>
        </HStack>
      </Box>

      {!collapsed && (
        <>
          {/* Run button */}
          <Box
            as="button"
            onClick={runCode}
            m={2}
            px={3} py={1.5}
            bg={isLoading ? "#37373d" : "#0e639c"}
            borderRadius="3px"
            cursor={isLoading ? "default" : "pointer"}
            _hover={{ bg: isLoading ? "#37373d" : "#1177bb" }}
            transition="background 0.1s"
            flexShrink={0}
          >
            <Text fontSize="12px" color="white" fontWeight="500">
              {isLoading ? "Running..." : "Run"}
            </Text>
          </Box>

          {/* Output content */}
          <Box
            flex={1}
            overflowY="auto"
            overflowX="hidden"
            px={3} py={2}
            color={isError ? "#f44747" : "#cccccc"}
            fontFamily="Consolas, 'Courier New', monospace"
            fontSize="12px"
            lineHeight="1.6"
            css={{
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": { background: "#424242", borderRadius: "2px" },
            }}
          >
            {output ? (
              output.map((line, i) => (
                <Text key={i} whiteSpace="pre-wrap" wordBreak="break-all">
                  {line || " "}
                </Text>
              ))
            ) : (
              <Text color="#6d6d6d" fontSize="12px">
                Run the code to see output here
              </Text>
            )}
          </Box>
        </>
      )}

      {collapsed && (
        <Box
          flex={1} display="flex" alignItems="center" justifyContent="center"
          cursor="pointer" onClick={() => setCollapsed(false)}
        >
          <Text
            fontSize="10px" color="#6d6d6d"
            style={{ writingMode: "vertical-rl" }}
            letterSpacing="1px" textTransform="uppercase"
          >
            Output
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default Output;