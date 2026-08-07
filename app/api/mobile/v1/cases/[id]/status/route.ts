import { NextResponse } from "next/server";
import { caseStatuses, type CaseStatus } from "@/lib/cases";
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getMobileUser(request);
  if (!user) return jsonError("Nicht angemeldet.", 401);

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return jsonError("Fallakte nicht gefunden.", 404);

  const payload = await request.json().catch(() => null) as { status?: unknown } | null;
  const rawStatus = typeof payload?.status === "string" ? payload.status : "";
  const statusMeta = caseStatuses.find((item) => item.value === rawStatus);
  if (!statusMeta) return jsonError("Der gewählte Status ist ungültig.", 400);

  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const updateResult = await client.query<{ status: CaseStatus }>(
      `UPDATE cases
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING status`,
      [statusMeta.value, id, user.id]
    );

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return jsonError("Fallakte nicht gefunden.", 404);
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'status_changed', 'Status geändert', $2, NOW())`,
      [id, `Neuer Status: ${statusMeta.label}`]
    );
    await client.query("COMMIT");

    return NextResponse.json(
      { status: updateResult.rows[0].status },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Mobile case status update failed", error);
    return jsonError("Der Status konnte gerade nicht gespeichert werden.", 500);
  } finally {
    client.release();
  }
}
