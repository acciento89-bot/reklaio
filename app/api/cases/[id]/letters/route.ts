import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getLetterKindLabel, isLetterKind } from "@/lib/letters";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const letterSchema = z.object({
  kind: z.string().trim(),
  subject: z.string().trim().min(3).max(240),
  body: z.string().trim().min(20).max(20000)
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

function errorRedirect(caseId: string, message: string) {
  const url = publicUrl(`/faelle/${caseId}/schreiben/neu`);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(publicUrl("/anmelden"), 303);
  }

  const { id: caseId } = await params;
  if (!UUID_PATTERN.test(caseId)) {
    return new Response("Nicht gefunden", { status: 404 });
  }

  const formData = await request.formData();
  const parsed = letterSchema.safeParse({
    kind: formData.get("kind"),
    subject: formData.get("subject"),
    body: formData.get("body")
  });

  if (!parsed.success || !isLetterKind(parsed.data.kind)) {
    return errorRedirect(caseId, "Bitte prüfe Vorlage, Betreff und Nachricht.");
  }

  const db = getDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const ownerResult = await client.query<{ id: string }>(
      `SELECT id
       FROM cases
       WHERE id = $1 AND user_id = $2
       LIMIT 1`,
      [caseId, user.id]
    );

    if (!ownerResult.rows[0]) {
      await client.query("ROLLBACK");
      return new Response("Nicht gefunden", { status: 404 });
    }

    const result = await client.query<{ id: string }>(
      `INSERT INTO generated_letters (case_id, kind, subject, body, model_name)
       VALUES ($1, $2, $3, $4, NULL)
       RETURNING id`,
      [caseId, parsed.data.kind, parsed.data.subject, parsed.data.body]
    );

    const letterId = result.rows[0].id;
    const kindLabel = getLetterKindLabel(parsed.data.kind);

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'letter_created', 'Schreiben erstellt', $2, NOW())`,
      [caseId, `${kindLabel}: ${parsed.data.subject}`]
    );

    await client.query("COMMIT");
    return NextResponse.redirect(publicUrl(`/faelle/${caseId}/schreiben/${letterId}`), 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Letter creation failed", error);
    return errorRedirect(caseId, "Das Schreiben konnte gerade nicht gespeichert werden.");
  } finally {
    client.release();
  }
}
