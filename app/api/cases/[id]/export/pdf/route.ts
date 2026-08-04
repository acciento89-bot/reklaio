import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getCaseStatus
} from "@/lib/cases";
import { getCaseTypeByValue } from "@/lib/case-types";
import { createCasePdf } from "@/lib/case-pdf";
import { query } from "@/lib/db";
import { formatFileSize, getDocumentTypeLabel } from "@/lib/documents";
import { getLetterKindLabel } from "@/lib/letters";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  title: string;
  details: string | null;
  occurred_at: string | Date;
};

type DeadlineRow = {
  title: string;
  due_at: string | Date;
  completed_at: string | Date | null;
};

type LetterRow = {
  kind: string;
  subject: string | null;
  body: string;
  created_at: string | Date;
};

type DocumentRow = {
  original_name: string;
  size_bytes: string;
  document_type: string | null;
  created_at: string | Date;
};

function deadlineStatus(deadline: DeadlineRow) {
  if (deadline.completed_at) {
    return "Erledigt";
  }

  const dueAt = new Date(deadline.due_at).getTime();
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (dueAt < now) {
    return "Überfällig";
  }

  if (dueAt <= now + sevenDays) {
    return "Bald fällig";
  }

  return "Offen";
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  try {
    const caseResult = await query<CaseRow>(
      `SELECT
         id,
         type,
         status,
         title,
         company_name,
         order_reference,
         amount_cents,
         currency,
         incident_date,
         summary,
         created_at,
         updated_at
       FROM cases
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [id, user.id]
    );

    const currentCase = caseResult.rows[0];
    if (!currentCase) {
      return new Response("Nicht gefunden", { status: 404 });
    }

    const [eventResult, deadlineResult, letterResult, documentResult] = await Promise.all([
      query<EventRow>(
        `SELECT title, details, occurred_at
         FROM case_events
         WHERE case_id = $1
         ORDER BY occurred_at ASC, created_at ASC`,
        [id]
      ),
      query<DeadlineRow>(
        `SELECT title, due_at, completed_at
         FROM case_deadlines
         WHERE case_id = $1
         ORDER BY (completed_at IS NOT NULL), due_at ASC`,
        [id]
      ),
      query<LetterRow>(
        `SELECT kind, subject, body, created_at
         FROM generated_letters
         WHERE case_id = $1
         ORDER BY created_at ASC`,
        [id]
      ),
      query<DocumentRow>(
        `SELECT original_name, size_bytes, document_type, created_at
         FROM case_documents
         WHERE case_id = $1
         ORDER BY created_at ASC`,
        [id]
      )
    ]);

    const caseType = getCaseTypeByValue(currentCase.type);
    const status = getCaseStatus(currentCase.status);
    const owner = user.displayName || user.email;

    const pdf = createCasePdf({
      title: currentCase.title,
      subtitle: caseType?.title ?? "Verbraucherfall",
      generatedAt: formatDateTime(new Date()),
      owner,
      facts: [
        { label: "Status", value: status.label },
        { label: "Fallart", value: caseType?.title ?? currentCase.type },
        { label: "Anbieter", value: currentCase.company_name || "-" },
        { label: "Referenz", value: currentCase.order_reference || "-" },
        { label: "Betrag", value: formatCurrency(currentCase.amount_cents, currentCase.currency) },
        { label: "Vorfallsdatum", value: formatDate(currentCase.incident_date) },
        { label: "Angelegt", value: formatDateTime(currentCase.created_at) },
        { label: "Zuletzt geändert", value: formatDateTime(currentCase.updated_at) }
      ],
      summary: currentCase.summary || "Noch keine Zusammenfassung erfasst.",
      timeline: eventResult.rows.map((event) => ({
        date: formatDateTime(event.occurred_at),
        title: event.title,
        details: event.details
      })),
      deadlines: deadlineResult.rows.map((deadline) => ({
        title: deadline.title,
        dueDate: formatDate(deadline.due_at),
        status: deadlineStatus(deadline),
        completedDate: deadline.completed_at ? formatDateTime(deadline.completed_at) : null
      })),
      letters: letterResult.rows.map((letter) => ({
        kind: getLetterKindLabel(letter.kind),
        subject: letter.subject || "Schreiben ohne Betreff",
        createdAt: formatDateTime(letter.created_at),
        body: letter.body
      })),
      documents: documentResult.rows.map((document) => ({
        name: document.original_name,
        type: getDocumentTypeLabel(document.document_type),
        size: formatFileSize(document.size_bytes),
        createdAt: formatDateTime(document.created_at)
      }))
    });

    const fileName = `reklaio-fall-${id.slice(0, 8)}.pdf`;

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Case PDF export failed", error);
    return new Response("Die PDF konnte gerade nicht erstellt werden.", { status: 500 });
  }
}
