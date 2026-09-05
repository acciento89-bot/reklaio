import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { publicUrl } from "@/lib/public-url";
import { consumeRateLimit, requestFingerprint } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128)
});

function invalidLogin(locale: "de" | "en", message?: string) {
  const url = publicUrl(locale === "en" ? "/en/anmelden" : "/anmelden");
  const fallback = locale === "en" ? "The email address or password is incorrect." : "E-Mail-Adresse oder Passwort ist nicht korrekt.";
  url.searchParams.set("error", message ?? fallback);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = formData.get("locale") === "en" ? "en" : "de";
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) return invalidLogin(locale);

  const emailHash = crypto.createHash("sha256").update(parsed.data.email).digest("hex").slice(0, 24);
  const rate = await consumeRateLimit({
    key: `login:${requestFingerprint(request, "login")}:${emailHash}`,
    limit: 10,
    windowSeconds: 900
  });
  if (!rate.allowed) return invalidLogin(locale, locale === "en" ? "Too many sign-in attempts. Please wait a few minutes and try again." : "Zu viele Anmeldeversuche. Bitte warte einige Minuten und versuche es erneut.");

  const result = await query<{
    id: string;
    password_hash: string | null;
    suspended_at: string | null;
  }>(
    `SELECT id, password_hash, suspended_at
     FROM app_users
     WHERE LOWER(email) = $1
     LIMIT 1`,
    [parsed.data.email]
  );

  const user = result.rows[0];
  if (!user?.password_hash) return invalidLogin(locale);
  if (user.suspended_at) return invalidLogin(locale, locale === "en" ? "This account is currently suspended. Please use the contact form." : "Dieses Konto ist derzeit gesperrt. Bitte nutze das Kontaktformular.");

  const valid = await verifyPassword(parsed.data.password, user.password_hash);
  if (!valid) return invalidLogin(locale);

  await createSession(user.id);
  return NextResponse.redirect(publicUrl(locale === "en" ? "/en/dashboard" : "/dashboard"), 303);
}
