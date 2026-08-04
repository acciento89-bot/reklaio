import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { parseAmountCents } from "@/lib/cases";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";
import { providerOutcomes } from "@/lib/workflow";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const outcomes = providerOutcomes.map((item) => item.value) as [string, ...string[]];
const schema = z.object({
  responseReceivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  outcome: z.enum(outcomes),
  summary: z.string().trim().min(2).max(5000),
  promisedDueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  documentId: z.string().uuid().optional()
});

function redirect(caseId: string, key: "notice" | "error", message: string) {
  const url = publicUrl(`/faelle/${caseId}/steuerung`);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, 303);
}

function followUp(outcome: string, promisedDueDate: string | undefined) {
  switch (outcome) {
    case "accepted":
      return { title: "Zusage prüfen", priority: "high", days: promisedDueDate ? null : 7, status: "waiting_for_reply" };
    case "rejected":
      return { title: "Nächsten Eskalationsschritt prüfen", priority: "urgent", days: 2, status: "escalation" };
    case "question":
      return { title: "Rückfrage des Anbieters beantworten", priority: "high", days: 3, status: "ready_to_contact" };
    case "partial_offer":
      return { title: "Teilangebot prüfen und beantworten", priority: "high", days: 3, status: "escalation" };
    default:
      return { title: "Antwort des Anbieters auswerten", priority: "normal", days: 3, status: "ready_to_contact" };
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return NextResponse.redirect(publicUrl("/dashboard"), 303);

  const formData = await request.formData();
  const promisedDueDateRaw = String(formData.get("promisedDueDate") ?? "").trim();
  const documentIdRaw = String(formData.get("documentId") ?? "").trim();
  const parsed = schema.safeParse({
    responseReceivedAt: formData.get("responseReceivedAt"),
    outcome: formData.get("outcome"),
    summary: formData.get("summary"),
    promisedDueDate: promisedDueDateRaw || undefined,
    documentId: documentIdRaw || undefined
  });

  if (!parsed.success) return redirect(id, "error", "Bitte prüfe Datum, Ergebnis und Zusammenfassung der Antwort.");

  let promisedAmountCents: number | null;
  try {
    promisedAmountCents = parseAmountCents(String(formData.get("promisedAmount") ?? ""));
  } catch {
    return redirect(id, "error", "Der zugesagte Betrag ist ungültig.");
  }

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const owner = await client.query<{ id: string }>(
      `SELECT id FROM cases WHERE id = $1 AND user_id = $2 LIMIT 1 FOR UPDATE`,
      [id, user.id]
    );
    if (!owner.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    if (parsed.data.documentId) {
      const document = await client.query<{ id: string }>(
        `SELECT d.id
         FROM case_documents d
         JOIN cases c ON c.id = d.case_id
         WHERE d.id = $1 AND d.case_id = $2 AND c.user_id = $3
         LIMIT 1`,
        [parsed.data.documentId, id, user.id]
      );
      if (!document.rows[0]) {
        await client.query("ROLLBACK");
        return redirect(id, "error", "Das ausgewählte Antwortdokument gehört nicht zu diesem Fall.");
      }
    }

    await client.query(
      `INSERT INTO provider_responses (
         case_id, response_received_at, outcome, promised_amount_cents, promised_due_at, summary, document_id
       ) VALUES (
         $1,
         $2::timestamp AT TIME ZONE 'Europe/Berlin',
         $3,
         $4,
         CASE WHEN $5::text IS NULL THEN NULL ELSE ($5::date + time '23:59:59') AT TIME ZONE 'Europe/Berlin' END,
         $6,
         $7
       )`,
      [
        id,
        parsed.data.responseReceivedAt,
        parsed.data.outcome,
        promisedAmountCents,
        parsed.data.promisedDueDate ?? null,
        parsed.data.summary,
        parsed.data.documentId ?? null
      ]
    );

    const next = followUp(parsed.data.outcome, parsed.data.promisedDueDate);
    await client.query(
      `INSERT INTO case_tasks (case_id, title, description, priority, source, due_at)
       VALUES (
         $1, $2, 'Automatisch aus der erfassten Anbieterantwort erstellt.', $3, 'provider_response',
         CASE
           WHEN $4::text IS NOT NULL THEN ($4::date + time '23:59:59') AT TIME ZONE 'Europe/Berlin'
           ELSE NOW() + make_interval(days => $5::int)
         END
       )`,
      [id, next.title, next.priority, parsed.data.promisedDueDate ?? null, next.days ?? 0]
    );

    const outcomeLabel = providerOutcomes.find((item) => item.value === parsed.data.outcome)?.label ?? "Antwort erhalten";
    const details = [
      outcomeLabel,
      promisedAmountCents !== null ? `Zusage: ${(promisedAmountCents / 100).toFixed(2).replace(".", ",")} €` : null,
      parsed.data.promisedDueDate ? `Zieldatum: ${parsed.data.promisedDueDate}` : null,
      parsed.data.summary
    ].filter(Boolean).join(" · ");

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'provider_response', 'Antwort des Anbieters erfasst', $2, NOW())`,
      [id, details]
    );
    await client.query(`UPDATE cases SET status = $3, updated_at = NOW() WHERE id = $1 AND user_id = $2`, [id, user.id, next.status]);
    await client.query("COMMIT");
    return redirect(id, "notice", "Anbieterantwort und passende Folgeaufgabe wurden gespeichert.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Provider response creation failed", error);
    return redirect(id, "error", "Die Anbieterantwort konnte gerade nicht gespeichert werden.");
  } finally {
    client.release();
  }
}
