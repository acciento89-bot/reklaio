import { redirect } from "next/navigation";
import type { AuthUser } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminUser(user: Pick<AuthUser, "email" | "role">) {
  return user.role === "admin" || configuredAdminEmails().has(user.email.toLowerCase());
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/anmelden");
  if (!isAdminUser(user)) redirect("/dashboard");
  return user;
}

export async function recordAdminAudit(input: {
  adminUserId: string;
  targetUserId?: string | null;
  action: string;
  details?: Record<string, unknown>;
}) {
  await query(
    `INSERT INTO admin_audit_events (
       admin_user_id, target_user_id, action, details_json
     ) VALUES ($1, $2, $3, $4::jsonb)`,
    [
      input.adminUserId,
      input.targetUserId ?? null,
      input.action,
      JSON.stringify(input.details ?? {})
    ]
  );
}
