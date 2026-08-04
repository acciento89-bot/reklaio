import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { resolveStoragePath, safeDownloadName } from "@/lib/documents";
import { isMailConfigured, sendMail, textToHtml } from "@/lib/mail";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ATTACHMENT_COUNT = 5;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const sendSchema = z.object({
  recipientEmail: z.string().trim().toLowerCase().email(),
  deadlineDays: z.enum(["7", "14"]).optional()
});

type DocumentAttachment = {
  id: string;
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: string;
};

function redirectToLetter(
  caseId: string,
  letterId: string,
  params: { sent?: boolean; error?: string; warning?: string }
) {
  const url = publicUrl(`/faelle/${caseId}/schreiben/${letterId}`);
  if (params.sent) url.searchParams.set("sent", "1");
  if (params.error) url.searchParams.set("error", params.error);
  if (params.warning) url.searchParams.set("warning", params.warning);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, context: { params: Promise<{ id: string; letterId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id: caseId, letterId } = await context.params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(letterId)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  const createReplyDeadline = formData.get("createReplyDeadline") === "on";
  const parsed = sendSchema.safeParse({
    recipientEmail: formData.get("recipientEmail"),
    deadlineDays: createReplyDeadline ? formData.get("deadlineDays") : undefined
  });
  if (!parsed.success) {
    return redirectToLetter(caseId, letterId, { error: "Bitte prüfe Empfängeradresse und Antwortfrist." });
  }

  const documentIds = [...new Set(formData.getAll("documentIds").map(String).filter((value) => UUID_PATTERN.test(value)))];
  if (documentIds.length > MAX_ATTACHMENT_COUNT) {
    return redirectToLetter(caseId, letterId, { error: `Es können höchstens ${MAX_ATTACHMENT_COUNT} Dokumente versendet werden.` });
  }

  if (!isMailConfigured()) {
    return redirectToLetter(caseId, letterId, { error: "Der E-Mail-Versand ist noch nicht eingerichtet." });
  }

  const client = await getDb().connect();
  let mailSent = false;

  try {
    const result = await client.query<{
      subject: string | null;
      body: string;
      case_title: string;
      sender_email: string;
      email_verified_at: string | Date | null;
    }>(
      `SELECT l.subject, l.body, c.title AS case_title,
              u.email AS sender_email, u.email_verified_at
       FROM generated_letters l
       JOIN cases c ON c.id = l.case_id
       JOIN app_users u ON u.id = c.user_id
       WHERE l.id = $1 AND l.case_id = $2 AND c.user_id = $3
       LIMIT 1`,
      [letterId, caseId, user.id]
    );

    const letter = result.rows[0];
    if (!letter) return NextResponse.redirect(publicUrl("/dashboard"), 303);
    if (!letter.email_verified_at) {
      return redirectToLetter(caseId, letterId, { error: "Bestätige zuerst deine E-Mail-Adresse in den Einstellungen." });
    }

    let documents: DocumentAttachment[] = [];
    if (documentIds.length) {
      const documentResult = await client.query<DocumentAttachment>(
        `SELECT d.id, d.original_name, d.storage_key, d.mime_type, d.size_bytes
         FROM case_documents d
         JOIN cases c ON c.id = d.case_id
         WHERE d.case_id = $1
           AND c.user_id = $2
           AND d.id = ANY($3::uuid[])
         ORDER BY d.created_at ASC`,
        [caseId, user.id, documentIds]
      );
      documents = documentResult.rows;
      if (documents.length !== documentIds.length) {
        return redirectToLetter(caseId, letterId, { error: "Mindestens ein ausgewähltes Dokument gehört nicht zu diesem Fall." });
      }
    }

    const attachmentBytes = documents.reduce((sum, document) => sum + Number(document.size_bytes), 0);
    if (!Number.isFinite(attachmentBytes) || attachmentBytes > MAX_ATTACHMENT_BYTES) {
      return redirectToLetter(caseId, letterId, { error: "Die ausgewählten Anhänge dürfen zusammen höchstens 10 MB groß sein." });
    }

    const attachments = documents.map((document) => ({
      filename: safeDownloadName(document.original_name),
      path: resolveStoragePath(document.storage_key),
      contentType: document.mime_type
    }));
    await Promise.all(attachments.map((attachment) => fs.access(attachment.path)));

    const subject = letter.subject?.trim() || `Reklaio-Schreiben zu ${letter.case_title}`;
    const signature = `\n\n---\nGesendet über Reklaio im Auftrag von ${user.displayName || letter.sender_email}.`;

    await sendMail({
      to: parsed.data.recipientEmail,
      replyTo: letter.sender_email,
      subject,
      text: `${letter.body}${signature}`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${textToHtml(letter.body)}<hr /><p style="color:#666;font-size:12px">Gesendet über Reklaio im Auftrag von ${textToHtml(user.displayName || letter.sender_email)}.</p></div>`,
      attachments
    });
    mailSent = true;

    await client.query("BEGIN");

    let replyDeadlineId: string | null = null;
    const deadlineDays = createReplyDeadline ? Number(parsed.data.deadlineDays) : null;
    if (deadlineDays) {
      const deadlineResult = await client.query<{ id: string; due_at: string }>(
        `INSERT INTO case_deadlines (case_id, title, due_at)
         VALUES ($1, 'Antwortfrist nach E-Mail-Versand', ((CURRENT_DATE + $2::int)::date + time '23:59:59') AT TIME ZONE 'Europe/Berlin')
         RETURNING id, due_at`,
        [caseId, deadlineDays]
      );
      replyDeadlineId = deadlineResult.rows[0]?.id ?? null;

      await client.query(
        `INSERT INTO case_tasks (case_id, title, description, priority, source, due_at)
         VALUES ($1, 'Antwort des Anbieters prüfen', 'Automatisch nach dem E-Mail-Versand erstellt.', 'high', 'email',
                 ((CURRENT_DATE + $2::int)::date + time '23:59:59') AT TIME ZONE 'Europe/Berlin')`,
        [caseId, deadlineDays]
      );
    }

    const deliveryResult = await client.query<{ id: string }>(
      `INSERT INTO letter_email_deliveries (
         letter_id, case_id, recipient_email, subject, attachment_count, reply_deadline_id
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [letterId, caseId, parsed.data.recipientEmail, subject, documents.length, replyDeadlineId]
    );
    const deliveryId = deliveryResult.rows[0]!.id;

    for (const document of documents) {
      await client.query(
        `INSERT INTO letter_email_delivery_attachments (
           delivery_id, document_id, original_name, size_bytes
         ) VALUES ($1, $2, $3, $4)`,
        [deliveryId, document.id, document.original_name, document.size_bytes]
      );
    }

    await client.query(
      `UPDATE generated_letters
       SET recipient_email = $1, last_sent_at = NOW()
       WHERE id = $2 AND case_id = $3`,
      [parsed.data.recipientEmail, letterId, caseId]
    );

    const details = [
      `Empfänger: ${parsed.data.recipientEmail}`,
      `Betreff: ${subject}`,
      documents.length ? `Anhänge: ${documents.map((document) => document.original_name).join(", ")}` : "Keine Anhänge",
      deadlineDays ? `Antwortfrist: ${deadlineDays} Tage` : null
    ].filter(Boolean).join(" · ");

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'letter_emailed', 'Schreiben per E-Mail versendet', $2, NOW())`,
      [caseId, details]
    );
    await client.query(
      `UPDATE cases SET status = 'waiting_for_reply', updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [caseId, user.id]
    );
    await client.query("COMMIT");

    return redirectToLetter(caseId, letterId, { sent: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Letter email delivery failed", error);
    if (mailSent) {
      return redirectToLetter(caseId, letterId, {
        sent: true,
        warning: "Die E-Mail wurde versendet, aber das Versandprotokoll konnte nicht vollständig gespeichert werden."
      });
    }
    return redirectToLetter(caseId, letterId, { error: "Das Schreiben konnte gerade nicht versendet werden." });
  } finally {
    client.release();
  }
}
