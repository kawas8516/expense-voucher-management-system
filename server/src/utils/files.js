import pool from "../config/db.js";

// save uploaded image (from multer memoryStorage) and return its url
export async function saveFile(file) {
  const result = await pool.query(
    "INSERT INTO files (mime, data) VALUES ($1, $2) RETURNING id",
    [file.mimetype, file.buffer]
  );
  return "/api/files/" + result.rows[0].id;
}
