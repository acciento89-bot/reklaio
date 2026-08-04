import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AccountRow = {
  id: string;
  email: string;
  display_name: string | null;
  email_verified_at: string | Date | null;
  onboarding_completed_at: string | Date | null;
  onboarding_dismissed_at: string | Date | null;
  terms_accepted_at: string | Date | null;
  terms_version: string | null;
  privacy_acknowledged_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  try {
    const [
      accountResult,
      caseResult,
      eventResult,
      deadlineResult,
      letterResult,
      documentResult,
      taskResult,
      responseResult,
      escalationResult,
      deliveryResult,
      deliveryAttachmentResult,
      aiAnalysisResult,
      aiUsageResult
    ] = await Promise.all([
      query<AccountRow>(
        `SELECT id, email, display_name, email_verified_at,
                onboarding_completed_at, onboarding_dismissed_at,
                terms_accepted_at, terms_version, privacy_acknowledged_at,
                created_at, updated_at
         FROM app_users WHERE id = $1 LIMIT 1`,
        [user.id]
      ),
      query(
        `SELECT id, type, status, title, company_name, order_reference,
                amount_cents, currency, incident_date, summary, created_at, updated_at
         FROM cases WHERE user_id = $1 ORDER BY created_at ASC`,
        [user.id]
      ),
      query(
        `SELECT e.id, e.case_id, e.event_type, e.title, e.details, e.occurred_at, e.created_at
         FROM case_events e JOIN cases c ON c.id = e.case_id
         WHERE c.user_id = $1 ORDER BY e.occurred_at ASC`,
        [user.id]
      ),
      query(
        `SELECT d.id, d.case_id, d.title, d.due_at, d.completed_at, d.reminder_sent_at, d.created_at
         FROM case_deadlines d JOIN cases c ON c.id = d.case_id
         WHERE c.user_id = $1 ORDER BY d.due_at ASC`,
        [user.id]
      ),
      query(
        `SELECT l.id, l.case_id, l.kind, l.subject, l.body, l.model_name,
                l.generation_mode, l.ai_response_id, l.approved_at,
                l.recipient_email, l.last_sent_at, l.created_at
         FROM generated_letters l JOIN cases c ON c.id = l.case_id
         WHERE c.user_id = $1 ORDER BY l.created_at ASC`,
        [user.id]
      ),
      query(
        `SELECT d.id, d.case_id, d.original_name, d.mime_type, d.size_bytes,
                d.sha256, d.document_type, d.extracted_text, d.created_at
         FROM case_documents d JOIN cases c ON c.id = d.case_id
         WHERE c.user_id = $1 ORDER BY d.created_at ASC`,
        [user.id]
      ),
      query(
        `SELECT t.id, t.case_id, t.title, t.description, t.priority, t.status,
                t.source, t.due_at, t.completed_at, t.created_at, t.updated_at
         FROM case_tasks t JOIN cases c ON c.id = t.case_id
         WHERE c.user_id = $1 ORDER BY t.created_at ASC`,
        [user.id]
      ),
      query(
        `SELECT r.id, r.case_id, r.response_received_at, r.outcome,
                r.promised_amount_cents, r.promised_due_at, r.summary,
                r.document_id, r.created_at
         FROM provider_responses r JOIN cases c ON c.id = r.case_id
         WHERE c.user_id = $1 ORDER BY r.response_received_at ASC`,
        [user.id]
      ),
      query(
        `SELECT e.id, e.case_id, e.stage, e.note, e.created_at
         FROM case_escalations e JOIN cases c ON c.id = e.case_id
         WHERE c.user_id = $1 ORDER BY e.created_at ASC`,
        [user.id]
      ),
      query(
        `SELECT e.id, e.letter_id, e.case_id, e.recipient_email, e.subject,
                e.attachment_count, e.reply_deadline_id, e.sent_at
         FROM letter_email_deliveries e JOIN cases c ON c.id = e.case_id
         WHERE c.user_id = $1 ORDER BY e.sent_at ASC`,
        [user.id]
      ),
      query(
        `SELECT a.id, a.delivery_id, a.document_id, a.original_name, a.size_bytes
         FROM letter_email_delivery_attachments a
         JOIN letter_email_deliveries e ON e.id = a.delivery_id
         JOIN cases c ON c.id = e.case_id
         WHERE c.user_id = $1 ORDER BY e.sent_at ASC`,
        [user.id]
      ),
      query(
        `SELECT a.id, a.document_id, a.case_id, a.provider, a.model_name,
                a.response_id, a.consent_at, a.result_json, a.applied_at, a.created_at
         FROM document_ai_analyses a
         WHERE a.user_id = $1
         ORDER BY a.created_at ASC`,
        [user.id]
      ),
      query(
        `SELECT id, case_id, document_id, operation, provider, model_name,
                response_id, consent_at, metadata_json, created_at
         FROM ai_usage_events
         WHERE user_id = $1
         ORDER BY created_at ASC`,
        [user.id]
      )
    ]);

    const exportData = {
      exportVersion: 3,
      generatedAt: new Date().toISOString(),
      service: "Reklaio",
      account: accountResult.rows[0] ?? null,
      cases: caseResult.rows,
      events: eventResult.rows,
      deadlines: deadlineResult.rows,
      letters: letterResult.rows,
      documents: documentResult.rows,
      tasks: taskResult.rows,
      providerResponses: responseResult.rows,
      escalations: escalationResult.rows,
      emailDeliveries: deliveryResult.rows,
      emailDeliveryAttachments: deliveryAttachmentResult.rows,
      documentAiAnalyses: aiAnalysisResult.rows,
      aiUsageEvents: aiUsageResult.rows,
      note: "Passwort-Hashes, Sitzungstoken und hochgeladene Binärdateien sind nicht Teil dieses JSON-Exports."
    };

    const json = JSON.stringify(exportData, null, 2);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="reklaio-datenexport-${date}.json"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Account export failed", error);
    return new Response("Der Datenexport konnte gerade nicht erstellt werden.", { status: 500 });
  }
}
