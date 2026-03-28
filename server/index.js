// server/index.js
const http = require("http");
const WebSocket = require("ws");

const PORT = 1234;
const rooms = new Map();

// ── Parsează body JSON din request ───────────────────────────
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS — permite requesturi de la React (localhost:5173)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Health check ─────────────────────────────────────────
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", users: wss.clients.size }));
    return;
  }

  // ── AI Chat endpoint ─────────────────────────────────────
  if (req.url === "/api/ai-chat" && req.method === "POST") {
    try {
      const { messages, editorCode } = await parseBody(req);

      // Verificăm că avem API key
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ text: "❌ Lipsește ANTHROPIC_API_KEY din .env" }));
        return;
      }

      // Construim system prompt cu codul din editor ca context
      const systemPrompt = `Ești un asistent AI pentru programatori, integrat într-un editor de cod colaborativ (iTec 2026).

Răspunzi în română sau engleză în funcție de cum scrie utilizatorul.
Ești expert în JavaScript, TypeScript, Python, React, Node.js și alte limbaje.
Când dai cod, folosești întotdeauna blocuri \`\`\`limbaj ... \`\`\`.
Ești concis și direct.

${editorCode ? `Codul curent din editor:\n\`\`\`\n${editorCode.slice(0, 3000)}\n\`\`\`` : "Editorul este gol."}`;

      // Request către Anthropic API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages.slice(-10), // ultimele 10 mesaje ca context
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "Nu am putut genera un răspuns.";

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ text }));
    } catch (err) {
      console.error("AI API error:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ text: `❌ Eroare: ${err.message}` }));
    }
    return;
  }

  res.writeHead(404);
  res.end();
});

// ── WebSocket pentru colaborare ───────────────────────────────
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  const room = req.url?.slice(1) || "default";
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(ws);

  console.log(`✅ User conectat în camera: ${room} | Total: ${wss.clients.size}`);

  ws.on("message", (msg) => {
    rooms.get(room)?.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on("close", () => {
    rooms.get(room)?.delete(ws);
    console.log(`❌ User deconectat | Total: ${wss.clients.size}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server pornit pe ws://localhost:${PORT}`);
  console.log(`🤖 AI Chat disponibil pe http://localhost:${PORT}/api/ai-chat`);
  console.log(`🔑 API Key: ${process.env.ANTHROPIC_API_KEY ? "✓ setat" : "✗ lipsește (pune în .env)"}`);
});