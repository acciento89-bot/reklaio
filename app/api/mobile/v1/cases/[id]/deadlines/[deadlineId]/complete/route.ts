import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; deadlineId: string }> }
) {
  const user = await getMobileUser(request);
  if (!user) return jsonError("Nicht angemeldet.", 401);

  const { id, deadlineId } = await context.params;
  if (!UUID_PATTERN.test(id) || !UUID_PATTERN.test(deadlineId)) {
    return jsonError("Frist nicht gefunden.", 404);
  }

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ title: string; completed_at: string | Date }>(
      `UPDATE case_deadlines d
       SET completed_at = NOW()
       FROM cases c
       WHERE d.id = $1
         AND d.case_id = c.id
         AND c.id = $2
         AND c.user_id = $3
         AND d.completed_at IS NULL
       RETURNING d.title, d.completed_at`,
      [deadlineId, id, user.id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return jsonError("Die Frist wurde nicht gefunden oder ist bereits erledigt.", 404);
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'deadline_completed', 'Frist erledigt', $2, NOW())`,
      [id, result.rows[0].title]
    );
    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1", [id]);
    await client.query("COMMIT");

    return NextResponse.json(
      { completedAt: new Date(result.rows[0].completed_at).toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Mobile deadline completion failed", error);
    return jsonError("Die Frist konnte gerade nicht abgeschlossen werden.", 500);
  } finally {
    client.release();
  }
}
