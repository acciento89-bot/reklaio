import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { formatDate } from "@/lib/cases";
import { query } from "@/lib/db";
import { renderReklaioEmail } from "@/lib/email-template";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReminderType = "soon" | "overdue";

type ReminderCandidate = {
  deadline_id: string;
  deadline_title: string;
  due_at: string | Date;
  reminder_type: ReminderType;
  case_id: string;
  case_title: string;
  company_name: string | null;
  email: string;
  display_name: string | null;
};

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  const expected = secret ? `Bearer ${secret}` : "";

  if (!secret || header.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

function reminderCopy(candidate: ReminderCandidate) {
  const overdue = candidate.reminder_type === "overdue";
  const subject = overdue
    ? `Frist überfällig: ${candidate.deadline_title}`
    : `Frist bald fällig: ${candidate.deadline_title}`;
  const salutation = candidate.display_name ? `Hallo ${candidate.display_name},` : "Hallo,";
  const state = overdue ? "ist bereits überfällig" : "läuft in Kürze ab";
  const provider = candidate.company_name ? ` bei ${candidate.company_name}` : "";
  const caseUrl = publicUrl(`/faelle/${candidate.case_id}`).toString();
  const dueDate = formatDate(candidate.due_at);
  const text = `${salutation}\n\ndie Frist „${candidate.deadline_title}“ im Fall „${candidate.case_title}“${provider} ${state}.\n\nFällig am: ${dueDate}\nFall öffnen: ${caseUrl}\n\nDiese automatische Erinnerung dient nur deiner Organisation und ist keine Rechtsberatung.`;
  const html = renderReklaioEmail({
    preheader: overdue
      ? `Die Frist „${candidate.deadline_title}“ ist überfällig.`
      : `Die Frist „${candidate.deadline_title}“ läuft in Kürze ab.`,
    title: overdue ? "Frist überfällig" : "Frist bald fällig",
    greeting: salutation,
    paragraphs: [
      `Die Frist „${candidate.deadline_title}“ im Fall „${candidate.case_title}“${provider} ${state}.`
    ],
    details: [
      { label: "Frist", value: candidate.deadline_title },
      { label: "Fall", value: candidate.case_title },
      ...(candidate.company_name ? [{ label: "Unternehmen", value: candidate.company_name }] : []),
      { label: "Fällig am", value: dueDate }
    ],
    action: {
      label: "Fall in Reklaio öffnen",
      url: caseUrl
    },
    notice: "Diese automatische Erinnerung dient deiner Organisation und ersetzt keine rechtliche Prüfung oder Beratung.",
    tone: overdue ? "warning" : "brand"
  });

  return { subject, text, html };
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isMailConfigured()) {
    return NextResponse.json({ error: "mail_not_configured" }, { status: 503 });
  }

  const candidates = await query<ReminderCandidate>(
    `SELECT
       d.id AS deadline_id,
       d.title AS deadline_title,
       d.due_at,
       CASE WHEN d.due_at < NOW() THEN 'overdue' ELSE 'soon' END AS reminder_type,
       c.id AS case_id,
       c.title AS case_title,
       c.company_name,
       u.email,
       u.display_name
     FROM case_deadlines d
     JOIN cases c ON c.id = d.case_id
     JOIN app_users u ON u.id = c.user_id
     WHERE d.completed_at IS NULL
       AND c.status NOT IN ('resolved', 'closed')
       AND u.email_verified_at IS NOT NULL
       AND d.due_at <= NOW() + INTERVAL '3 days'
       AND NOT EXISTS (
         SELECT 1
         FROM deadline_email_reminders r
         WHERE r.deadline_id = d.id
           AND r.reminder_type = CASE WHEN d.due_at < NOW() THEN 'overdue' ELSE 'soon' END
       )
     ORDER BY d.due_at ASC
     LIMIT 100`
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of candidates.rows) {
    const reservation = await query<{ deadline_id: string }>(
      `INSERT INTO deadline_email_reminders (deadline_id, reminder_type)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING deadline_id`,
      [candidate.deadline_id, candidate.reminder_type]
    );

    if (reservation.rowCount === 0) {
      skipped += 1;
      continue;
    }

    try {
      const copy = reminderCopy(candidate);
      await sendMail({
        to: candidate.email,
        subject: copy.subject,
        text: copy.text,
        html: copy.html
      });

      await query(
        `UPDATE deadline_email_reminders
         SET sent_at = NOW()
         WHERE deadline_id = $1 AND reminder_type = $2`,
        [candidate.deadline_id, candidate.reminder_type]
      );
      await query(
        `UPDATE case_deadlines
         SET reminder_sent_at = NOW()
         WHERE id = $1`,
        [candidate.deadline_id]
      );
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("Deadline reminder email failed", candidate.deadline_id, error);
      await query(
        `DELETE FROM deadline_email_reminders
         WHERE deadline_id = $1 AND reminder_type = $2 AND sent_at IS NULL`,
        [candidate.deadline_id, candidate.reminder_type]
      ).catch(() => undefined);
    }
  }

  return NextResponse.json({ checked: candidates.rows.length, sent, skipped, failed });
}
