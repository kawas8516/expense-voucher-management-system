import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import pool from "../config/db.js";
import { logAudit } from "../utils/audit.js";
import { saveFile } from "../utils/files.js";

// remove password before sending user to frontend
function cleanUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    employee_code: u.employee_code,
    department: u.department,
    signature_path: u.signature_path,
    created_at: u.created_at,
  };
}

// POST /api/auth/login
export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  const user = result.rows[0];

  // same message for both cases so nobody can guess emails
  const match = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!match) {
    // only the email is logged, never the password
    logAudit(req, "login_failed", { user: user || undefined, details: { email: email.toLowerCase() } });
    return res.status(401).json({ message: "Invalid email or password" });
  }
  logAudit(req, "login", { user });

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  res.json({ token, user: cleanUser(user) });
}

// GET /api/auth/me
export async function me(req, res) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ user: cleanUser(result.rows[0]) });
}

// PUT /api/auth/me/signature  (multipart "signature", png / jpg)
// becomes the saved signature used for the next voucher / approval
export async function updateSignature(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Please choose a signature image" });
  }
  const path = await saveFile(req.file);
  const result = await pool.query("UPDATE users SET signature_path = $1 WHERE id = $2 RETURNING *", [path, req.user.id]);
  logAudit(req, "signature_updated");
  res.json({ user: cleanUser(result.rows[0]) });
}
