import crypto from "node:crypto";
import { getDb } from "@/lib/db";

export function requestFingerprint(request: Request, scope: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
  const secret = process.env.SESSION_SECRET || "reklaio-rate-limit";
  return crypto.createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
}

export async function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowSeconds: number;
}) {
  const client = await getDb().connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`rate:${input.key}`]);

    const result = await client.query<{
      window_started_at: string;
      request_count: number;
    }>(
      `SELECT window_started_at, request_count
       FROM rate_limit_buckets
       WHERE bucket_key = $1
       LIMIT 1
       FOR UPDATE`,
      [input.key]
    );

    const now = Date.now();
    const row = result.rows[0];
    const windowStarted = row ? new Date(row.window_started_at).getTime() : 0;
    const expired = !row || now - windowStarted >= input.windowSeconds * 1000;
    const currentCount = expired ? 0 : row.request_count;

    if (currentCount >= input.limit) {
      await client.query("ROLLBACK");
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((input.windowSeconds * 1000 - (now - windowStarted)) / 1000))
      };
    }

    if (expired) {
      await client.query(
        `INSERT INTO rate_limit_buckets (bucket_key, window_started_at, request_count, updated_at)
         VALUES ($1, NOW(), 1, NOW())
         ON CONFLICT (bucket_key)
         DO UPDATE SET window_started_at = NOW(), request_count = 1, updated_at = NOW()`,
        [input.key]
      );
    } else {
      await client.query(
        `UPDATE rate_limit_buckets
         SET request_count = request_count + 1, updated_at = NOW()
         WHERE bucket_key = $1`,
        [input.key]
      );
    }

    await client.query("COMMIT");
    return {
      allowed: true,
      remaining: Math.max(0, input.limit - currentCount - 1),
      retryAfterSeconds: 0
    };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
