import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const eventSchema = z.object({
  title: z.string().trim().min(2).max(180),
  details: z.string().trim().max(4000).optional().default(""),
  occurredAt: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)]).optional().default("")
});

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
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    details: formData.get("details"),
    occurredAt: formData.get("occurredAt")
  });

  if (!parsed.success) {
    return redirectToCase(id, "Bitte prüfe den Chronik-Eintrag.");
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const insertResult = await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       SELECT c.id, 'manual_note', $3, NULLIF($4, ''),
              COALESCE(NULLIF($5, '')::timestamp AT TIME ZONE 'Europe/Berlin', NOW())
       FROM cases c
       WHERE c.id = $1 AND c.user_id = $2
       RETURNING id`,
      [id, user.id, parsed.data.title, parsed.data.details, parsed.data.occurredAt]
    );

    if (insertResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    await client.query(
      `UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    await client.query("COMMIT");
    return redirectToCase(id);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Case event creation failed", error);
    return redirectToCase(id, "Der Chronik-Eintrag konnte gerade nicht gespeichert werden.");
  } finally {
    client.release();
  }
}
