import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isMailConfigured, sendMail, textToHtml } from "@/lib/mail";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sendSchema = z.object({
  recipientEmail: z.string().trim().toLowerCase().email()
});

function redirectToLetter(caseId: string, letterId: string, type: "sent" | "error", message?: string) {
  const url = publicUrl(`/faelle/${caseId}/schreiben/${letterId}`);
  if (type === "sent") {
    url.searchParams.set("sent", "1");
  } else if (message) {
    url.searchParams.set("error", message);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, context: { params: Promise<{ id: string; letterId: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id: caseId, letterId } = await context.params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(letterId)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  const parsed = sendSchema.safeParse({ recipientEmail: formData.get("recipientEmail") });
  if (!parsed.success) {
    return redirectToLetter(caseId, letterId, "error", "Bitte gib eine gültige Empfängeradresse ein.");
  }

  if (!isMailConfigured()) {
    return redirectToLetter(caseId, letterId, "error", "Der E-Mail-Versand ist noch nicht eingerichtet.");
  }

  const client = await getDb().connect();

  try {
    const result = await client.query<{
      subject: string | null;
      body: string;
      case_title: string;
      sender_email: string;
      email_verified_at: string | Date | null;
    }>(
      `SELECT
         l.subject,
         l.body,
         c.title AS case_title,
         u.email AS sender_email,
         u.email_verified_at
       FROM generated_letters l
       JOIN cases c ON c.id = l.case_id
       JOIN app_users u ON u.id = c.user_id
       WHERE l.id = $1
         AND l.case_id = $2
         AND c.user_id = $3
       LIMIT 1`,
      [letterId, caseId, user.id]
    );

    const letter = result.rows[0];
    if (!letter) {
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    if (!letter.email_verified_at) {
      return redirectToLetter(caseId, letterId, "error", "Bestätige zuerst deine E-Mail-Adresse in den Einstellungen.");
    }

    const subject = letter.subject?.trim() || `Reklaio-Schreiben zu ${letter.case_title}`;
    const signature = `\n\n---\nGesendet über Reklaio im Auftrag von ${user.displayName || letter.sender_email}.`;

    await sendMail({
      to: parsed.data.recipientEmail,
      replyTo: letter.sender_email,
      subject,
      text: `${letter.body}${signature}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${textToHtml(letter.body)}<hr /><p style="color:#666;font-size:12px">Gesendet über Reklaio im Auftrag von ${textToHtml(user.displayName || letter.sender_email)}.</p></div>`
    });

    await client.query("BEGIN");
    await client.query(
      `UPDATE generated_letters
       SET recipient_email = $1, last_sent_at = NOW()
       WHERE id = $2 AND case_id = $3`,
      [parsed.data.recipientEmail, letterId, caseId]
    );
    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'letter_emailed', 'Schreiben per E-Mail versendet', $2, NOW())`,
      [caseId, `Empfänger: ${parsed.data.recipientEmail} · Betreff: ${subject}`]
    );
    await client.query("COMMIT");

    return redirectToLetter(caseId, letterId, "sent");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Letter email delivery failed", error);
    return redirectToLetter(caseId, letterId, "error", "Das Schreiben konnte gerade nicht versendet werden.");
  } finally {
    client.release();
  }
}
