import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hashAuthEmailToken } from "@/lib/auth-email-tokens";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const currentUser = await getCurrentUser();
  const target = currentUser ? publicUrl("/einstellungen") : publicUrl("/anmelden");

  if (token.length < 20 || token.length > 200) {
    target.searchParams.set("error", "Der Bestätigungslink ist ungültig oder abgelaufen.");
    return NextResponse.redirect(target, 303);
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{ id: string; user_id: string }>(
      `SELECT id, user_id
       FROM auth_email_tokens
       WHERE token_hash = $1
         AND purpose = 'verify_email'
         AND used_at IS NULL
         AND expires_at > NOW()
       FOR UPDATE`,
      [hashAuthEmailToken(token)]
    );

    const emailToken = result.rows[0];
    if (!emailToken) {
      await client.query("ROLLBACK");
      target.searchParams.set("error", "Der Bestätigungslink ist ungültig oder abgelaufen.");
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
    target.searchParams.set("notice", "E-Mail-Adresse erfolgreich bestätigt.");
    return NextResponse.redirect(target, 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Email verification failed", error);
    target.searchParams.set("error", "Die E-Mail-Adresse konnte gerade nicht bestätigt werden.");
    return NextResponse.redirect(target, 303);
  } finally {
    client.release();
  }
}
