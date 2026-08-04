import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function redirectToAnalysis(caseId: string, documentId: string, key: "notice" | "error", message: string) {
  const url = publicUrl(`/faelle/${caseId}/dokumente/${documentId}/analyse`);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, context: { params: Promise<{ id: string; documentId: string; analysisId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id: caseId, documentId, analysisId } = await context.params;
  if (![caseId, documentId, analysisId].every((value) => UUID_PATTERN.test(value))) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  if (String(formData.get("confirmation") ?? "").trim() !== "LÖSCHEN") {
    return redirectToAnalysis(caseId, documentId, "error", "Bitte gib zur Bestätigung exakt LÖSCHEN ein.");
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");
    const result = await client.query<{ response_id: string | null; original_name: string }>(
      `SELECT a.response_id, d.original_name
       FROM document_ai_analyses a
       JOIN case_documents d ON d.id = a.document_id
       JOIN cases c ON c.id = a.case_id
       WHERE a.id = $1
         AND a.document_id = $2
         AND a.case_id = $3
         AND a.user_id = $4
         AND c.user_id = $4
       LIMIT 1
       FOR UPDATE`,
      [analysisId, documentId, caseId, user.id]
    );
    const analysis = result.rows[0];
    if (!analysis) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    await client.query(
      `DELETE FROM document_ai_analyses
       WHERE id = $1 AND user_id = $2`,
      [analysisId, user.id]
    );

    if (analysis.response_id) {
      await client.query(
        `DELETE FROM ai_usage_events
         WHERE user_id = $1
           AND document_id = $2
           AND operation = 'document_analysis'
           AND response_id = $3`,
        [user.id, documentId, analysis.response_id]
      );
    }

    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'document_ai_analysis_deleted', 'KI-Analyse gelöscht', $2, NOW())`,
      [caseId, analysis.original_name]
    );
    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2", [caseId, user.id]);
    await client.query("COMMIT");

    return redirectToAnalysis(caseId, documentId, "notice", "Das gespeicherte KI-Analyseergebnis wurde gelöscht.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Deleting AI document analysis failed", error);
    return redirectToAnalysis(caseId, documentId, "error", "Das Analyseergebnis konnte gerade nicht gelöscht werden.");
  } finally {
    client.release();
  }
}
