import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import { authLogger } from "../logging/logger.js";

const router = express.Router();

const hashToken = (token) =>
  crypto.createHash("sha256").update(token, "utf8").digest("hex");

router.post("/login", async (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [rows] = await pool.execute(
      "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      authLogger.warn({
        action: "login",
        user_id: null,
        email,
        ip: req.ip,
        status: "invalid_credentials",
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.execute(
      "INSERT INTO tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [user.id, tokenHash, expiresAt]
    );

    authLogger.info({
      action: "login",
      user_id: user.id,
      email: user.email,
      ip: req.ip,
      status: "success",
    });

    return res.json({
      token,
      expiresAt,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("login error:", err);
    authLogger.error({
      action: "login",
      user_id: null,
      email: req.body?.email,
      ip: req.ip,
      status: "error",
      message: err.message,
    });
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
