import { NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/account-email";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { isMailConfigured } from "@/lib/mail";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

function settingsRedirect(type: "notice" | "error", message: string) {
  const url = publicUrl("/einstellungen");
  url.searchParams.set(type, message);
  return NextResponse.redirect(url, 303);
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  if (!isMailConfigured()) {
    return settingsRedirect("error", "Der E-Mail-Versand ist noch nicht eingerichtet.");
  }

  const result = await query<{
    email: string;
    display_name: string | null;
    email_verified_at: string | Date | null;
    last_requested_at: string | Date | null;
  }>(
    `SELECT
       u.email,
       u.display_name,
       u.email_verified_at,
       (
         SELECT MAX(t.created_at)
         FROM auth_email_tokens t
         WHERE t.user_id = u.id
           AND t.purpose = 'verify_email'
           AND t.used_at IS NULL
       ) AS last_requested_at
     FROM app_users u
     WHERE u.id = $1
     LIMIT 1`,
    [user.id]
  );

  const account = result.rows[0];
  if (!account) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  if (account.email_verified_at) {
    return settingsRedirect("notice", "Deine E-Mail-Adresse ist bereits bestätigt.");
  }

  if (account.last_requested_at) {
    const lastRequested = new Date(account.last_requested_at).getTime();
    if (Date.now() - lastRequested < 5 * 60_000) {
      return settingsRedirect("error", "Bitte warte fünf Minuten, bevor du einen neuen Link anforderst.");
    }
  }

  try {
    await sendVerificationEmail({
      userId: user.id,
      email: account.email,
      displayName: account.display_name
    });
    return settingsRedirect("notice", "Ein neuer Bestätigungslink wurde gesendet.");
  } catch (error) {
    console.error("Verification resend failed", error);
    return settingsRedirect("error", "Der Bestätigungslink konnte gerade nicht gesendet werden.");
  }
}
