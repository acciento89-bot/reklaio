import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function deadlineTitle(type: string) {
  switch (type) {
    case "refund_missing": return "Zahlungsfrist";
    case "delivery_missing": return "Frist zur Lieferung oder Klärung";
    case "product_problem": return "Frist zur Mangelbeseitigung";
    case "cancellation_ignored": return "Frist zur Kündigungsbestätigung";
    default: return "Antwortfrist";
  }
}

function caseRedirect(caseId: string, key: "notice" | "error", message: string) {
  const url = publicUrl(`/faelle/${caseId}`);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, 303);
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return NextResponse.redirect(publicUrl("/dashboard"), 303);

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const caseResult = await client.query<{ type: string }>(
      `SELECT type FROM cases WHERE id = $1 AND user_id = $2 LIMIT 1 FOR UPDATE`,
      [id, user.id]
    );

    const currentCase = caseResult.rows[0];
    if (!currentCase) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    const openDeadlineResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM case_deadlines WHERE case_id = $1 AND completed_at IS NULL`,
      [id]
    );

    if (Number(openDeadlineResult.rows[0]?.count ?? 0) > 0) {
      await client.query("ROLLBACK");
      return caseRedirect(id, "notice", "Für diesen Fall besteht bereits eine offene Frist.");
    }

    const title = deadlineTitle(currentCase.type);
    const inserted = await client.query<{ due_date: string }>(
      `INSERT INTO case_deadlines (case_id, title, due_at)
       VALUES ($1, $2, ((CURRENT_DATE + 7)::date + time '23:59:59') AT TIME ZONE 'Europe/Berlin')
       RETURNING TO_CHAR(due_at AT TIME ZONE 'Europe/Berlin', 'DD.MM.YYYY') AS due_date`,
      [id, title]
    );

    const dueDate = inserted.rows[0]?.due_date ?? "in sieben Tagen";

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'assistant_deadline_created', '7-Tage-Frist automatisch angelegt', $2, NOW())`,
      [id, `${title}: ${dueDate}`]
    );

    await client.query(`UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2`, [id, user.id]);
    await client.query("COMMIT");
    return caseRedirect(id, "notice", `${title} bis ${dueDate} wurde angelegt.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Assistant deadline creation failed", error);
    return caseRedirect(id, "error", "Die empfohlene Frist konnte gerade nicht angelegt werden.");
  } finally {
    client.release();
  }
}
