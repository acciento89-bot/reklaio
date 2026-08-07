import crypto from "node:crypto";
import { query } from "@/lib/db";

const MOBILE_SESSION_DAYS = 30;

export type MobileUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function createMobileSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + MOBILE_SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return { token, expiresAt };
}

export async function getMobileUser(request: Request): Promise<MobileUser | null> {
  const token = readBearerToken(request);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const result = await query<{
    id: string;
    email: string;
    display_name: string | null;
    role: "user" | "admin";
    suspended_at: string | null;
  }>(
    `SELECT u.id, u.email, u.display_name, u.role, u.suspended_at
     FROM auth_sessions s
     JOIN app_users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  const user = result.rows[0];
  if (!user || user.suspended_at) return null;

  await query(
    `UPDATE auth_sessions
     SET last_seen_at = NOW()
     WHERE token_hash = $1`,
    [tokenHash]
  );

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role === "admin" ? "admin" : "user"
  };
}

export async function deleteMobileSession(request: Request) {
  const token = readBearerToken(request);
  if (!token) return;
  await query("DELETE FROM auth_sessions WHERE token_hash = $1", [hashToken(token)]);
}
