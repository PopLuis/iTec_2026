// client/src/hooks/useAiChat.js
import { useState, useCallback } from "react";

export function useAiChat(getEditorCode) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      text: "Salut! Sunt AI-ul tău de cod. Pot să explic, să fixez bug-uri sau să generez cod. Întreabă-mă orice! 🚀",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (userText) => {
      if (!userText.trim() || loading) return;

      setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: userText }]);
      setLoading(true);

      try {
        const editorCode = getEditorCode?.() || "";

        const history = messages
          .filter((m) => m.id !== 1)
          .slice(-9)
          .map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.text,
          }));
        history.push({ role: "user", content: userText });

        const response = await fetch("http://localhost:3001/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, editorCode }),
        });

        if (!response.ok) throw new Error("Server error " + response.status);

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "assistant", text: data.text },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            text: "❌ Eroare. Asigură-te că rulezi:\n```bash\ncd server && node server.js\n```",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, getEditorCode]
  );

  const clearMessages = useCallback(() => {
    setMessages([{
      id: 1,
      role: "assistant",
      text: "Conversație resetată. Cu ce te pot ajuta? 🚀",
    }]);
  }, []);

  return { messages, loading, sendMessage, clearMessages };
}