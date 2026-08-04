import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_request: Request, context: { params: Promise<{ id: string; letterId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id: caseId, letterId } = await context.params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(letterId)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");
    const result = await client.query<{
      kind: string;
      subject: string | null;
      body: string;
      model_name: string | null;
    }>(
      `SELECT l.kind, l.subject, l.body, l.model_name
       FROM generated_letters l
       JOIN cases c ON c.id = l.case_id
       WHERE l.id = $1 AND l.case_id = $2 AND c.user_id = $3
       LIMIT 1
       FOR UPDATE`,
      [letterId, caseId, user.id]
    );
    const source = result.rows[0];
    if (!source) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    const subject = `Kopie – ${source.subject || "Schreiben ohne Betreff"}`.slice(0, 240);
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO generated_letters (
         case_id, kind, subject, body, model_name, generation_mode
       ) VALUES ($1, $2, $3, $4, $5, 'duplicate')
       RETURNING id`,
      [caseId, source.kind, subject, source.body, source.model_name]
    );
    const newLetterId = inserted.rows[0]!.id;

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'letter_duplicated', 'Schreiben dupliziert', $2, NOW())`,
      [caseId, subject]
    );
    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2", [caseId, user.id]);
    await client.query("COMMIT");

    const url = publicUrl(`/faelle/${caseId}/schreiben/${newLetterId}`);
    url.searchParams.set("duplicated", "1");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Letter duplication failed", error);
    const url = publicUrl(`/faelle/${caseId}/schreiben/${letterId}`);
    url.searchParams.set("error", "Das Schreiben konnte gerade nicht dupliziert werden.");
    return NextResponse.redirect(url, 303);
  } finally {
    client.release();
  }
}
