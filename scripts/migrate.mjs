import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = await fs.readFile(path.join(process.cwd(), "db", "001_init.sql"), "utf8");
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log("Reklaio database migration completed.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
