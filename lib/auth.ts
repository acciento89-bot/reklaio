import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSessionTokenHash } from "@/lib/session";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: "user" | "admin";
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const tokenHash = await getSessionTokenHash();

  if (!tokenHash) {
    return null;
  }

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
  if (!user || user.suspended_at) {
    return null;
  }

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

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/anmelden");
  }

  return user;
}
