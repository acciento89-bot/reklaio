import { NextResponse } from "next/server";
import { z } from "zod";
import { getCaseTypeBySlug } from "@/lib/case-types";
import { parseAmountCents } from "@/lib/cases";
import { getDb, query } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

type MobileCaseRow = {
  id: string;
  type: string;
  status: string;
  title: string;
  company_name: string | null;
  amount_cents: number | null;
  currency: string;
  updated_at: string | Date;
  next_due_at: string | Date | null;
  document_count: number;
};

const caseSchema = z.object({
  type: z.string().trim(),
  title: z.string().trim().min(3).max(140),
  companyName: z.string().trim().max(160).optional().default(""),
  orderReference: z.string().trim().max(120).optional().default(""),
  amount: z.string().trim().max(32).optional().default(""),
  incidentDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().default(""),
  summary: z.string().trim().max(5000).optional().default("")
});

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return jsonError("Nicht angemeldet.", 401);

  const result = await query<MobileCaseRow>(
    `SELECT
       c.id,
       c.type,
       c.status,
       c.title,
       c.company_name,
       c.amount_cents,
       c.currency,
       c.updated_at,
       (SELECT MIN(d.due_at)
        FROM case_deadlines d
        WHERE d.case_id = c.id AND d.completed_at IS NULL) AS next_due_at,
       (SELECT COUNT(*)::int
        FROM case_documents d
        WHERE d.case_id = c.id) AS document_count
     FROM cases c
     WHERE c.user_id = $1
     ORDER BY
       CASE WHEN c.status IN ('resolved', 'closed') THEN 1 ELSE 0 END,
       c.updated_at DESC`,
    [user.id]
  );

  return NextResponse.json(
    {
      cases: result.rows.map((item) => ({
        id: item.id,
        type: item.type,
        status: item.status,
        title: item.title,
        companyName: item.company_name,
        amountCents: item.amount_cents,
        currency: item.currency,
        updatedAt: new Date(item.updated_at).toISOString(),
        nextDueAt: item.next_due_at ? new Date(item.next_due_at).toISOString() : null,
        documentCount: item.document_count
      }))
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const user = await getMobileUser(request);
  if (!user) return jsonError("Nicht angemeldet.", 401);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonError("Ungültige Anfrage.", 400);
  }

  const parsed = caseSchema.safeParse(input);
  if (!parsed.success) return jsonError("Bitte prüfe deine Angaben.", 400);

  const caseType = getCaseTypeBySlug(parsed.data.type);
  if (!caseType) return jsonError("Bitte wähle eine gültige Fallart.", 400);

  let amountCents: number | null;
  try {
    amountCents = parseAmountCents(parsed.data.amount);
  } catch {
    return jsonError("Der Betrag ist ungültig. Beispiel: 129,90", 400);
  }

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");

    const result = await client.query<{ id: string }>(
      `INSERT INTO cases (
         user_id, type, status, title, company_name, order_reference,
         amount_cents, currency, incident_date, summary
       )
       VALUES ($1, $2, 'collecting_evidence', $3, NULLIF($4, ''), NULLIF($5, ''), $6, 'EUR', NULLIF($7, '')::date, NULLIF($8, ''))
       RETURNING id`,
      [
        user.id,
        caseType.dbValue,
        parsed.data.title,
        parsed.data.companyName,
        parsed.data.orderReference,
        amountCents,
        parsed.data.incidentDate,
        parsed.data.summary
      ]
    );

    const caseId = result.rows[0].id;
    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'case_created', 'Fall angelegt', 'Der Fall wurde in Reklaio erstellt.', NOW())`,
      [caseId]
    );

    await client.query("COMMIT");
    return NextResponse.json(
      { case: { id: caseId } },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Mobile case creation failed", error);
    return jsonError("Der Fall konnte gerade nicht gespeichert werden.", 500);
  } finally {
    client.release();
  }
}
