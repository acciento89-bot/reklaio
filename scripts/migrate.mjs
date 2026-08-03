import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const dbDirectory = path.join(process.cwd(), "db");
const migrationFiles = (await fs.readdir(dbDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query("BEGIN");

  for (const file of migrationFiles) {
    const sql = await fs.readFile(path.join(dbDirectory, file), "utf8");
    await client.query(sql);
    console.log(`Applied migration: ${file}`);
  }

  await client.query("COMMIT");
  console.log("Reklaio database migrations completed.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error("Migration failed:", error);
  process.exitCode = 1;
} finally {
  await client.end();
}
