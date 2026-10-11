import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

// return DATE columns as "YYYY-MM-DD" text, otherwise timezone shifts the day
pg.types.setTypeParser(1082, (value) => value);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.log("postgres pool error:", err.message);
});

export default pool;
