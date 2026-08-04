import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function redirectToLetter(caseId: string, letterId: string, message: string) {
  const url = publicUrl(`/faelle/${caseId}/schreiben/${letterId}`);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, context: { params: Promise<{ id: string; letterId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id: caseId, letterId } = await context.params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(letterId)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  if (String(formData.get("confirmation") ?? "").trim() !== "LÖSCHEN") {
    return redirectToLetter(caseId, letterId, "Bitte gib zur Bestätigung exakt LÖSCHEN ein.");
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");
    const result = await client.query<{ subject: string | null; delivery_count: number }>(
      `SELECT l.subject,
              (SELECT COUNT(*)::int FROM letter_email_deliveries d WHERE d.letter_id = l.id) AS delivery_count
       FROM generated_letters l
       JOIN cases c ON c.id = l.case_id
       WHERE l.id = $1 AND l.case_id = $2 AND c.user_id = $3
       LIMIT 1
       FOR UPDATE`,
      [letterId, caseId, user.id]
    );
    const letter = result.rows[0];
    if (!letter) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    await client.query(
      `DELETE FROM generated_letters
       WHERE id = $1 AND case_id = $2`,
      [letterId, caseId]
    );
    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'letter_deleted', 'Schreiben gelöscht', $2, NOW())`,
      [
        caseId,
        `${letter.subject || "Schreiben ohne Betreff"} · frühere Versandvorgänge: ${letter.delivery_count}. Bereits versendete E-Mails können nicht zurückgerufen werden.`
      ]
    );
    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2", [caseId, user.id]);
    await client.query("COMMIT");

    const url = publicUrl(`/faelle/${caseId}`);
    url.searchParams.set("notice", "Schreiben gelöscht. Bereits versendete E-Mails bleiben beim Empfänger bestehen.");
    return NextResponse.redirect(url, 303);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Letter deletion failed", error);
    return redirectToLetter(caseId, letterId, "Das Schreiben konnte gerade nicht gelöscht werden.");
  } finally {
    client.release();
  }
}
