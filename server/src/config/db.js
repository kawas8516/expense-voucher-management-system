import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

// return DATE columns as "YYYY-MM-DD" text, otherwise timezone shifts the day
pg.types.setTypeParser(1082, (value) => value);

// hosted databases (Supabase) need SSL, local postgres doesn't
const isLocal = /@(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL || "");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.log("postgres pool error:", err.message);
});

export default pool;
