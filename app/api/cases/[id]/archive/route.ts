import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
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

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{ title: string }>(
      `UPDATE cases
       SET status = 'closed', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status <> 'closed'
       RETURNING title`,
      [id, user.id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return redirectToCase(id, "Der Fall ist bereits archiviert oder wurde nicht gefunden.");
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'case_archived', 'Fall archiviert', 'Der Fall wurde geschlossen und ins Archiv verschoben.', NOW())`,
      [id]
    );

    await client.query("COMMIT");
    return redirectToCase(id);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Case archive failed", error);
    return redirectToCase(id, "Der Fall konnte gerade nicht archiviert werden.");
  } finally {
    client.release();
  }
}
