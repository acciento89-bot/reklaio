import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  caseStatuses,
  formatCurrency,
  formatDate,
  formatDateTime,
  getLocalizedCaseStatus,
  type CaseStatus
} from "@/lib/cases";
import { getLocalizedCaseTypeByValue, type CaseTypeValue } from "@/lib/case-types";
import {
  documentTypes,
  formatFileSize,
  getDocumentTypeLabel
} from "@/lib/documents";
import { getLetterKindLabel } from "@/lib/letters";
import { getLocale, localizedPath } from "@/lib/i18n";

type CaseDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
};

type CaseDetail = {
  id: string;
  type: CaseTypeValue;
  status: CaseStatus;
  title: string;
  company_name: string | null;
  order_reference: string | null;
  amount_cents: number | null;
  currency: string;
  incident_date: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

type CaseEvent = {
  id: string;
  event_type: string;
  title: string;
  details: string | null;
  occurred_at: string;
};

type CaseDeadline = {
  id: string;
  title: string;
  due_at: string;
  completed_at: string | null;
};

type CaseDocument = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: string;
  document_type: string | null;
  created_at: string;
};

type GeneratedLetter = {
  id: string;
  kind: string;
  subject: string | null;
  created_at: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CaseDetailPage({ params, searchParams }: CaseDetailPageProps) {
  const locale = await getLocale();
  const en = locale === "en";
  const numberLocale = en ? "en-GB" : "de-DE";
  const user = await requireUser();
  const { id } = await params;
  const { error, notice } = await searchParams;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const caseResult = await query<CaseDetail>(
    `SELECT id, type, status, title, company_name, order_reference,
            amount_cents, currency, incident_date, summary, created_at, updated_at
     FROM cases
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, user.id]
  );

  const currentCase = caseResult.rows[0];
  if (!currentCase) {
    notFound();
  }

  const [eventResult, deadlineResult, documentResult, letterResult] = await Promise.all([
    query<CaseEvent>(
      `SELECT id, event_type, title, details, occurred_at
       FROM case_events
       WHERE case_id = $1
       ORDER BY occurred_at DESC, created_at DESC`,
      [id]
    ),
    query<CaseDeadline>(
      `SELECT id, title, due_at, completed_at
       FROM case_deadlines
       WHERE case_id = $1
       ORDER BY (completed_at IS NOT NULL), due_at ASC`,
      [id]
    ),
    query<CaseDocument>(
      `SELECT id, original_name, mime_type, size_bytes, document_type, created_at
       FROM case_documents
       WHERE case_id = $1
       ORDER BY created_at DESC`,
      [id]
    ),
    query<GeneratedLetter>(
      `SELECT id, kind, subject, created_at
       FROM generated_letters
       WHERE case_id = $1
       ORDER BY created_at DESC`,
      [id]
    )
  ]);

  const status = getLocalizedCaseStatus(currentCase.status, locale);
  const type = getLocalizedCaseTypeByValue(currentCase.type, locale);
  const openDeadlines = deadlineResult.rows.filter((item) => !item.completed_at);

  return (
    <main className="case-detail-page container">
      <header className="case-detail-topbar">
        <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={localizedPath("/dashboard", locale)}>← {en ? "All cases" : "Alle Fälle"}</Link>
      </header>

      {notice ? <div className="notice-card case-error" role="status"><strong>{notice}</strong></div> : null}
      {error ? <div className="form-error case-error" role="alert">{error}</div> : null}

      <section className="case-detail-header">
        <div>
          <span className="eyebrow">{type?.title ?? (en ? "Consumer case" : "Verbraucherfall")}</span>
          <h1>{currentCase.title}</h1>
          <p>{currentCase.company_name || (en ? "No provider entered yet" : "Noch kein Anbieter eingetragen")}</p>
        </div>
        <span className={`status status-${status.tone} status-large`}>{status.label}</span>
      </section>

      <div className="case-detail-grid">
        <section className="case-main-column">
          <article className="detail-panel">
            <div className="detail-panel-header">
              <div>
                <span className="eyebrow">{en ? "Overview" : "Überblick"}</span>
                <h2>{en ? "Case details" : "Falldaten"}</h2>
              </div>
            </div>

            <dl className="case-facts">
              <div><dt>{en ? "Provider" : "Anbieter"}</dt><dd>{currentCase.company_name || "–"}</dd></div>
              <div><dt>{en ? "Reference" : "Referenz"}</dt><dd>{currentCase.order_reference || "–"}</dd></div>
              <div><dt>{en ? "Amount" : "Betrag"}</dt><dd>{formatCurrency(currentCase.amount_cents, currentCase.currency, numberLocale)}</dd></div>
              <div><dt>{en ? "Incident date" : "Vorfallsdatum"}</dt><dd>{formatDate(currentCase.incident_date, numberLocale)}</dd></div>
              <div><dt>{en ? "Created" : "Angelegt"}</dt><dd>{formatDateTime(currentCase.created_at, numberLocale)}</dd></div>
              <div><dt>{en ? "Last updated" : "Zuletzt geändert"}</dt><dd>{formatDateTime(currentCase.updated_at, numberLocale)}</dd></div>
            </dl>

            <div className="case-summary">
              <h3>{en ? "Summary" : "Zusammenfassung"}</h3>
              <p>{currentCase.summary || (en ? "No summary entered yet." : "Noch keine Zusammenfassung erfasst.")}</p>
            </div>
          </article>

          <article className="detail-panel" id="dokumente">
            <div className="detail-panel-header">
              <div>
                <span className="eyebrow">{en ? "Evidence" : "Belege"}</span>
                <h2>{en ? "Documents" : "Dokumente"}</h2>
              </div>
              <span>{documentResult.rows.length} {en ? (documentResult.rows.length === 1 ? "file" : "files") : (documentResult.rows.length === 1 ? "Datei" : "Dateien")}</span>
            </div>

            <form
              className="document-upload-form"
              action={`/api/cases/${id}/documents`}
              method="post"
              encType="multipart/form-data"
            >
              <label className="field">
                {en ? "Document type" : "Dokumentart"}
                <select name="documentType" defaultValue="other">
                  {documentTypes.map((item) => (
                    <option value={item.value} key={item.value}>{en ? ({ invoice: "Invoice", order_confirmation: "Order confirmation", return_receipt: "Return receipt", cancellation: "Cancellation", correspondence: "Correspondence", tracking: "Tracking", photo: "Photo", other: "Other" } as Record<string,string>)[item.value] ?? item.label : item.label}</option>
                  ))}
                </select>
              </label>
              <label className="field field-full">
                {en ? "Choose file" : "Datei auswählen"}
                <input
                  name="document"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                  required
                />
                <small>{en ? "PDF or image, up to 15 MB. The file remains private in your case." : "PDF oder Bild, maximal 15 MB. Die Datei bleibt privat in deinem Fall."}</small>
              </label>
              <button className="button button-secondary" type="submit">{en ? "Upload document" : "Dokument hochladen"}</button>
            </form>

            <div className="document-list">
              {documentResult.rows.length === 0 ? (
                <p className="muted-copy">{en ? "No documents uploaded yet." : "Noch keine Dokumente hochgeladen."}</p>
              ) : documentResult.rows.map((document) => {
                const analyzable = ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(document.mime_type);
                return (
                  <article className="document-item" key={document.id}>
                    <div className="document-icon" aria-hidden="true">▤</div>
                    <div className="document-main">
                      <strong>{document.original_name}</strong>
                      <span>
                        {getDocumentTypeLabel(document.document_type)} · {formatFileSize(document.size_bytes)} · {formatDateTime(document.created_at, numberLocale)}
                      </span>
                    </div>
                    <div className="document-actions">
                      <a href={`/api/cases/${id}/documents/${document.id}/download`}>{en ? "Download" : "Herunterladen"}</a>
                      {analyzable ? <Link href={localizedPath(`/faelle/${id}/dokumente/${document.id}/analyse`, locale)}>{en ? "Review with AI" : "KI prüfen"}</Link> : null}
                      <form action={`/api/cases/${id}/documents/${document.id}/delete`} method="post">
                        <button type="submit">{en ? "Delete" : "Löschen"}</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="detail-panel">
            <div className="detail-panel-header">
              <div>
                <span className="eyebrow">{en ? "Correspondence" : "Korrespondenz"}</span>
                <h2>{en ? "Letters" : "Schreiben"}</h2>
              </div>
              <Link className="button button-secondary" href={localizedPath(`/faelle/${id}/schreiben/neu`, locale)}>+ {en ? "New letter" : "Neues Schreiben"}</Link>
            </div>

            {letterResult.rows.length === 0 ? (
              <div className="empty-state letter-empty-state">
                <div className="empty-state-icon">✎</div>
                <h3>{en ? "No letter saved yet" : "Noch kein Schreiben gespeichert"}</h3>
                <p>{en ? "Create a suitable message from the case details, edit it and save it to the case file." : "Erstelle aus den Falldaten eine passende Nachricht, passe sie an und speichere sie in der Fallakte."}</p>
                <Link className="button button-primary" href={localizedPath(`/faelle/${id}/schreiben/neu`, locale)}>{en ? "Create first letter" : "Erstes Schreiben erstellen"}</Link>
              </div>
            ) : (
              <div className="letter-list">
                {letterResult.rows.map((letter) => (
                  <Link className="letter-list-item" href={localizedPath(`/faelle/${id}/schreiben/${letter.id}`, locale)} key={letter.id}>
                    <span className="letter-list-icon" aria-hidden="true">✎</span>
                    <span className="letter-list-main">
                      <strong>{letter.subject || (en ? "Letter without subject" : "Schreiben ohne Betreff")}</strong>
                      <span>{getLetterKindLabel(letter.kind)} · {formatDateTime(letter.created_at, numberLocale)}</span>
                    </span>
                    <span className="letter-list-arrow" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="detail-panel">
            <div className="detail-panel-header">
              <div>
                <span className="eyebrow">{en ? "Timeline" : "Chronik"}</span>
                <h2>{en ? "What has happened so far" : "Was bisher passiert ist"}</h2>
              </div>
              <span>{eventResult.rows.length} {en ? "entries" : "Einträge"}</span>
            </div>

            <form className="inline-entry-form" action={`/api/cases/${id}/events`} method="post">
              <label className="field">
                {en ? "Event" : "Ereignis"}
                <input name="title" type="text" maxLength={180} placeholder={en ? "e.g. Contacted retailer again" : "z. B. Händler erneut angeschrieben"} required />
              </label>
              <label className="field">
                {en ? "Date and time" : "Zeitpunkt"}
                <input name="occurredAt" type="datetime-local" />
              </label>
              <label className="field field-full">
                {en ? "Details" : "Details"}
                <textarea name="details" rows={3} maxLength={4000} placeholder={en ? "What was written, promised or established?" : "Was wurde geschrieben, zugesagt oder festgestellt?"} />
              </label>
              <button className="button button-secondary" type="submit">{en ? "Add to timeline" : "Zur Chronik hinzufügen"}</button>
            </form>

            <div className="timeline">
              {eventResult.rows.length === 0 ? (
                <p className="muted-copy">{en ? "No timeline entries yet." : "Noch keine Chronik vorhanden."}</p>
              ) : eventResult.rows.map((event) => (
                <article className="timeline-item" key={event.id}>
                  <div className="timeline-dot" />
                  <div>
                    <time>{formatDateTime(event.occurred_at, numberLocale)}</time>
                    <h3>{event.title}</h3>
                    {event.details ? <p>{event.details}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        <aside className="case-side-column">
          <article className="detail-panel compact-panel">
            <span className="eyebrow">{en ? "Processing" : "Bearbeitung"}</span>
            <h2>{en ? "Change status" : "Status ändern"}</h2>
            <form className="stack-form" action={`/api/cases/${id}/status`} method="post">
              <label className="field">
                {en ? "Current status" : "Aktueller Stand"}
                <select name="status" defaultValue={currentCase.status}>
                  {caseStatuses.map((item) => (
                    <option key={item.value} value={item.value}>{getLocalizedCaseStatus(item.value, locale).label}</option>
                  ))}
                </select>
              </label>
              <button className="button button-secondary" type="submit">{en ? "Save status" : "Status speichern"}</button>
            </form>
          </article>

          <article className="detail-panel compact-panel">
            <div className="detail-panel-header">
              <div>
                <span className="eyebrow">{en ? "Deadlines" : "Fristen"}</span>
                <h2>{openDeadlines.length} {en ? "open" : "offen"}</h2>
              </div>
            </div>

            <form className="stack-form" action={`/api/cases/${id}/deadlines`} method="post">
              <label className="field">
                {en ? "Name" : "Bezeichnung"}
                <input name="title" type="text" maxLength={180} placeholder={en ? "e.g. Payment deadline" : "z. B. Zahlungsfrist"} required />
              </label>
              <label className="field">
                {en ? "Due date" : "Fällig am"}
                <input name="dueDate" type="date" required />
              </label>
              <button className="button button-secondary" type="submit">{en ? "Add deadline" : "Frist hinzufügen"}</button>
            </form>

            <div className="deadline-list">
              {deadlineResult.rows.length === 0 ? (
                <p className="muted-copy">{en ? "No deadline recorded yet." : "Noch keine Frist erfasst."}</p>
              ) : deadlineResult.rows.map((deadline) => (
                <article className={`deadline-item${deadline.completed_at ? " deadline-complete" : ""}`} key={deadline.id}>
                  <div>
                    <strong>{deadline.title}</strong>
                    <span>{en ? "Due" : "Fällig"}: {formatDate(deadline.due_at, numberLocale)}</span>
                  </div>
                  {deadline.completed_at ? (
                    <span className="deadline-done">{en ? "Done" : "Erledigt"}</span>
                  ) : (
                    <form action={`/api/cases/${id}/deadlines/${deadline.id}/complete`} method="post">
                      <button type="submit">{en ? "Complete" : "Erledigen"}</button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}
