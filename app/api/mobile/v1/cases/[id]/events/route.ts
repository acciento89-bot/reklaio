import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getMobileUser } from "@/lib/mobile-auth";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const eventSchema = z.object({
  title: z.string().trim().min(2).max(180),
  details: z.string().trim().max(4000).optional().default(""),
  occurredAt: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)]).optional().default("")
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
  const parsed = eventSchema.safeParse(payload);
  if (!parsed.success) return jsonError("Bitte prüfe den Chronik-Eintrag.", 400);

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const insertResult = await client.query<{
      id: string;
      event_type: string;
      title: string;
      details: string | null;
      occurred_at: string | Date;
    }>(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       SELECT c.id, 'manual_note', $3, NULLIF($4, ''),
              COALESCE(NULLIF($5, '')::timestamp AT TIME ZONE 'Europe/Berlin', NOW())
       FROM cases c
       WHERE c.id = $1 AND c.user_id = $2
       RETURNING id, event_type, title, details, occurred_at`,
      [id, user.id, parsed.data.title, parsed.data.details, parsed.data.occurredAt]
    );

    if (insertResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return jsonError("Fallakte nicht gefunden.", 404);
    }

    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1", [id]);
    await client.query("COMMIT");

    const event = insertResult.rows[0];
    return NextResponse.json(
      {
        event: {
          id: event.id,
          type: event.event_type,
          title: event.title,
          details: event.details,
          occurredAt: new Date(event.occurred_at).toISOString()
        }
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Mobile timeline entry creation failed", error);
    return jsonError("Der Chronik-Eintrag konnte gerade nicht gespeichert werden.", 500);
  } finally {
    client.release();
  }
}
