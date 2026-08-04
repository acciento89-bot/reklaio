import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ deadlineId: string }>;
};

function redirectToDeadlines(error?: string) {
  const url = publicUrl("/fristen");
  if (error) {
    url.searchParams.set("error", error);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { deadlineId } = await params;
  if (!UUID_PATTERN.test(deadlineId)) {
    return redirectToDeadlines("Die Frist wurde nicht gefunden.");
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{ case_id: string; title: string }>(
      `UPDATE case_deadlines AS d
       SET completed_at = NOW()
       FROM cases AS c
       WHERE d.id = $1
         AND d.case_id = c.id
         AND c.user_id = $2
         AND d.completed_at IS NULL
       RETURNING d.case_id, d.title`,
      [deadlineId, user.id]
    );

    const completedDeadline = result.rows[0];
    if (!completedDeadline) {
      await client.query("ROLLBACK");
      return redirectToDeadlines("Die Frist wurde nicht gefunden oder war bereits erledigt.");
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'deadline_completed', 'Frist erledigt', $2, NOW())`,
      [completedDeadline.case_id, completedDeadline.title]
    );

    await client.query(
      `UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [completedDeadline.case_id, user.id]
    );

    await client.query("COMMIT");
    return redirectToDeadlines();
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Deadline completion from overview failed", error);
    return redirectToDeadlines("Die Frist konnte gerade nicht erledigt werden.");
  } finally {
    client.release();
  }
}
