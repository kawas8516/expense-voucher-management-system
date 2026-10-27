// runs schema.sql on the database given in DATABASE_URL
// schema.sql DROPS all tables, so it refuses to run on a non-local database
// unless you pass --force (eg. first setup of a new hosted database)
// it also empties the MongoDB audit log (old events would point to the new vouchers),
// again only for a local MongoDB unless --force is passed
import fs from "fs";
import mongoose from "mongoose";
import pool from "../src/config/db.js";

const force = process.argv.includes("--force");
const isLocal = (url) => /(@|\/\/)(localhost|127\.0\.0\.1)[:/]/.test(url || "");

if (!isLocal(process.env.DATABASE_URL) && !force) {
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

if (process.env.MONGO_URL) {
  if (!isLocal(process.env.MONGO_URL) && !force) {
    console.log("MONGO_URL is not local, audit log NOT cleared (use --force to clear it)");
  } else {
    try {
      await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
      await mongoose.connection.db.collection("audit_logs").deleteMany({});
      console.log("Audit log cleared");
    } catch (err) {
      console.log("Could not clear audit log:", err.message);
    } finally {
      await mongoose.disconnect();
    }
  }
}
