import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export function useSocket(roomId, username) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [remoteCode, setRemoteCode] = useState(null);
  const [remoteLanguage, setRemoteLanguage] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({});

  useEffect(() => {
    if (!roomId || !username) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_room", { roomId, username });
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("room_state", ({ code, language, messages, users }) => {
      setRemoteCode(code);
      setRemoteLanguage(language);
      setMessages(messages);
      setUsers(users);
    });

    socket.on("user_joined", ({ users }) => setUsers(users));
    socket.on("user_left", ({ users }) => {
      setUsers(users);
    });

    socket.on("code_update", ({ code }) => setRemoteCode(code));
    socket.on("language_update", ({ language }) => setRemoteLanguage(language));

    socket.on("new_message", (msg) =>
      setMessages((prev) => [...prev, msg])
    );

    socket.on("user_typing", ({ userId, username, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) return { ...prev, [userId]: username };
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on("cursor_update", ({ userId, username, color, position }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { username, color, position },
      }));
    });

    socket.on("user_left", ({ userId }) => {
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => socket.disconnect();
  }, [roomId, username]);

  const emitCodeChange = useCallback((code) => {
    socketRef.current?.emit("code_change", { roomId, code });
  }, [roomId]);

  const emitLanguageChange = useCallback((language) => {
    socketRef.current?.emit("language_change", { roomId, language });
  }, [roomId]);

  const emitCursorMove = useCallback((position) => {
    socketRef.current?.emit("cursor_move", { roomId, position });
  }, [roomId]);

  const emitTyping = useCallback((isTyping) => {
    socketRef.current?.emit("typing", { roomId, isTyping });
  }, [roomId]);

  const sendMessage = useCallback((message) => {
    socketRef.current?.emit("send_message", { roomId, message });
  }, [roomId]);

  return {
    isConnected,
    users,
    messages,
    typingUsers,
    remoteCode,
    remoteLanguage,
    remoteCursors,
    emitCodeChange,
    emitLanguageChange,
    emitCursorMove,
    emitTyping,
    sendMessage,
    socketId: socketRef.current?.id,
  };
}
