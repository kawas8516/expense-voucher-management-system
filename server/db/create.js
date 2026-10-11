// creates the database given in DATABASE_URL if it does not exist
// (connects to the default "postgres" database to do it)
import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const url = new URL(process.env.DATABASE_URL);
const dbName = url.pathname.slice(1);
url.pathname = "/postgres";

const client = new pg.Client({ connectionString: url.toString() });

try {
  await client.connect();
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rows.length > 0) {
    console.log(`Database "${dbName}" already exists`);
  } else {
    // db name can't be a $1 parameter, so quote it manually
    await client.query(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
    console.log(`Database "${dbName}" created`);
  }
} catch (err) {
  console.log("Failed:", err.message);
} finally {
  await client.end();
}
