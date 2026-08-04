import { createHash, randomBytes } from "node:crypto";
import { query } from "@/lib/db";

export type AuthEmailPurpose = "verify_email" | "reset_password";

export function hashAuthEmailToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAuthEmailToken(
  userId: string,
  purpose: AuthEmailPurpose,
  ttlMinutes: number
) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashAuthEmailToken(token);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  await query(
    `DELETE FROM auth_email_tokens
     WHERE user_id = $1
       AND purpose = $2
       AND used_at IS NULL`,
    [userId, purpose]
  );

  const result = await query<{ id: string }>(
    `INSERT INTO auth_email_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [userId, purpose, tokenHash, expiresAt]
  );

  return { id: result.rows[0].id, token, expiresAt };
}

export async function deleteAuthEmailToken(id: string) {
  await query(`DELETE FROM auth_email_tokens WHERE id = $1`, [id]);
}
