// runs schema.sql on the database given in DATABASE_URL
// schema.sql DROPS all tables, so it refuses to run on a non-local database
// unless you pass --force (eg. first setup of a new hosted database)
import fs from "fs";
import pool from "../src/config/db.js";

const isLocal = /@(localhost|127\.0\.0\.1)/.test(process.env.DATABASE_URL || "");
if (!isLocal && !process.argv.includes("--force")) {
  console.log("DATABASE_URL is not a local database. This would delete all its data.");
  console.log("Stopped. Run `node db/init.js --force` if you really want to reset it.");
  await pool.end();
  process.exit(1);
}

const sql = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

try {
  await pool.query(sql);
  console.log("Tables created");
} catch (err) {
  console.log("Failed:", err.message);
} finally {
  await pool.end();
}
