// client/src/hooks/useSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export function useSocket(roomId, username) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected]               = useState(false);
  const [users, setUsers]                           = useState([]);
  const [messages, setMessages]                     = useState([]);
  const [typingUsers, setTypingUsers]               = useState({});
  const [remoteCursors, setRemoteCursors]           = useState({});
  const [remoteCodeUpdate, setRemoteCodeUpdate]     = useState(null);
  const [remoteLanguageUpdate, setRemoteLanguageUpdate] = useState(null);
  const [fileContent, setFileContent]               = useState(null);
  const [serverFiles, setServerFiles]               = useState({});
  const [remoteFileCreated, setRemoteFileCreated]   = useState(null);
  const [remoteFileDeleted, setRemoteFileDeleted]   = useState(null);

  useEffect(() => {
    if (!roomId || !username) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_room", { roomId, username });
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("room_state", ({ language, messages, users, files }) => {
      setMessages(messages);
      setUsers(users);
      setServerFiles(files || {});
    });

    socket.on("user_joined", ({ users }) => setUsers(users));

    socket.on("user_left", ({ users, userId }) => {
      setUsers(users);
      setRemoteCursors(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on("user_file_changed", ({ users }) => setUsers(users));

    socket.on("file_content", ({ fileName, code, language }) => {
      setFileContent({ fileName, code, language });
    });

    socket.on("code_update", ({ fileName, code }) => {
      setRemoteCodeUpdate({ fileName, code, ts: Date.now() });
    });

    socket.on("language_update", ({ fileName, language }) => {
      setRemoteLanguageUpdate({ fileName, language, ts: Date.now() });
    });

    // ── Fișier nou creat de alt user ──────────────────────
    socket.on("file_created", ({ fileName, lang, content }) => {
      setRemoteFileCreated({ fileName, lang, content, ts: Date.now() });
    });

    // ── Fișier șters de alt user ──────────────────────────
    socket.on("file_deleted", ({ fileName }) => {
      setRemoteFileDeleted({ fileName, ts: Date.now() });
    });

    socket.on("new_message", (msg) =>
      setMessages(prev => [...prev, msg])
    );

    socket.on("user_typing", ({ userId, username, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping) return { ...prev, [userId]: username };
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on("cursor_update", ({ userId, username, color, position, fileName }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [userId]: { username, color, position, fileName },
      }));
    });

    return () => socket.disconnect();
  }, [roomId, username]);

  // ── Emitters ─────────────────────────────────────────────
  const emitOpenFile = useCallback((fileName) => {
    socketRef.current?.emit("open_file", { roomId, fileName });
  }, [roomId]);

  const emitCreateFile = useCallback((fileName, lang, content) => {
    socketRef.current?.emit("create_file", { roomId, fileName, lang, content });
  }, [roomId]);

  const emitDeleteFile = useCallback((fileName) => {
    socketRef.current?.emit("delete_file", { roomId, fileName });
  }, [roomId]);

  const emitCodeChange = useCallback((fileName, code) => {
    socketRef.current?.emit("code_change", { roomId, fileName, code });
  }, [roomId]);

  const emitLanguageChange = useCallback((fileName, language) => {
    socketRef.current?.emit("language_change", { roomId, fileName, language });
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
    remoteCursors,
    remoteCodeUpdate,
    remoteLanguageUpdate,
    fileContent,
    serverFiles,
    remoteFileCreated,
    remoteFileDeleted,
    emitOpenFile,
    emitCreateFile,
    emitDeleteFile,
    emitCodeChange,
    emitLanguageChange,
    emitCursorMove,
    emitTyping,
    sendMessage,
    socketId: socketRef.current?.id,
  };
}