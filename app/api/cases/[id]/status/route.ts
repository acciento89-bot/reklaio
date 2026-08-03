import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { caseStatuses, type CaseStatus } from "@/lib/cases";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function redirectToCase(caseId: string, error?: string) {
  const url = publicUrl(`/faelle/${caseId}`);
  if (error) {
    url.searchParams.set("error", error);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  const rawStatus = String(formData.get("status") ?? "");
  const statusMeta = caseStatuses.find((item) => item.value === rawStatus);

  if (!statusMeta) {
    return redirectToCase(id, "Der gewählte Status ist ungültig.");
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const updateResult = await client.query<{ title: string; status: CaseStatus }>(
      `UPDATE cases
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING title, status`,
      [statusMeta.value, id, user.id]
    );

    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'status_changed', 'Status geändert', $2, NOW())`,
      [id, `Neuer Status: ${statusMeta.label}`]
    );

    await client.query("COMMIT");
    return redirectToCase(id);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Case status update failed", error);
    return redirectToCase(id, "Der Status konnte gerade nicht gespeichert werden.");
  } finally {
    client.release();
  }
}
