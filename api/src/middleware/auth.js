import crypto from "crypto";
import { pool } from "../db/client.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token, "utf8").digest("hex");

export async function authMiddleware(req, res, next) {
  try {
    const header = req.get("Authorization") || req.get("X-Auth-Token");
    if (!header) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token =
      header.startsWith("Bearer ") || header.startsWith("bearer ")
        ? header.slice(7)
        : header;

    const tokenHash = hashToken(token);

    const [rows] = await pool.execute(
      `SELECT t.id as token_id, t.revoked, t.expires_at, u.id as user_id, u.email
       FROM tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ?
       LIMIT 1`,
      [tokenHash]
    );

    const record = rows[0];
    if (!record) {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (record.revoked) {
      return res.status(401).json({ error: "Token revoked" });
    }
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      return res.status(401).json({ error: "Token expired" });
    }

    req.user = { id: record.user_id, email: record.email };
    req.tokenId = record.token_id;
    next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    res.status(500).json({ error: "Auth failed" });
  }
}
