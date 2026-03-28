import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { config } from "dotenv";
import mongoose from "mongoose";
import { exec } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";

config();

const app = express();
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());

// ── Conectare MongoDB ─────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB conectat"))
  .catch(err => console.error("❌ MongoDB eroare:", err.message));

// ── Rute API ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);

// ── Rulare cod local ──────────────────────────────────────────
app.post("/api/execute", async (req, res) => {
  const { language, code } = req.body;
  if (!code?.trim()) {
    return res.json({ run: { output: "⚠️ Niciun cod de rulat.", stderr: "" } });
  }

  const tmp = tmpdir();
  const id  = Date.now();
  let filePath = null;
  let cmd      = null;

  if (language === "javascript") {
    filePath = join(tmp, `code_${id}.js`);
    cmd = `node "${filePath}"`;
  } else if (language === "python") {
    filePath = join(tmp, `code_${id}.py`);
    cmd = `python "${filePath}"`;
  } else if (language === "typescript") {
    filePath = join(tmp, `code_${id}.ts`);
    cmd = `npx ts-node "${filePath}"`;
  } else if (language === "java") {
    filePath = join(tmp, `Main_${id}.java`);
    cmd = `cd "${tmp}" && javac "Main_${id}.java" && java -cp "${tmp}" Main_${id}`;
  } else if (language === "cpp") {
    filePath = join(tmp, `code_${id}.cpp`);
    const out = join(tmp, `code_${id}.out`);
    cmd = `g++ "${filePath}" -o "${out}" && "${out}"`;
  } else if (language === "c") {
    filePath = join(tmp, `code_${id}.c`);
    const out = join(tmp, `code_${id}.out`);
    cmd = `gcc "${filePath}" -o "${out}" && "${out}"`;
  } else if (language === "bash" || language === "shell") {
    filePath = join(tmp, `code_${id}.sh`);
    cmd = `bash "${filePath}"`;
  } else {
    return res.json({
      run: {
        output: `⚠️ Limbajul "${language}" nu poate fi rulat direct (HTML, CSS, Markdown etc.).`,
        stderr: "",
      },
    });
  }

  try {
    writeFileSync(filePath, code, "utf8");
  } catch (err) {
    return res.json({ run: { output: `❌ Nu am putut scrie fișierul: ${err.message}`, stderr: err.message } });
  }

  exec(cmd, { timeout: 15000, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
    // Curăță fișierele temporare
    try { if (filePath && existsSync(filePath)) unlinkSync(filePath); } catch (_) {}

    if (err && !stdout && !stderr) {
      return res.json({ run: { output: `❌ Eroare: ${err.message}`, stderr: err.message } });
    }

    res.json({
      run: {
        output: stdout || stderr || "",
        stderr: stderr || "",
      },
    });
  });
});

// ── Ruta AI Copilot cu Groq ───────────────────────────────────
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
${editorCode ? `\nCodul curent din editor:\n\`\`\`\n${editorCode.slice(0, 2000)}\n\`\`\`` : ""}`;

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
      language: "javascript",
      users: new Map(),
      messages: [],
      files: {},
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
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;
    socket.data.currentFile = null;

    const room = getRoom(roomId);
    const color = USER_COLORS[colorIndex % USER_COLORS.length];
    colorIndex++;

    room.users.set(socket.id, {
      id: socket.id, username, color, cursor: null, currentFile: null,
    });

    socket.emit("room_state", {
      language: room.language,
      messages: room.messages,
      users: Array.from(room.users.values()),
      files: room.files,
    });

    socket.to(roomId).emit("user_joined", {
      user: room.users.get(socket.id),
      users: Array.from(room.users.values()),
    });

    console.log(`[>] ${username} joined room ${roomId}`);
  });

  socket.on("open_file", ({ roomId, fileName }) => {
    const room = getRoom(roomId);
    const user = room.users.get(socket.id);
    if (user) { user.currentFile = fileName; socket.data.currentFile = fileName; }
    socket.to(roomId).emit("user_file_changed", {
      userId: socket.id, username: user?.username, color: user?.color,
      fileName, users: Array.from(room.users.values()),
    });
    const fileData = room.files[fileName];
    if (fileData) socket.emit("file_content", { fileName, code: fileData.code, language: fileData.language });
  });

  socket.on("create_file", ({ roomId, fileName, lang, content }) => {
    const room = getRoom(roomId);
    if (!room.files[fileName]) room.files[fileName] = { code: content, language: lang };
    socket.to(roomId).emit("file_created", { fileName, lang, content });
  });

  socket.on("delete_file", ({ roomId, fileName }) => {
    const room = getRoom(roomId);
    if (room.files[fileName]) delete room.files[fileName];
    socket.to(roomId).emit("file_deleted", { fileName });
  });

  socket.on("code_change", ({ roomId, fileName, code }) => {
    const room = getRoom(roomId);
    if (!room.files[fileName]) room.files[fileName] = {};
    room.files[fileName].code = code;
    room.users.forEach((user, userId) => {
      if (userId !== socket.id && user.currentFile === fileName)
        io.to(userId).emit("code_update", { fileName, code });
    });
  });

  socket.on("language_change", ({ roomId, fileName, language }) => {
    const room = getRoom(roomId);
    if (!room.files[fileName]) room.files[fileName] = {};
    room.files[fileName].language = language;
    room.users.forEach((user, userId) => {
      if (userId !== socket.id && user.currentFile === fileName)
        io.to(userId).emit("language_update", { fileName, language });
    });
  });

  socket.on("send_message", ({ roomId, message }) => {
    const room = getRoom(roomId);
    const user = room.users.get(socket.id);
    const msgObj = {
      id: Date.now(), text: message,
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
      userId: socket.id, username: user?.username,
      color: user?.color, position, fileName: user?.currentFile,
    });
  });

  socket.on("typing", ({ roomId, isTyping }) => {
    const room = getRoom(roomId);
    const user = room.users.get(socket.id);
    socket.to(roomId).emit("user_typing", {
      userId: socket.id, username: user?.username, isTyping,
    });
  });

  socket.on("disconnect", () => {
    const { roomId, username } = socket.data;
    if (!roomId) return;
    const room = rooms[roomId];
    if (room) {
      room.users.delete(socket.id);
      io.to(roomId).emit("user_left", {
        userId: socket.id, username,
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
  console.log(`⚙️  Execute: http://localhost:${PORT}/api/execute`);
  console.log(`🔑 Groq Key: ${process.env.GROQ_API_KEY ? "✓" : "✗"}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI ? "✓" : "✗"}`);
});