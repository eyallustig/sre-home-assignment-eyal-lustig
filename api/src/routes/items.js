import express from "express";
import { pool } from "../db/client.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../logging/logger.js";

const router = express.Router();

router.get("/products", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, slug, name, target_audience, description, created_at FROM products ORDER BY id ASC"
    );
    res.json({ products: rows });
  } catch (err) {
    console.error("products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.post("/products", authMiddleware, async (req, res) => {
  try {
    const slug = (req.body?.slug || "").trim().toLowerCase();
    const name = (req.body?.name || "").trim();
    const target = (req.body?.target_audience || "").trim();
    const description =
      typeof req.body?.description === "string"
        ? req.body.description.trim()
        : null;

    if (!slug || !name || !target) {
      return res
        .status(400)
        .json({ error: "slug, name, target_audience are required" });
    }

    const [result] = await pool.execute(
      "INSERT INTO products (slug, name, target_audience, description) VALUES (?, ?, ?, ?)",
      [slug, name, target, description || null]
    );

    logger.info({
      action: "product_create",
      user_id: req.user?.id,
      product_id: result.insertId,
      slug,
    });

    return res.status(201).json({
      product: {
        id: result.insertId,
        slug,
        name,
        target_audience: target,
        description,
      },
    });
  } catch (err) {
    if (err && err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "slug already exists" });
    }
    console.error("create product error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.delete("/products/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid product id" });
    }

    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    logger.info({
      action: "product_delete",
      user_id: req.user?.id,
      product_id: id,
    });

    return res.json({ deleted: true, id });
  } catch (err) {
    console.error("delete product error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
