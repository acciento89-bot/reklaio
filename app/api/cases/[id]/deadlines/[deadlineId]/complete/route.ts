import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeReturnPath(value: string, caseId: string) {
  return value === "/fristen" ? "/fristen" : `/faelle/${caseId}`;
}

function redirectAfterCompletion(pathname: string, error?: string) {
  const url = publicUrl(pathname);
  if (error) {
    url.searchParams.set("error", error);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; deadlineId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id, deadlineId } = await context.params;
  if (!UUID_PATTERN.test(id) || !UUID_PATTERN.test(deadlineId)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  const returnPath = safeReturnPath(String(formData.get("returnTo") ?? ""), id);
  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{ title: string }>(
      `UPDATE case_deadlines d
       SET completed_at = NOW()
       FROM cases c
       WHERE d.id = $1
         AND d.case_id = c.id
         AND c.id = $2
         AND c.user_id = $3
         AND d.completed_at IS NULL
       RETURNING d.title`,
      [deadlineId, id, user.id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return redirectAfterCompletion(returnPath, "Die Frist wurde nicht gefunden oder ist bereits erledigt.");
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'deadline_completed', 'Frist erledigt', $2, NOW())`,
      [id, result.rows[0].title]
    );

    await client.query(
      `UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    await client.query("COMMIT");
    return redirectAfterCompletion(returnPath);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Case deadline completion failed", error);
    return redirectAfterCompletion(returnPath, "Die Frist konnte gerade nicht abgeschlossen werden.");
  } finally {
    client.release();
  }
}
