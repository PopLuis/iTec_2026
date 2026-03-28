import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { config } from "dotenv";

config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ── Ruta AI Copilot cu Groq (gratuit) ────────────────────────
app.post("/api/ai-chat", async (req, res) => {
  const { messages, editorCode } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.json({ text: "❌ Lipsește GROQ_API_KEY din server/.env" });
  }

  try {
    const systemPrompt = `Ești un asistent AI pentru programatori integrat într-un editor colaborativ iTec 2026.
Răspunzi în română sau engleză după cum scrie utilizatorul.
Ești expert în JavaScript, TypeScript, Python, React, Node.js și alte limbaje.
Când dai cod folosești întotdeauna blocuri \`\`\`limbaj ... \`\`\`.
Ești concis și direct.
${editorCode ? `\nCodul curent din editor:\n\`\`\`\n${editorCode.slice(0, 2000)}\n\`\`\`` : "\nEditorul este gol."}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
      }),
    });

    const data = await response.json();
    console.log("Groq status:", data?.error || "OK");
    const text = data.choices?.[0]?.message?.content || "Nu am putut genera un răspuns.";
    res.json({ text });
  } catch (err) {
    console.error("AI error:", err.message);
    res.json({ text: `❌ Eroare: ${err.message}` });
  }
});

// ── State rooms ───────────────────────────────────────────────
const rooms = {};

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

const USER_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9",
];
let colorIndex = 0;

// ── Socket.io ─────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;

    const room = getRoom(roomId);
    const color = USER_COLORS[colorIndex % USER_COLORS.length];
    colorIndex++;

    room.users.set(socket.id, { id: socket.id, username, color, cursor: null });

    socket.emit("room_state", {
      code: room.code,
      language: room.language,
      messages: room.messages,
      users: Array.from(room.users.values()),
    });

    socket.to(roomId).emit("user_joined", {
      user: room.users.get(socket.id),
      users: Array.from(room.users.values()),
    });

    console.log(`[>] ${username} joined room ${roomId}`);
  });

  socket.on("code_change", ({ roomId, code }) => {
    const room = getRoom(roomId);
    room.code = code;
    socket.to(roomId).emit("code_update", { code, senderId: socket.id });
  });

  socket.on("language_change", ({ roomId, language }) => {
    const room = getRoom(roomId);
    room.language = language;
    socket.to(roomId).emit("language_update", { language });
  });

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
    if (room.messages.length > 100) room.messages.shift();
    io.to(roomId).emit("new_message", msgObj);
  });

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

  socket.on("typing", ({ roomId, isTyping }) => {
    const room = getRoom(roomId);
    const user = room.users.get(socket.id);
    socket.to(roomId).emit("user_typing", {
      userId: socket.id,
      username: user?.username,
      isTyping,
    });
  });

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
  console.log(`🚀 Server pornit pe portul ${PORT}`);
  console.log(`🤖 AI Chat: http://localhost:${PORT}/api/ai-chat`);
  console.log(`🔑 API Key: ${process.env.GROQ_API_KEY ? "✓ setat" : "✗ lipsește — pune GROQ_API_KEY în server/.env"}`);
});