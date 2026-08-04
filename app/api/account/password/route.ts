import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { publicUrl } from "@/lib/public-url";
import { getSessionTokenHash } from "@/lib/session";

export const runtime = "nodejs";

const passwordSchema = z.object({
  currentPassword: z.string().min(10).max(128),
  newPassword: z.string().min(10).max(128),
  confirmPassword: z.string().min(10).max(128)
});

function settingsRedirect(type: "notice" | "error", message: string) {
  const url = publicUrl("/einstellungen");
  url.searchParams.set(type, message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const formData = await request.formData();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return settingsRedirect("error", "Das neue Passwort muss zwischen 10 und 128 Zeichen lang sein.");
  }

  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return settingsRedirect("error", "Die beiden neuen Passwörter stimmen nicht überein.");
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return settingsRedirect("error", "Das neue Passwort muss sich vom bisherigen Passwort unterscheiden.");
  }

  const client = await getDb().connect();

  try {
    const result = await client.query<{ password_hash: string | null }>(
      `SELECT password_hash FROM app_users WHERE id = $1 LIMIT 1`,
      [user.id]
    );

    const passwordHash = result.rows[0]?.password_hash;
    if (!passwordHash || !(await verifyPassword(parsed.data.currentPassword, passwordHash))) {
      return settingsRedirect("error", "Das aktuelle Passwort ist nicht korrekt.");
    }

    const newPasswordHash = await hashPassword(parsed.data.newPassword);
    const currentTokenHash = await getSessionTokenHash();

    await client.query("BEGIN");
    await client.query(
      `UPDATE app_users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, user.id]
    );

    if (currentTokenHash) {
      await client.query(
        `DELETE FROM auth_sessions
         WHERE user_id = $1 AND token_hash <> $2`,
        [user.id, currentTokenHash]
      );
    } else {
      await client.query(`DELETE FROM auth_sessions WHERE user_id = $1`, [user.id]);
    }

    await client.query("COMMIT");
    return settingsRedirect("notice", "Passwort geändert. Andere Sitzungen wurden abgemeldet.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Password update failed", error);
    return settingsRedirect("error", "Das Passwort konnte gerade nicht geändert werden.");
  } finally {
    client.release();
  }
}
