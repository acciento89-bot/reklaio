import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CaseRow = {
  id: string;
  type: string;
  status: string;
  title: string;
  company_name: string | null;
  order_reference: string | null;
  amount_cents: number | null;
  currency: string;
  incident_date: string | Date | null;
  summary: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type EventRow = {
  id: string;
  event_type: string;
  title: string;
  details: string | null;
  occurred_at: string | Date;
};

type DeadlineRow = {
  id: string;
  title: string;
  due_at: string | Date;
  completed_at: string | Date | null;
};

type DocumentRow = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: string;
  document_type: string | null;
  created_at: string | Date;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: Request, { params }: RouteContext) {
  const user = await getMobileUser(request);
  if (!user) return jsonError("Nicht angemeldet.", 401);

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return jsonError("Fall nicht gefunden.", 404);

  const caseResult = await query<CaseRow>(
    `SELECT id, type, status, title, company_name, order_reference,
            amount_cents, currency, incident_date, summary, created_at, updated_at
     FROM cases
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, user.id]
  );

  const currentCase = caseResult.rows[0];
  if (!currentCase) return jsonError("Fall nicht gefunden.", 404);

  const [eventResult, deadlineResult, documentResult] = await Promise.all([
    query<EventRow>(
      `SELECT id, event_type, title, details, occurred_at
       FROM case_events
       WHERE case_id = $1
       ORDER BY occurred_at DESC, created_at DESC`,
      [id]
    ),
    query<DeadlineRow>(
      `SELECT id, title, due_at, completed_at
       FROM case_deadlines
       WHERE case_id = $1
       ORDER BY (completed_at IS NOT NULL), due_at ASC`,
      [id]
    ),
    query<DocumentRow>(
      `SELECT id, original_name, mime_type, size_bytes, document_type, created_at
       FROM case_documents
       WHERE case_id = $1
       ORDER BY created_at DESC`,
      [id]
    )
  ]);

  return NextResponse.json(
    {
      case: {
        id: currentCase.id,
        type: currentCase.type,
        status: currentCase.status,
        title: currentCase.title,
        companyName: currentCase.company_name,
        orderReference: currentCase.order_reference,
        amountCents: currentCase.amount_cents,
        currency: currentCase.currency,
        incidentDate: currentCase.incident_date ? new Date(currentCase.incident_date).toISOString() : null,
        summary: currentCase.summary,
        createdAt: new Date(currentCase.created_at).toISOString(),
        updatedAt: new Date(currentCase.updated_at).toISOString(),
        events: eventResult.rows.map((item) => ({
          id: item.id,
          type: item.event_type,
          title: item.title,
          details: item.details,
          occurredAt: new Date(item.occurred_at).toISOString()
        })),
        deadlines: deadlineResult.rows.map((item) => ({
          id: item.id,
          title: item.title,
          dueAt: new Date(item.due_at).toISOString(),
          completedAt: item.completed_at ? new Date(item.completed_at).toISOString() : null
        })),
        documents: documentResult.rows.map((item) => ({
          id: item.id,
          originalName: item.original_name,
          mimeType: item.mime_type,
          sizeBytes: Number(item.size_bytes),
          documentType: item.document_type,
          createdAt: new Date(item.created_at).toISOString()
        }))
      }
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
