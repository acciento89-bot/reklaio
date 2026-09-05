import { NextResponse } from "next/server";
import { z } from "zod";
import { sendVerificationEmail } from "@/lib/account-email";
import { query } from "@/lib/db";
import { AGB_VERSION } from "@/lib/legal-documents";
import { isMailConfigured } from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { publicUrl } from "@/lib/public-url";
import { consumeRateLimit, requestFingerprint } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

const registrationSchema = z.object({
  displayName: z.string().trim().max(80).optional().default(""),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10).max(128),
  acceptTerms: z.literal(true),
  acknowledgePrivacy: z.literal(true)
});

function redirectWithError(message: string, locale: "de" | "en" = "de") {
  const url = publicUrl(locale === "en" ? "/en/registrieren" : "/registrieren");
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = formData.get("locale") === "en" ? "en" : "de";
  const rate = await consumeRateLimit({ key: `register:${requestFingerprint(request, "register")}`, limit: 5, windowSeconds: 3600 });
  if (!rate.allowed) return redirectWithError(locale === "en" ? "Too many registration attempts. Please try again later." : "Zu viele Registrierungsversuche. Bitte versuche es später erneut.", locale);

  const parsed = registrationSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    acceptTerms: formData.get("acceptTerms") === "on",
    acknowledgePrivacy: formData.get("acknowledgePrivacy") === "on"
  });

  if (!parsed.success) {
    return redirectWithError(locale === "en" ? "Please check your details, accept the legal terms and use a password with at least 10 characters." : "Bitte prüfe deine Eingaben, bestätige die Rechtstexte und verwende ein Passwort mit mindestens 10 Zeichen.", locale);
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const result = await query<{ id: string }>(
      `INSERT INTO app_users (
         email, display_name, password_hash,
         terms_accepted_at, terms_version, privacy_acknowledged_at
       )
       VALUES ($1, NULLIF($2, ''), $3, NOW(), $4, NOW())
       RETURNING id`,
      [parsed.data.email, parsed.data.displayName, passwordHash, AGB_VERSION]
    );

    const userId = result.rows[0].id;
    await createSession(userId);
    const url = publicUrl(locale === "en" ? "/en/onboarding" : "/onboarding");
    url.searchParams.set("registered", "1");

    if (isMailConfigured()) {
      try {
        await sendVerificationEmail({ userId, email: parsed.data.email, displayName: parsed.data.displayName, locale });
        url.searchParams.set("notice", locale === "en" ? "A confirmation link was sent by email." : "Bestätigungslink wurde per E-Mail gesendet.");
      } catch (error) {
        console.error("Registration verification email failed", error);
        url.searchParams.set("notice", locale === "en" ? "Account created. You can resend the confirmation link in Settings." : "Konto erstellt. Den Bestätigungslink kannst du in den Einstellungen erneut senden.");
      }
    } else {
      url.searchParams.set("notice", locale === "en" ? "Account created. Email delivery is not configured yet." : "Konto erstellt. E-Mail-Versand ist noch nicht eingerichtet.");
    }

    return NextResponse.redirect(url, 303);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return redirectWithError(locale === "en" ? "An account already exists for this email address." : "Für diese E-Mail-Adresse besteht bereits ein Konto.", locale);
    }
    console.error("Registration failed", error);
    return redirectWithError(locale === "en" ? "Registration could not be completed right now." : "Die Registrierung konnte gerade nicht abgeschlossen werden.", locale);
  }
}
