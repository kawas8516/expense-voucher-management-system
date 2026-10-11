import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/files/:id  -> signature image
// no token here because <img src> can't send one, the random uuid is hard to guess
router.get("/:id", async (req, res) => {
  if (!UUID.test(req.params.id)) {
    return res.status(400).json({ message: "Invalid file id" });
  }
  const result = await pool.query("SELECT mime, data FROM files WHERE id = $1", [req.params.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "File not found" });
  }
  res.set("Content-Type", result.rows[0].mime);
  res.set("Cache-Control", "public, max-age=31536000, immutable"); // file never changes
  res.send(result.rows[0].data);
});

export default router;
