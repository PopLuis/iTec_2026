// server/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// ── Register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Username și parola sunt obligatorii" });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: "Parola trebuie să aibă minim 4 caractere" });
    }

    const exists = await User.findOne({ username: username.trim() });
    if (exists) {
      return res.status(400).json({ error: "Username-ul există deja" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      username: username.trim(),
      passwordHash,
    });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

// ── Login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username?.trim() });
    if (!user) {
      return res.status(400).json({ error: "Username sau parolă greșite" });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(400).json({ error: "Username sau parolă greșite" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Eroare server" });
  }
});

// ── Get current user ──────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User negăsit" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

// ── Delete account ────────────────────────────────────────────
router.delete("/me", authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Cont șters cu succes" });
  } catch (err) {
    res.status(500).json({ error: "Eroare server" });
  }
});

export default router;