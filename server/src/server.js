import dotenv from "dotenv";
dotenv.config({ quiet: true });

import app from "./app.js";
import pool from "./config/db.js";
import { connectMongo } from "./config/mongo.js";

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.log("JWT_SECRET missing in .env, stopping server");
  process.exit(1);
}

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL");
  } catch (err) {
    console.log("Could not connect to PostgreSQL:", err.message);
  }
  await connectMongo();
});
