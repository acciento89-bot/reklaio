import { Pool, type QueryResultRow } from "pg";

declare global {
  var reklaioPool: Pool | undefined;
}

function createPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required at runtime");
  }

  return new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
  });
}

export function getDb() {
  if (global.reklaioPool) {
    return global.reklaioPool;
  }

  const pool = createPool();

  if (process.env.NODE_ENV !== "production") {
    global.reklaioPool = pool;
  }

  return pool;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getDb().query<T>(text, values);
}
