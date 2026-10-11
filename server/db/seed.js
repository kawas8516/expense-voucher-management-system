// creates demo users, password for all = password123
import bcrypt from "bcryptjs";
import pool from "../src/config/db.js";

const users = [
  { name: "Rahul Sharma", email: "employee@test.com", role: "employee", code: "EMP001", dept: "IT" },
  { name: "Priya Mehta", email: "employee2@test.com", role: "employee", code: "EMP002", dept: "Sales" },
  { name: "Anil Verma", email: "director@test.com", role: "director", code: "DIR001", dept: "Management" },
  { name: "Sneha Joshi", email: "accounts@test.com", role: "accounts", code: "ACC001", dept: "Accounts" },
];

try {
  const hash = await bcrypt.hash("password123", 10);
  for (const u of users) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, employee_code, department)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING`,
      [u.name, u.email, hash, u.role, u.code, u.dept]
    );
  }
  console.log("Seeded users (password: password123)");
} catch (err) {
  console.log("Seed failed:", err.message);
} finally {
  await pool.end();
}
