import { useState } from "react";
import { Box } from "@chakra-ui/react";
import CodeEditor from "./components/CodeEditor";
import JoinRoom from "./components/JoinRoom";

function App() {
  const [session, setSession] = useState(null);

  if (!session) {
    return <JoinRoom onJoin={setSession} />;
  }

  return (
    <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
      <CodeEditor username={session.username} roomId={session.roomId} />
    </Box>
  );
}

export default App;
