import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { legalOperator } from "@/lib/legal";
import { escapeHtml, isMailConfigured, sendMail, textToHtml } from "@/lib/mail";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  subject: z.enum([
    "Allgemeine Frage",
    "Technisches Problem",
    "Konto und Anmeldung",
    "Datenschutz",
    "Abonnement und Rechnung"
  ]),
  message: z.string().trim().min(20).max(5000),
  privacyAccepted: z.literal(true),
  website: z.string().max(200).optional().default("")
});

function redirectError(message: string) {
  const url = publicUrl("/kontakt");
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

function getIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

function hashIp(ip: string) {
  const secret = process.env.SESSION_SECRET || "reklaio-contact";
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    privacyAccepted: formData.get("privacyAccepted") === "on",
    website: formData.get("website")
  });

  if (!parsed.success) {
    return redirectError("Bitte prüfe die Pflichtfelder und bestätige die Datenschutzerklärung.");
  }

  if (parsed.data.website) {
    return NextResponse.redirect(publicUrl("/kontakt?sent=1"), 303);
  }

  if (!isMailConfigured()) {
    return redirectError("Das Kontaktformular ist technisch noch nicht für den Versand eingerichtet.");
  }

  const user = await getCurrentUser();
  const ipHash = hashIp(getIp(request));

  const recent = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM contact_messages
     WHERE ip_hash = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [ipHash]
  );

  if ((recent.rows[0]?.count ?? 0) >= 5) {
    return redirectError("Zu viele Nachrichten in kurzer Zeit. Bitte versuche es später erneut.");
  }

  const inserted = await query<{ id: string }>(
    `INSERT INTO contact_messages (user_id, name, email, subject, message, ip_hash)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [user?.id ?? null, parsed.data.name, parsed.data.email, parsed.data.subject, parsed.data.message, ipHash]
  );

  const messageId = inserted.rows[0]?.id;
  const recipient = process.env.CONTACT_RECIPIENT?.trim() || legalOperator.email;
  const subject = `[Reklaio Kontakt] ${parsed.data.subject}`;
  const text = [
    `Kontaktanfrage ${messageId ?? ""}`,
    `Name: ${parsed.data.name}`,
    `E-Mail: ${parsed.data.email}`,
    `Konto: ${user?.id ?? "nicht angemeldet"}`,
    "",
    parsed.data.message
  ].join("\n");

  try {
    await sendMail({
      to: recipient,
      replyTo: parsed.data.email,
      subject,
      text,
      html: `<h2>${escapeHtml(parsed.data.subject)}</h2><p><strong>Name:</strong> ${escapeHtml(parsed.data.name)}<br /><strong>E-Mail:</strong> ${escapeHtml(parsed.data.email)}<br /><strong>Konto:</strong> ${escapeHtml(user?.id ?? "nicht angemeldet")}</p><hr /><p>${textToHtml(parsed.data.message)}</p>`
    });

    if (messageId) {
      await query("UPDATE contact_messages SET delivered_at = NOW() WHERE id = $1", [messageId]);
    }

    return NextResponse.redirect(publicUrl("/kontakt?sent=1"), 303);
  } catch (error) {
    console.error("Contact message delivery failed", error);
    return redirectError("Die Nachricht konnte gerade nicht versendet werden. Bitte nutze vorübergehend die E-Mail-Adresse im Impressum.");
  }
}
