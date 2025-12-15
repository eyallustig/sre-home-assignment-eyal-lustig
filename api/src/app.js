import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./logging/logger.js";
import { pool } from "./db/client.js";
import authRoutes from "./routes/auth.js";
import itemRoutes from "./routes/items.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await pool.execute("SELECT 1");
    res.json({ status: "ok", db: "ok" });
  } catch (err) {
    console.error("healthcheck db error:", err);
    res.status(500).json({ status: "error", db: "unreachable" });
  }
});

app.use("/api", authRoutes);
app.use("/api", itemRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
