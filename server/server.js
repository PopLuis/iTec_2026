import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// State
const rooms = {}; // roomId -> { code, language, users: Map<socketId, user> }

function getRoom(roomId) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      code: "",
      language: "javascript",
      users: new Map(),
      messages: [],
    };
  }
  return rooms[roomId];
}

// Assign a color to each user
const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9",
];
let colorIndex = 0;

io.on("connection", (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // Join a room
  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;

    const room = getRoom(roomId);
    const color = USER_COLORS[colorIndex % USER_COLORS.length];
    colorIndex++;

    room.users.set(socket.id, { id: socket.id, username, color, cursor: null });

    // Send current room state to new user
    socket.emit("room_state", {
      code: room.code,
      language: room.language,
      messages: room.messages,
      users: Array.from(room.users.values()),
    });

    // Notify others
    socket.to(roomId).emit("user_joined", {
      user: room.users.get(socket.id),
      users: Array.from(room.users.values()),
    });

    console.log(`[>] ${username} joined room ${roomId}`);
  });

  // Code change - broadcast to others in room
  socket.on("code_change", ({ roomId, code }) => {
    const room = getRoom(roomId);
    room.code = code;
    socket.to(roomId).emit("code_update", { code, senderId: socket.id });
  });

  // Language change
  socket.on("language_change", ({ roomId, language }) => {
    const room = getRoom(roomId);
    room.language = language;
    socket.to(roomId).emit("language_update", { language });
  });

  // Chat message
  socket.on("send_message", ({ roomId, message }) => {
    const room = getRoom(roomId);
    const user = room.users.get(socket.id);
    const msgObj = {
      id: Date.now(),
      text: message,
      username: user?.username || "Anonymous",
      color: user?.color || "#fff",
      timestamp: new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }),
    };
    room.messages.push(msgObj);
    if (room.messages.length > 100) room.messages.shift(); // keep last 100

    io.to(roomId).emit("new_message", msgObj);
  });

  // Cursor position
  socket.on("cursor_move", ({ roomId, position }) => {
    const room = getRoom(roomId);
    const user = room.users.get(socket.id);
    if (user) user.cursor = position;
    socket.to(roomId).emit("cursor_update", {
      userId: socket.id,
      username: user?.username,
      color: user?.color,
      position,
    });
  });

  // Typing indicator
  socket.on("typing", ({ roomId, isTyping }) => {
    const room = getRoom(roomId);
    const user = room.users.get(socket.id);
    socket.to(roomId).emit("user_typing", {
      userId: socket.id,
      username: user?.username,
      isTyping,
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const { roomId, username } = socket.data;
    if (!roomId) return;
    const room = rooms[roomId];
    if (room) {
      room.users.delete(socket.id);
      io.to(roomId).emit("user_left", {
        userId: socket.id,
        username,
        users: Array.from(room.users.values()),
      });
      if (room.users.size === 0) {
        // Keep room alive for 10 min after last user leaves
        setTimeout(() => {
          if (rooms[roomId]?.users.size === 0) delete rooms[roomId];
        }, 10 * 60 * 1000);
      }
    }
    console.log(`[-] Disconnected: ${username} (${socket.id})`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
});
