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
  created_at: string | Date;
  updated_at: string | Date;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  try {
    const [accountResult, caseResult, eventResult, deadlineResult, letterResult, documentResult] = await Promise.all([
      query<AccountRow>(
        `SELECT id, email, display_name, email_verified_at, created_at, updated_at
         FROM app_users
         WHERE id = $1
         LIMIT 1`,
        [user.id]
      ),
      query(
        `SELECT id, type, status, title, company_name, order_reference,
                amount_cents, currency, incident_date, summary, created_at, updated_at
         FROM cases
         WHERE user_id = $1
         ORDER BY created_at ASC`,
        [user.id]
      ),
      query(
        `SELECT e.id, e.case_id, e.event_type, e.title, e.details, e.occurred_at, e.created_at
         FROM case_events e
         JOIN cases c ON c.id = e.case_id
         WHERE c.user_id = $1
         ORDER BY e.occurred_at ASC`,
        [user.id]
      ),
      query(
        `SELECT d.id, d.case_id, d.title, d.due_at, d.completed_at, d.reminder_sent_at, d.created_at
         FROM case_deadlines d
         JOIN cases c ON c.id = d.case_id
         WHERE c.user_id = $1
         ORDER BY d.due_at ASC`,
        [user.id]
      ),
      query(
        `SELECT l.id, l.case_id, l.kind, l.subject, l.body, l.model_name, l.approved_at, l.created_at
         FROM generated_letters l
         JOIN cases c ON c.id = l.case_id
         WHERE c.user_id = $1
         ORDER BY l.created_at ASC`,
        [user.id]
      ),
      query(
        `SELECT d.id, d.case_id, d.original_name, d.mime_type, d.size_bytes,
                d.sha256, d.document_type, d.extracted_text, d.created_at
         FROM case_documents d
         JOIN cases c ON c.id = d.case_id
         WHERE c.user_id = $1
         ORDER BY d.created_at ASC`,
        [user.id]
      )
    ]);

    const exportData = {
      exportVersion: 1,
      generatedAt: new Date().toISOString(),
      service: "Reklaio",
      account: accountResult.rows[0] ?? null,
      cases: caseResult.rows,
      events: eventResult.rows,
      deadlines: deadlineResult.rows,
      letters: letterResult.rows,
      documents: documentResult.rows,
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
