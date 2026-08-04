import { NextResponse } from "next/server";
import { documentAnalysisSchema } from "@/lib/ai";
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

export async function POST(request: Request, context: { params: Promise<{ id: string; documentId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  const { id: caseId, documentId } = await context.params;
  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(documentId)) {
    return NextResponse.redirect(publicUrl("/dashboard"), 303);
  }

  const formData = await request.formData();
  const analysisId = String(formData.get("analysisId") ?? "");
  if (!UUID_PATTERN.test(analysisId)) {
    return redirectToAnalysis(caseId, documentId, "error", "Die ausgewählte Analyse ist ungültig.");
  }

  const selected = new Set(formData.getAll("fields").map(String));
  if (selected.size === 0) {
    return redirectToAnalysis(caseId, documentId, "error", "Wähle mindestens einen geprüften Wert aus.");
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query<{ result_json: unknown; original_name: string }>(
      `SELECT a.result_json, d.original_name
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

    const row = result.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return NextResponse.redirect(publicUrl("/dashboard"), 303);
    }

    const analysis = documentAnalysisSchema.parse(row.result_json);
    const updates: string[] = [];
    const values: unknown[] = [caseId, user.id];
    const appliedLabels: string[] = [];

    function addUpdate(column: string, value: unknown, label: string) {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
      appliedLabels.push(label);
    }

    if (selected.has("companyName") && analysis.companyName) {
      addUpdate("company_name", analysis.companyName, "Anbieter");
    }

    if (selected.has("orderReference")) {
      const reference = analysis.orderReference || analysis.invoiceNumber || analysis.contractNumber;
      if (reference) addUpdate("order_reference", reference, "Referenz");
    }

    if (selected.has("amountCents") && analysis.amountCents !== null) {
      addUpdate("amount_cents", analysis.amountCents, "Betrag");
      if (analysis.currency) addUpdate("currency", analysis.currency, "Währung");
    }

    if (selected.has("incidentDate") && analysis.documentDate) {
      addUpdate("incident_date", analysis.documentDate, "Vorfallsdatum");
    }

    if (selected.has("summary") && analysis.summary) {
      addUpdate("summary", analysis.summary, "Zusammenfassung");
    }

    if (updates.length > 0) {
      await client.query(
        `UPDATE cases
         SET ${updates.join(", ")}, updated_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        values
      );
    }

    if (selected.has("deadline") && analysis.deadlineDate) {
      await client.query(
        `INSERT INTO case_deadlines (case_id, title, due_at)
         VALUES ($1, 'Im Dokument erkannte Frist', ($2::date + time '23:59:59') AT TIME ZONE 'Europe/Berlin')`,
        [caseId, analysis.deadlineDate]
      );
      appliedLabels.push("Frist");
    }

    if (appliedLabels.length === 0) {
      await client.query("ROLLBACK");
      return redirectToAnalysis(caseId, documentId, "error", "Für die gewählten Felder wurde kein übernehmbarer Wert erkannt.");
    }

    await client.query(
      `UPDATE document_ai_analyses SET applied_at = NOW() WHERE id = $1`,
      [analysisId]
    );
    await client.query(
      `INSERT INTO case_events (case_id, event_type, title, details, occurred_at)
       VALUES ($1, 'document_ai_values_applied', 'Geprüfte Dokumentwerte übernommen', $2, NOW())`,
      [caseId, `${row.original_name} · Übernommen: ${appliedLabels.join(", ")}`]
    );
    await client.query("COMMIT");

    return redirectToAnalysis(caseId, documentId, "notice", `Übernommen: ${appliedLabels.join(", ")}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("Applying AI document values failed", error);
    return redirectToAnalysis(caseId, documentId, "error", "Die ausgewählten Werte konnten gerade nicht übernommen werden.");
  } finally {
    client.release();
  }
}
