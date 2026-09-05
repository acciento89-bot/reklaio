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

function resetError(token: string, message: string, locale: "de" | "en" = "de") {
  const url = publicUrl(locale === "en" ? "/en/passwort-zuruecksetzen" : "/passwort-zuruecksetzen");
  url.searchParams.set("token", token);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "");
  const locale = formData.get("locale") === "en" ? "en" : "de";
  const parsed = resetSchema.safeParse({
    token,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return resetError(token, locale === "en" ? "The password must be between 10 and 128 characters." : "Das Passwort muss zwischen 10 und 128 Zeichen lang sein.", locale);
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return resetError(token, locale === "en" ? "The two passwords do not match." : "Die beiden Passwörter stimmen nicht überein.", locale);
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
      return resetError(token, locale === "en" ? "The reset link is invalid or has expired." : "Der Reset-Link ist ungültig oder abgelaufen.", locale);
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
      displayName: resetToken.display_name,
      locale
    }).catch(error => console.error("Password reset notification failed", resetToken.user_id, error));

    const url = publicUrl(locale === "en" ? "/en/anmelden" : "/anmelden");
    url.searchParams.set("notice", locale === "en" ? "Password changed. You can now sign in." : "Passwort geändert. Du kannst dich jetzt anmelden.");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Password reset failed", error);
    return resetError(token, locale === "en" ? "The password could not be changed right now." : "Das Passwort konnte gerade nicht geändert werden.", locale);
  } finally {
    client.release();
  }
}
