import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Nicht angemeldet." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

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
