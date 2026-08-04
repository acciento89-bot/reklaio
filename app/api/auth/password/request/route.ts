import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/account-email";
import { query } from "@/lib/db";
import { isMailConfigured } from "@/lib/mail";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email()
});

function redirect(type: "notice" | "error", message: string) {
  const url = publicUrl("/passwort-vergessen");
  url.searchParams.set(type, message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = requestSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return redirect("error", "Bitte gib eine gültige E-Mail-Adresse ein.");
  }

  if (!isMailConfigured()) {
    return redirect("error", "Der E-Mail-Versand ist noch nicht eingerichtet.");
  }

  const genericNotice = "Falls ein Konto zu dieser Adresse existiert, wurde ein Reset-Link gesendet.";

  try {
    const result = await query<{
      id: string;
      email: string;
      display_name: string | null;
      last_requested_at: string | Date | null;
    }>(
      `SELECT
         u.id,
         u.email,
         u.display_name,
         (
           SELECT MAX(t.created_at)
           FROM auth_email_tokens t
           WHERE t.user_id = u.id
             AND t.purpose = 'reset_password'
             AND t.used_at IS NULL
         ) AS last_requested_at
       FROM app_users u
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [parsed.data.email]
    );

    const account = result.rows[0];
    if (!account) {
      return redirect("notice", genericNotice);
    }

    if (account.last_requested_at) {
      const lastRequested = new Date(account.last_requested_at).getTime();
      if (Date.now() - lastRequested < 5 * 60_000) {
        return redirect("notice", genericNotice);
      }
    }

    await sendPasswordResetEmail({
      userId: account.id,
      email: account.email,
      displayName: account.display_name
    });

    return redirect("notice", genericNotice);
  } catch (error) {
    console.error("Password reset request failed", error);
    return redirect("notice", genericNotice);
  }
}
