import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { analyzeDocument, getAiModel, isAiConfigured } from "@/lib/ai";
import { AiQuotaError, failAiUsage, reserveAiUsage } from "@/lib/ai-quota";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { resolveStoragePath } from "@/lib/documents";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function redirectToAnalysis(caseId: string, documentId: string, key: "notice" | "error", message: string) {
  const url = publicUrl(`/faelle/${caseId}/dokumente/${documentId}/analyse`);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request, context: { params: Promise<{ id: string; documentId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id: caseId, documentId } = await context.params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(documentId)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  if (formData.get("aiConsent") !== "on") {
    return redirectToAnalysis(caseId, documentId, "error", "Bitte bestätige die freiwillige KI-Verarbeitung für dieses Dokument.");
  }

  if (!isAiConfigured()) {
    return redirectToAnalysis(caseId, documentId, "error", "Die KI-Funktion ist auf diesem Reklaio-System noch nicht eingerichtet.");
  }

  const client = await getDb().connect();
  let reservationId: string | null = null;

  try {
    const documentResult = await client.query<{
      original_name: string;
      storage_key: string;
      mime_type: string;
    }>(
      `SELECT d.original_name, d.storage_key, d.mime_type
       FROM case_documents d
       JOIN cases c ON c.id = d.case_id
       WHERE d.id = $1 AND d.case_id = $2 AND c.user_id = $3
       LIMIT 1`,
      [documentId, caseId, user.id]
    );

    const document = documentResult.rows[0];
    if (!document) return NextResponse.redirect(publicUrl("/dashboard"), 303);

    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(document.mime_type)) {
      return redirectToAnalysis(caseId, documentId, "error", "Für die KI-Analyse werden derzeit PDF, JPEG, PNG und WebP unterstützt.");
    }

    const bytes = new Uint8Array(await fs.readFile(resolveStoragePath(document.storage_key)));
    const consentAt = new Date();

    reservationId = await reserveAiUsage({
      user,
      operation: "document_analysis",
      caseId,
      documentId,
      modelName: getAiModel(),
      consentAt,
      inputBytes: bytes.byteLength,
      metadata: { fileName: document.original_name, mimeType: document.mime_type }
    });

    const result = await analyzeDocument({
      bytes,
      mimeType: document.mime_type,
      fileName: document.original_name
    });

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO document_ai_analyses (
         document_id, case_id, user_id, provider, model_name,
         response_id, consent_at, result_json
       ) VALUES ($1, $2, $3, 'openai', $4, $5, $6, $7::jsonb)`,
      [documentId, caseId, user.id, result.model, result.responseId, consentAt, JSON.stringify(result.data)]
    );
    await client.query(
      `UPDATE ai_usage_events
       SET status = 'completed', response_id = $2, completed_at = NOW(),
           metadata_json = metadata_json || $3::jsonb
       WHERE id = $1`,
      [reservationId, result.responseId, JSON.stringify({ overallConfidence: result.data.overallConfidence })]
    );
    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'document_ai_analyzed', 'Dokument mit KI analysiert', $2, NOW())`,
      [caseId, `${document.original_name} · Modell: ${result.model} · Ergebnis muss geprüft werden`]
    );
    await client.query("UPDATE cases SET updated_at = NOW() WHERE id = $1 AND user_id = $2", [caseId, user.id]);
    await client.query("COMMIT");

    return redirectToAnalysis(caseId, documentId, "notice", "Analyse erstellt. Bitte prüfe jeden Wert, bevor du etwas übernimmst.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (reservationId) await failAiUsage(reservationId, error instanceof Error ? error.message : "UNKNOWN").catch(() => undefined);
    console.error("Document AI analysis failed", error);

    if (error instanceof AiQuotaError) {
      return redirectToAnalysis(caseId, documentId, "error", error.message);
    }

    const message = error instanceof Error && error.message === "AI_FILE_TYPE_UNSUPPORTED"
      ? "Dieser Dateityp wird von der KI-Analyse nicht unterstützt."
      : "Die KI-Analyse konnte gerade nicht abgeschlossen werden.";
    return redirectToAnalysis(caseId, documentId, "error", message);
  } finally {
    client.release();
  }
}
