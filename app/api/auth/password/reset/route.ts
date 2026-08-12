import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordChangedEmail } from "@/lib/account-email";
import { hashAuthEmailToken } from "@/lib/auth-email-tokens";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(10).max(128),
  confirmPassword: z.string().min(10).max(128)
});

function resetError(token: string, message: string) {
  const url = publicUrl("/passwort-zuruecksetzen");
  url.searchParams.set("token", token);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "");
  const parsed = resetSchema.safeParse({
    token,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return resetError(token, "Das Passwort muss zwischen 10 und 128 Zeichen lang sein.");
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return resetError(token, "Die beiden Passwörter stimmen nicht überein.");
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{
      id: string;
      user_id: string;
      email: string;
      display_name: string | null;
    }>(
      `SELECT t.id, t.user_id, u.email, u.display_name
       FROM auth_email_tokens t
       JOIN app_users u ON u.id = t.user_id
       WHERE t.token_hash = $1
         AND t.purpose = 'reset_password'
         AND t.used_at IS NULL
         AND t.expires_at > NOW()
       FOR UPDATE`,
      [hashAuthEmailToken(parsed.data.token)]
    );

    const resetToken = result.rows[0];
    if (!resetToken) {
      await client.query("ROLLBACK");
      return resetError(token, "Der Reset-Link ist ungültig oder abgelaufen.");
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await client.query(
      `UPDATE app_users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, resetToken.user_id]
    );
    await client.query(`DELETE FROM auth_sessions WHERE user_id = $1`, [resetToken.user_id]);
    await client.query(
      `UPDATE auth_email_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [resetToken.id]
    );
    await client.query(
      `DELETE FROM auth_email_tokens
       WHERE user_id = $1 AND purpose = 'reset_password' AND id <> $2`,
      [resetToken.user_id, resetToken.id]
    );

    await client.query("COMMIT");

    await sendPasswordChangedEmail({
      userId: resetToken.user_id,
      email: resetToken.email,
      displayName: resetToken.display_name
    }).catch(error => console.error("Password reset notification failed", resetToken.user_id, error));

    const url = publicUrl("/anmelden");
    url.searchParams.set("notice", "Passwort geändert. Du kannst dich jetzt anmelden.");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Password reset failed", error);
    return resetError(token, "Das Passwort konnte gerade nicht geändert werden.");
  } finally {
    client.release();
  }
}
