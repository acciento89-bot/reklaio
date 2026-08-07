import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const deadlineSchema = z.object({
  title: z.string().trim().min(2).max(180),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getMobileUser(request);
  if (!user) return jsonError("Nicht angemeldet.", 401);

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return jsonError("Fallakte nicht gefunden.", 404);

  const payload = await request.json().catch(() => null);
  const parsed = deadlineSchema.safeParse(payload);
  if (!parsed.success) return jsonError("Bitte gib eine gültige Frist ein.", 400);

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const insertResult = await client.query<{ id: string; title: string; due_at: string | Date }>(
      `INSERT INTO case_deadlines (case_id, title, due_at)
       SELECT c.id, $3, ($4::date + time '23:59:59') AT TIME ZONE 'Europe/Berlin'
       FROM cases c
       WHERE c.id = $1 AND c.user_id = $2
       RETURNING id, title, due_at`,
      [id, user.id, parsed.data.title, parsed.data.dueDate]
    );

    if (insertResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return jsonError("Fallakte nicht gefunden.", 404);
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'deadline_created', 'Frist hinzugefügt', $2, NOW())`,
      [id, `${parsed.data.title}: ${parsed.data.dueDate}`]
    );
    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1", [id]);
    await client.query("COMMIT");

    const deadline = insertResult.rows[0];
    return NextResponse.json(
      {
        deadline: {
          id: deadline.id,
          title: deadline.title,
          dueAt: new Date(deadline.due_at).toISOString(),
          completedAt: null
        }
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Mobile deadline creation failed", error);
    return jsonError("Die Frist konnte gerade nicht gespeichert werden.", 500);
  } finally {
    client.release();
  }
}
