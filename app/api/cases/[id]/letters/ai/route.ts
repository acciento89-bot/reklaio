import { NextResponse } from "next/server";
import { z } from "zod";
import { generateLetterDraft, isAiConfigured } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/cases";
import { getCaseTypeByValue } from "@/lib/case-types";
import { getDb } from "@/lib/db";
import { getLetterKindLabel, isLetterKind } from "@/lib/letters";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const schema = z.object({
  kind: z.string().trim(),
  desiredOutcome: z.string().trim().min(3).max(1500),
  deadlineDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  aiConsent: z.literal(true)
});

function errorRedirect(caseId: string, message: string) {
  const url = publicUrl(`/faelle/${caseId}/schreiben/neu`);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id: caseId } = await context.params;
  if (!UUID_PATTERN.test(caseId)) return NextResponse.redirect(publicUrl("/dashboard"), 303);

  const formData = await request.formData();
  const parsed = schema.safeParse({
    kind: formData.get("kind"),
    desiredOutcome: formData.get("desiredOutcome"),
    deadlineDate: formData.get("deadlineDate"),
    aiConsent: formData.get("aiConsent") === "on"
  });

  if (!parsed.success || !isLetterKind(parsed.data.kind)) {
    return errorRedirect(caseId, "Bitte wähle eine Schreibenart, beschreibe die gewünschte Lösung und bestätige die freiwillige KI-Verarbeitung.");
  }
  if (!isAiConfigured()) {
    return errorRedirect(caseId, "Die KI-Funktion ist auf diesem Reklaio-System noch nicht eingerichtet.");
  }

  const client = await getDb().connect();

  try {
    const caseResult = await client.query<{
      type: string;
      title: string;
      company_name: string | null;
      order_reference: string | null;
      amount_cents: number | null;
      currency: string;
      incident_date: string | null;
      summary: string | null;
    }>(
      `SELECT type, title, company_name, order_reference, amount_cents,
              currency, incident_date, summary
       FROM cases
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [caseId, user.id]
    );
    const currentCase = caseResult.rows[0];
    if (!currentCase) return NextResponse.redirect(publicUrl("/dashboard"), 303);

    const responseResult = await client.query<{
      summary: string;
      outcome: string;
      promised_amount_cents: number | null;
      promised_due_at: string | null;
    }>(
      `SELECT summary, outcome, promised_amount_cents, promised_due_at
       FROM provider_responses
       WHERE case_id = $1
       ORDER BY response_received_at DESC, created_at DESC
       LIMIT 5`,
      [caseId]
    );

    const caseType = getCaseTypeByValue(currentCase.type)?.title ?? currentCase.type;
    const providerResponses = responseResult.rows.map((item) => {
      const facts = [
        `Ergebnis: ${item.outcome}`,
        item.summary,
        item.promised_amount_cents !== null ? `zugesagter Betrag: ${formatCurrency(item.promised_amount_cents)}` : null,
        item.promised_due_at ? `zugesagtes Datum: ${formatDate(item.promised_due_at)}` : null
      ].filter(Boolean);
      return facts.join("; ");
    });
    const consentAt = new Date();
    const result = await generateLetterDraft({
      kindLabel: getLetterKindLabel(parsed.data.kind),
      caseTitle: currentCase.title,
      caseType,
      companyName: currentCase.company_name,
      orderReference: currentCase.order_reference,
      amount: formatCurrency(currentCase.amount_cents, currentCase.currency),
      incidentDate: formatDate(currentCase.incident_date),
      summary: currentCase.summary,
      senderName: user.displayName || user.email,
      senderEmail: user.email,
      desiredOutcome: parsed.data.desiredOutcome,
      deadlineDate: parsed.data.deadlineDate || null,
      confirmedDocumentFacts: [],
      providerResponses
    });

    await client.query("BEGIN");
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO generated_letters (
         case_id, kind, subject, body, model_name,
         generation_mode, ai_response_id
       ) VALUES ($1, $2, $3, $4, $5, 'ai', $6)
       RETURNING id`,
      [caseId, parsed.data.kind, result.data.subject, result.data.body, result.model, result.responseId]
    );
    const letterId = inserted.rows[0]!.id;

    await client.query(
      `INSERT INTO ai_usage_events (
         user_id, case_id, operation, provider, model_name,
         response_id, consent_at, metadata_json
       ) VALUES ($1, $2, 'letter_draft', 'openai', $3, $4, $5, $6::jsonb)`,
      [
        user.id,
        caseId,
        result.model,
        result.responseId,
        consentAt,
        JSON.stringify({
          kind: parsed.data.kind,
          desiredOutcome: parsed.data.desiredOutcome,
          missingInformation: result.data.missingInformation,
          usedFacts: result.data.usedFacts
        })
      ]
    );
    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'letter_ai_created', 'KI-Schreiben als Entwurf erstellt', $2, NOW())`,
      [caseId, `${getLetterKindLabel(parsed.data.kind)} · Modell: ${result.model} · Vor Versand vollständig prüfen`]
    );
    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2", [caseId, user.id]);
    await client.query("COMMIT");

    const url = publicUrl(`/faelle/${caseId}/schreiben/${letterId}`);
    url.searchParams.set("generated", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("AI letter generation failed", error);
    return errorRedirect(caseId, "Der KI-Entwurf konnte gerade nicht erstellt werden.");
  } finally {
    client.release();
  }
}
