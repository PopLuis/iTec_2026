// server/routes/projects.js
import express from "express";
import Project from "../models/Project.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

const ICONS = ["⚡", "🚀", "🔥", "💎", "🌟", "🎯", "🛠️", "🎨", "🧩", "🦄"];

function randomIcon() {
  return ICONS[Math.floor(Math.random() * ICONS.length)];
}

// ── Lista proiectele userului ─────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { "members.user": req.user.id },
      ],
    }).sort({ lastOpenedAt: -1 });

    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// ── Creează proiect nou ───────────────────────────────────────
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, roomId } = req.body;

    if (!name?.trim() || !roomId?.trim()) {
      return res.status(400).json({ error: "Nume și roomId sunt obligatorii" });
    }

    const exists = await Project.findOne({ roomId });
    if (exists) {
      return res.status(400).json({ error: "Proiect cu acest ID există deja" });
    }

    const project = new Project({
      name: name.trim(),
      icon: randomIcon(),
      roomId: roomId.trim(),
      owner: req.user.id,
      files: [
        { name: "main.js", lang: "javascript", content: '// main.js\nconsole.log("Hello!")\n' },
        { name: "README.md", lang: "markdown", content: `# ${name.trim()}\n` },
      ],
    });

    await project.save();
    res.status(201).json({ project });
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

// ── Intră în proiect cu roomId (join) ────────────────────────
router.post("/join", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.body;

    const project = await Project.findOne({ roomId });
    if (!project) {
      return res.status(404).json({ error: "Proiect negăsit — verifică codul" });
    }

    // Verifică dacă e deja member
    const isMember = project.members.some(
      m => m.user.toString() === req.user.id
    );
    const isOwner = project.owner.toString() === req.user.id;

    if (!isMember && !isOwner) {
      project.members.push({ user: req.user.id });
      await project.save();
    }

    project.lastOpenedAt = new Date();
    await project.save();

    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// ── Actualizează lastOpenedAt ─────────────────────────────────
router.patch("/:roomId/open", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { roomId: req.params.roomId },
      { lastOpenedAt: new Date() },
      { new: true }
    );
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// ── Salvează fișierele proiectului ────────────────────────────
router.patch("/:roomId/files", authMiddleware, async (req, res) => {
  try {
    const { files } = req.body;
    const project = await Project.findOneAndUpdate(
      { roomId: req.params.roomId },
      { files, lastOpenedAt: new Date() },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: "Proiect negăsit" });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// ── Șterge proiect ────────────────────────────────────────────
router.delete("/:roomId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({ roomId: req.params.roomId });
    if (!project) return res.status(404).json({ error: "Proiect negăsit" });

    // Doar owner-ul poate șterge
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Doar creatorul poate șterge proiectul" });
    }

    await Project.findByIdAndDelete(project._id);
    res.json({ message: "Proiect șters" });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// ── Ieși din proiect (remove member) ─────────────────────────
router.delete("/:roomId/leave", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({ roomId: req.params.roomId });
    if (!project) return res.status(404).json({ error: "Proiect negăsit" });

    project.members = project.members.filter(
      m => m.user.toString() !== req.user.id
    );
    await project.save();
    res.json({ message: "Ai ieșit din proiect" });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

export default router;