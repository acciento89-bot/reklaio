import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, context: { params: Promise<{ taskId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { taskId } = await context.params;
  if (!UUID_PATTERN.test(taskId)) return NextResponse.redirect(publicUrl("/dashboard"), 303);

  const formData = await request.formData();
  const returnToRaw = String(formData.get("returnTo") ?? "/dashboard");
  const returnTo = returnToRaw.startsWith("/") && !returnToRaw.startsWith("//") ? returnToRaw : "/dashboard";
  const client = await getDb().connect();

  try {
    await client.query("BEGIN");
    const updated = await client.query<{ case_id: string; title: string }>(
      `UPDATE case_tasks t
       SET status = 'completed', completed_at = NOW(), updated_at = NOW()
       FROM cases c
       WHERE t.id = $1
         AND t.case_id = c.id
         AND c.user_id = $2
         AND t.status = 'open'
       RETURNING t.case_id, t.title`,
      [taskId, user.id]
    );

    const task = updated.rows[0];
    if (!task) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl(returnTo), 303);
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'task_completed', 'Aufgabe erledigt', $2, NOW())`,
      [task.case_id, task.title]
    );
    await client.query(`UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2`, [task.case_id, user.id]);
    await client.query("COMMIT");

    const url = publicUrl(returnTo);
    url.searchParams.set("notice", "Aufgabe wurde erledigt.");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Task completion failed", error);
    const url = publicUrl(returnTo);
    url.searchParams.set("error", "Die Aufgabe konnte gerade nicht erledigt werden.");
    return NextResponse.redirect(url, 303);
  } finally {
    client.release();
  }
}
