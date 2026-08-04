import Link from "next/link";
import { notFound } from "next/navigation";
import { documentAnalysisSchema, isAiConfigured } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { hasProAccess } from "@/lib/billing";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/cases";
import { query } from "@/lib/db";
import { formatFileSize, getDocumentTypeLabel } from "@/lib/documents";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PageProps = {
  params: Promise<{ id: string; documentId: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
};

type DocumentRow = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: string;
  document_type: string | null;
  created_at: string;
  case_title: string;
};

type AnalysisRow = {
  id: string;
  model_name: string;
  result_json: unknown;
  consent_at: string;
  applied_at: string | null;
  created_at: string;
};

function confidenceLabel(value: number) {
  if (value >= .85) return "hoch";
  if (value >= .6) return "mittel";
  return "niedrig";
}

export default async function DocumentAnalysisPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const { id: caseId, documentId } = await params;
  const messages = await searchParams;

  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(documentId)) notFound();

  const [documentResult, proAccess] = await Promise.all([
    query<DocumentRow>(
      `SELECT d.id, d.original_name, d.mime_type, d.size_bytes, d.document_type,
              d.created_at, c.title AS case_title
       FROM case_documents d
       JOIN cases c ON c.id = d.case_id
       WHERE d.id = $1 AND d.case_id = $2 AND c.user_id = $3
       LIMIT 1`,
      [documentId, caseId, user.id]
    ),
    hasProAccess(user.id)
  ]);
  const document = documentResult.rows[0];
  if (!document) notFound();

  const analysisResult = await query<AnalysisRow>(
    `SELECT id, model_name, result_json, consent_at, applied_at, created_at
     FROM document_ai_analyses
     WHERE document_id = $1 AND case_id = $2 AND user_id = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [documentId, caseId, user.id]
  );

  const row = analysisResult.rows[0] ?? null;
  const analysis = row ? documentAnalysisSchema.safeParse(row.result_json) : null;
  const data = analysis?.success ? analysis.data : null;
  const supported = ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(document.mime_type);
  const aiConfigured = isAiConfigured();
  const reference = data?.orderReference || data?.invoiceNumber || data?.contractNumber || null;

  return (
    <main className="ai-page container">
      <header className="case-detail-topbar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={`/faelle/${caseId}`}>← Zur Fallakte</Link>
      </header>

      <section className="ai-page-header">
        <div>
          <span className="eyebrow">Freiwillige KI-Funktion</span>
          <h1>Dokument prüfen lassen</h1>
          <p>{document.original_name} · {document.case_title}</p>
        </div>
        <a className="button button-secondary" href={`/api/cases/${caseId}/documents/${documentId}/download`}>Original öffnen</a>
      </section>

      {messages.notice ? <div className="notice-card ai-notice" role="status"><strong>{messages.notice}</strong></div> : null}
      {messages.error ? <div className="form-error ai-notice" role="alert">{messages.error}</div> : null}

      <section className="ai-document-summary">
        <article><span>Dokumentart</span><strong>{getDocumentTypeLabel(document.document_type)}</strong></article>
        <article><span>Dateigröße</span><strong>{formatFileSize(document.size_bytes)}</strong></article>
        <article><span>Hochgeladen</span><strong>{formatDateTime(document.created_at)}</strong></article>
      </section>

      {!proAccess ? (
        <section className="detail-panel ai-disabled-panel">
          <span className="eyebrow">Reklaio Pro</span>
          <h2>KI-Dokumentanalyse ist eine Pro-Funktion</h2>
          <p>Die normale Fallakte, Dokumentablage, Fristen und Vorlagen bleiben im Free-Tarif verfügbar.</p>
          <Link className="button button-primary" href="/preise">Tarife ansehen</Link>
        </section>
      ) : !aiConfigured ? (
        <section className="detail-panel ai-disabled-panel">
          <span className="eyebrow">Nicht eingerichtet</span>
          <h2>KI-Analyse ist derzeit deaktiviert</h2>
          <p>Der Pro-Zugang ist vorhanden, aber der Betreiber muss noch API-Schlüssel und API-Guthaben konfigurieren.</p>
        </section>
      ) : !supported ? (
        <section className="detail-panel ai-disabled-panel">
          <span className="eyebrow">Dateityp</span>
          <h2>Für dieses Format nicht verfügbar</h2>
          <p>Die KI-Analyse unterstützt derzeit PDF, JPEG, PNG und WebP. HEIC- und HEIF-Dateien können weiterhin gespeichert und heruntergeladen werden.</p>
        </section>
      ) : (
        <section className="detail-panel ai-consent-panel">
          <div>
            <span className="eyebrow">Neue Analyse</span>
            <h2>{row ? "Dokument erneut analysieren" : "Dokument analysieren"}</h2>
            <p>Das ausgewählte Dokument wird dafür an die OpenAI API übermittelt. Die Analyse ist freiwillig, kann Fehler enthalten und übernimmt keine Werte automatisch.</p>
            <ul>
              <li>Nur dieses Dokument wird übermittelt.</li>
              <li>Das Ergebnis muss anhand des Originals geprüft werden.</li>
              <li>Keine rechtliche Bewertung und kein automatischer Versand.</li>
            </ul>
          </div>
          <form action={`/api/cases/${caseId}/documents/${documentId}/analyze`} method="post">
            <label className="ai-consent-check">
              <input name="aiConsent" type="checkbox" required />
              <span>Ich willige für diesen Vorgang in die Übermittlung und KI-Analyse des Dokuments ein und habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> gelesen.</span>
            </label>
            <button className="button button-primary" type="submit">Analyse starten</button>
          </form>
        </section>
      )}

      {data && row ? (
        <section className="ai-results-grid">
          <article className="detail-panel ai-result-main">
            <div className="detail-panel-header">
              <div><span className="eyebrow">Prüfergebnis</span><h2>{data.documentKind}</h2></div>
              <span>Sicherheit: {confidenceLabel(data.overallConfidence)} · {Math.round(data.overallConfidence * 100)} %</span>
            </div>
            <p className="ai-result-summary">{data.summary}</p>

            <form className="ai-apply-form" action={`/api/cases/${caseId}/documents/${documentId}/analysis/apply`} method="post">
              <input name="analysisId" type="hidden" value={row.id} />
              <h3>Geprüfte Werte auswählen</h3>
              <p>Nur angehakte Werte werden in die Fallakte übernommen. Vorhandene Werte können dadurch ersetzt werden.</p>

              <div className="ai-field-list">
                <label className={!data.companyName ? "is-empty" : ""}>
                  <input name="fields" type="checkbox" value="companyName" disabled={!data.companyName} />
                  <span><strong>Anbieter</strong><small>{data.companyName || "nicht erkannt"}</small></span>
                </label>
                <label className={!reference ? "is-empty" : ""}>
                  <input name="fields" type="checkbox" value="orderReference" disabled={!reference} />
                  <span><strong>Referenz</strong><small>{reference || "nicht erkannt"}</small></span>
                </label>
                <label className={data.amountCents === null ? "is-empty" : ""}>
                  <input name="fields" type="checkbox" value="amountCents" disabled={data.amountCents === null} />
                  <span><strong>Betrag</strong><small>{data.amountCents !== null ? formatCurrency(data.amountCents, data.currency || "EUR") : "nicht erkannt"}</small></span>
                </label>
                <label className={!data.documentDate ? "is-empty" : ""}>
                  <input name="fields" type="checkbox" value="incidentDate" disabled={!data.documentDate} />
                  <span><strong>Dokument-/Vorfallsdatum</strong><small>{data.documentDate ? formatDate(data.documentDate) : "nicht erkannt"}</small></span>
                </label>
                <label>
                  <input name="fields" type="checkbox" value="summary" />
                  <span><strong>Zusammenfassung</strong><small>{data.summary}</small></span>
                </label>
                <label className={!data.deadlineDate ? "is-empty" : ""}>
                  <input name="fields" type="checkbox" value="deadline" disabled={!data.deadlineDate} />
                  <span><strong>Erkannte Frist anlegen</strong><small>{data.deadlineDate ? formatDate(data.deadlineDate) : "nicht erkannt"}</small></span>
                </label>
              </div>
              <button className="button button-primary" type="submit">Ausgewählte Werte übernehmen</button>
            </form>
          </article>

          <aside className="ai-side-column">
            <article className="detail-panel">
              <span className="eyebrow">Wichtige Aussagen</span>
              <h2>Dokumentinhalt</h2>
              {data.keyStatements.length ? <ul className="ai-simple-list">{data.keyStatements.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted-copy">Keine eindeutigen Kernaussagen erkannt.</p>}
            </article>

            <article className="detail-panel">
              <span className="eyebrow">Prüfhinweise</span>
              <h2>Unsicherheiten</h2>
              {data.warnings.length ? <ul className="ai-warning-list">{data.warnings.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="muted-copy">Keine besonderen Warnungen ausgegeben.</p>}
            </article>

            <article className="detail-panel">
              <span className="eyebrow">Nachvollziehbarkeit</span>
              <h2>Erkannte Textstellen</h2>
              <div className="ai-evidence-list">
                {data.evidence.length ? data.evidence.map((item, index) => (
                  <article key={`${item.field}-${index}`}>
                    <strong>{item.field}: {item.value}</strong>
                    <p>„{item.sourceText}“</p>
                    <span>{Math.round(item.confidence * 100)} % Sicherheit</span>
                  </article>
                )) : <p className="muted-copy">Keine Textstellen hinterlegt.</p>}
              </div>
            </article>

            <article className="detail-panel ai-meta-card">
              <span className="eyebrow">Technik</span>
              <h2>Analyseprotokoll</h2>
              <p>Modell: {row.model_name}</p>
              <p>Einwilligung: {formatDateTime(row.consent_at)}</p>
              <p>Erstellt: {formatDateTime(row.created_at)}</p>
              {row.applied_at ? <p>Werte übernommen: {formatDateTime(row.applied_at)}</p> : null}

              <form className="ai-analysis-delete-form" action={`/api/cases/${caseId}/documents/${documentId}/analysis/${row.id}/delete`} method="post">
                <label className="field">
                  Analyseergebnis löschen
                  <input name="confirmation" type="text" placeholder="LÖSCHEN" required autoComplete="off" />
                </label>
                <button className="button letter-delete-button" type="submit">Analyse unwiderruflich löschen</button>
              </form>
            </article>
          </aside>
        </section>
      ) : null}
    </main>
  );
}
