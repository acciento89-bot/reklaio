import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";
import { parseOptionalDateTimeLocal, taskPriorities } from "@/lib/workflow";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const priorityValues = taskPriorities.map((item) => item.value) as [string, ...string[]];
const schema = z.object({
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(3000).optional(),
  priority: z.enum(priorityValues)
});

function redirect(caseId: string, key?: "notice" | "error", message?: string) {
  const url = publicUrl(`/faelle/${caseId}/steuerung`);
  if (key && message) url.searchParams.set(key, message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return NextResponse.redirect(publicUrl("/dashboard"), 303);

  const formData = await request.formData();
  const parsed = schema.safeParse({
    title: formData.get("title"),
    description: String(formData.get("description") ?? "").trim() || undefined,
    priority: formData.get("priority")
  });

  let dueAt: string | null;
  try {
    dueAt = parseOptionalDateTimeLocal(formData.get("dueAt"));
  } catch {
    return redirect(id, "error", "Bitte gib ein gültiges Fälligkeitsdatum ein.");
  }

  if (!parsed.success) return redirect(id, "error", "Bitte prüfe Titel und Priorität der Aufgabe.");

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO case_tasks (case_id, title, description, priority, source, due_at)
       SELECT c.id, $3, $4, $5, 'manual',
              CASE WHEN $6::text IS NULL THEN NULL ELSE $6::timestamp AT TIME ZONE 'Europe/Berlin' END
       FROM cases c
       WHERE c.id = $1 AND c.user_id = $2
       RETURNING id`,
      [id, user.id, parsed.data.title, parsed.data.description ?? null, parsed.data.priority, dueAt]
    );

    if (inserted.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'task_created', 'Aufgabe angelegt', $2, NOW())`,
      [id, parsed.data.title]
    );
    await client.query(`UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2`, [id, user.id]);
    await client.query("COMMIT");
    return redirect(id, "notice", "Aufgabe wurde angelegt.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Case task creation failed", error);
    return redirect(id, "error", "Die Aufgabe konnte gerade nicht gespeichert werden.");
  } finally {
    client.release();
  }
}
