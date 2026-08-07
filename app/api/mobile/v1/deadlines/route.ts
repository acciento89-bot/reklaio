import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

type DeadlineState = "overdue" | "soon" | "open" | "completed";

type MobileDeadlineRow = {
  id: string;
  case_id: string;
  case_title: string;
  company_name: string | null;
  title: string;
  due_at: string | Date;
  completed_at: string | Date | null;
  deadline_state: DeadlineState;
};

export async function GET(request: Request) {
  const user = await getMobileUser(request);
  if (!user) {
    return NextResponse.json(
      { error: "Nicht angemeldet." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const result = await query<MobileDeadlineRow>(
    `SELECT
       d.id,
       d.case_id,
       c.title AS case_title,
       c.company_name,
       d.title,
       d.due_at,
       d.completed_at,
       CASE
         WHEN d.completed_at IS NOT NULL THEN 'completed'
         WHEN d.due_at < NOW() THEN 'overdue'
         WHEN d.due_at <= NOW() + INTERVAL '7 days' THEN 'soon'
         ELSE 'open'
       END AS deadline_state
     FROM case_deadlines d
     JOIN cases c ON c.id = d.case_id
     WHERE c.user_id = $1
     ORDER BY
       CASE WHEN d.completed_at IS NULL THEN 0 ELSE 1 END,
       d.due_at ASC,
       d.created_at DESC`,
    [user.id]
  );

  return NextResponse.json(
    {
      deadlines: result.rows.map((item) => ({
        id: item.id,
        caseId: item.case_id,
        caseTitle: item.case_title,
        companyName: item.company_name,
        title: item.title,
        dueAt: new Date(item.due_at).toISOString(),
        completedAt: item.completed_at ? new Date(item.completed_at).toISOString() : null,
        state: item.deadline_state
      }))
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
