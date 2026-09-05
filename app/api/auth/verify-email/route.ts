import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/account-email";
import { getCurrentUser } from "@/lib/auth";
import { hashAuthEmailToken } from "@/lib/auth-email-tokens";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const locale = url.searchParams.get("locale") === "en" ? "en" : "de";
  const currentUser = await getCurrentUser();
  const target = currentUser ? publicUrl(locale === "en" ? "/en/einstellungen" : "/einstellungen") : publicUrl(locale === "en" ? "/en/anmelden" : "/anmelden");

  if (token.length < 20 || token.length > 200) {
    target.searchParams.set("error", locale === "en" ? "The confirmation link is invalid or has expired." : "Der Bestätigungslink ist ungültig oder abgelaufen.");
    return NextResponse.redirect(target, 303);
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{
      id: string;
      user_id: string;
      email: string;
      display_name: string | null;
      email_verified_at: string | Date | null;
    }>(
      `SELECT t.id, t.user_id, u.email, u.display_name, u.email_verified_at
       FROM auth_email_tokens t
       JOIN app_users u ON u.id = t.user_id
       WHERE t.token_hash = $1
         AND t.purpose = 'verify_email'
         AND t.used_at IS NULL
         AND t.expires_at > NOW()
       FOR UPDATE`,
      [hashAuthEmailToken(token)]
    );

    const emailToken = result.rows[0];
    if (!emailToken) {
      await client.query("ROLLBACK");
      target.searchParams.set("error", locale === "en" ? "The confirmation link is invalid or has expired." : "Der Bestätigungslink ist ungültig oder abgelaufen.");
      return NextResponse.redirect(target, 303);
    }

    await client.query(
      `UPDATE app_users
       SET email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW()
       WHERE id = $1`,
      [emailToken.user_id]
    );
    await client.query(
      `UPDATE auth_email_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [emailToken.id]
    );
    await client.query(
      `DELETE FROM auth_email_tokens
       WHERE user_id = $1 AND purpose = 'verify_email' AND id <> $2`,
      [emailToken.user_id, emailToken.id]
    );

    await client.query("COMMIT");

    if (!emailToken.email_verified_at) {
      await sendWelcomeEmail({
        userId: emailToken.user_id,
        email: emailToken.email,
        displayName: emailToken.display_name,
        locale
      }).catch(error => console.error("Welcome email failed", emailToken.user_id, error));
    }

    target.searchParams.set("notice", locale === "en" ? "Email address confirmed successfully." : "E-Mail-Adresse erfolgreich bestätigt.");
    return NextResponse.redirect(target, 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Email verification failed", error);
    target.searchParams.set("error", locale === "en" ? "The email address could not be confirmed right now." : "Die E-Mail-Adresse konnte gerade nicht bestätigt werden.");
    return NextResponse.redirect(target, 303);
  } finally {
    client.release();
  }
}
