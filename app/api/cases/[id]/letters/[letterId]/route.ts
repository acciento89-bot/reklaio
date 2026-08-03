import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const updateSchema = z.object({
  subject: z.string().trim().min(3).max(240),
  body: z.string().trim().min(20).max(20000)
});

type RouteContext = {
  params: Promise<{ id: string; letterId: string }>;
};

function redirectToLetter(caseId: string, letterId: string, values: Record<string, string>) {
  const url = publicUrl(`/faelle/${caseId}/schreiben/${letterId}`);
  for (const [key, value] of Object.entries(values)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id: caseId, letterId } = await params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(letterId)) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  const formData = await request.formData();
  const parsed = updateSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body")
  });

  if (!parsed.success) {
    return redirectToLetter(caseId, letterId, {
      error: "Bitte prüfe Betreff und Nachricht."
    });
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{ id: string }>(
      `UPDATE generated_letters AS l
       SET subject = $1,
           body = $2
       FROM cases AS c
       WHERE l.id = $3
         AND l.case_id = $4
         AND c.id = l.case_id
         AND c.user_id = $5
       RETURNING l.id`,
      [parsed.data.subject, parsed.data.body, letterId, caseId, user.id]
    );

    if (!result.rows[0]) {
      await client.query("ROLLBACK");
      return new Response("Nicht gefunden", { status: 404 });
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'letter_updated', 'Schreiben aktualisiert', $2, NOW())`,
      [caseId, parsed.data.subject]
    );

    await client.query("COMMIT");
    return redirectToLetter(caseId, letterId, { saved: "1" });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Letter update failed", error);
    return redirectToLetter(caseId, letterId, {
      error: "Die Änderungen konnten gerade nicht gespeichert werden."
    });
  } finally {
    client.release();
  }
}
