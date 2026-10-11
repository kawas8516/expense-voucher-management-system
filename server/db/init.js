// runs schema.sql on the database given in DATABASE_URL
import fs from "fs";
import pool from "../src/config/db.js";

const sql = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

try {
  await pool.query(sql);
  console.log("Tables created");
} catch (err) {
  console.log("Failed:", err.message);
} finally {
  await pool.end();
}
