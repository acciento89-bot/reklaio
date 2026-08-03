import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  caseStatuses,
  formatCurrency,
  formatDate,
  formatDateTime,
  getCaseStatus,
  type CaseStatus
} from "@/lib/cases";
import { getCaseTypeByValue, type CaseTypeValue } from "@/lib/case-types";

type CaseDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CaseDetailPage({ params, searchParams }: CaseDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

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

  const [eventResult, deadlineResult] = await Promise.all([
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
    )
  ]);

  const status = getCaseStatus(currentCase.status);
  const type = getCaseTypeByValue(currentCase.type);
  const openDeadlines = deadlineResult.rows.filter((item) => !item.completed_at);

  return (
    <main className="case-detail-page container">
      <header className="case-detail-topbar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href="/dashboard">← Alle Fälle</Link>
      </header>

      {error ? <div className="form-error case-error" role="alert">{error}</div> : null}

      <section className="case-detail-header">
        <div>
          <span className="eyebrow">{type?.title ?? "Verbraucherfall"}</span>
          <h1>{currentCase.title}</h1>
          <p>{currentCase.company_name || "Noch kein Anbieter eingetragen"}</p>
        </div>
        <span className={`status status-${status.tone} status-large`}>{status.label}</span>
      </section>

      <div className="case-detail-grid">
        <section className="case-main-column">
          <article className="detail-panel">
            <div className="detail-panel-header">
              <div>
                <span className="eyebrow">Überblick</span>
                <h2>Falldaten</h2>
              </div>
            </div>

            <dl className="case-facts">
              <div><dt>Anbieter</dt><dd>{currentCase.company_name || "–"}</dd></div>
              <div><dt>Referenz</dt><dd>{currentCase.order_reference || "–"}</dd></div>
              <div><dt>Betrag</dt><dd>{formatCurrency(currentCase.amount_cents, currentCase.currency)}</dd></div>
              <div><dt>Vorfallsdatum</dt><dd>{formatDate(currentCase.incident_date)}</dd></div>
              <div><dt>Angelegt</dt><dd>{formatDateTime(currentCase.created_at)}</dd></div>
              <div><dt>Zuletzt geändert</dt><dd>{formatDateTime(currentCase.updated_at)}</dd></div>
            </dl>

            <div className="case-summary">
              <h3>Zusammenfassung</h3>
              <p>{currentCase.summary || "Noch keine Zusammenfassung erfasst."}</p>
            </div>
          </article>

          <article className="detail-panel">
            <div className="detail-panel-header">
              <div>
                <span className="eyebrow">Chronik</span>
                <h2>Was bisher passiert ist</h2>
              </div>
              <span>{eventResult.rows.length} Einträge</span>
            </div>

            <form className="inline-entry-form" action={`/api/cases/${id}/events`} method="post">
              <label className="field">
                Ereignis
                <input name="title" type="text" maxLength={180} placeholder="z. B. Händler erneut angeschrieben" required />
              </label>
              <label className="field">
                Zeitpunkt
                <input name="occurredAt" type="datetime-local" />
              </label>
              <label className="field field-full">
                Details
                <textarea name="details" rows={3} maxLength={4000} placeholder="Was wurde geschrieben, zugesagt oder festgestellt?" />
              </label>
              <button className="button button-secondary" type="submit">Zur Chronik hinzufügen</button>
            </form>

            <div className="timeline">
              {eventResult.rows.length === 0 ? (
                <p className="muted-copy">Noch keine Chronik vorhanden.</p>
              ) : eventResult.rows.map((event) => (
                <article className="timeline-item" key={event.id}>
                  <div className="timeline-dot" />
                  <div>
                    <time>{formatDateTime(event.occurred_at)}</time>
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
            <span className="eyebrow">Bearbeitung</span>
            <h2>Status ändern</h2>
            <form className="stack-form" action={`/api/cases/${id}/status`} method="post">
              <label className="field">
                Aktueller Stand
                <select name="status" defaultValue={currentCase.status}>
                  {caseStatuses.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>
              <button className="button button-secondary" type="submit">Status speichern</button>
            </form>
          </article>

          <article className="detail-panel compact-panel">
            <div className="detail-panel-header">
              <div>
                <span className="eyebrow">Fristen</span>
                <h2>{openDeadlines.length} offen</h2>
              </div>
            </div>

            <form className="stack-form" action={`/api/cases/${id}/deadlines`} method="post">
              <label className="field">
                Bezeichnung
                <input name="title" type="text" maxLength={180} placeholder="z. B. Zahlungsfrist" required />
              </label>
              <label className="field">
                Fällig am
                <input name="dueDate" type="date" required />
              </label>
              <button className="button button-secondary" type="submit">Frist hinzufügen</button>
            </form>

            <div className="deadline-list">
              {deadlineResult.rows.length === 0 ? (
                <p className="muted-copy">Noch keine Frist erfasst.</p>
              ) : deadlineResult.rows.map((deadline) => (
                <article className={`deadline-item${deadline.completed_at ? " deadline-complete" : ""}`} key={deadline.id}>
                  <div>
                    <strong>{deadline.title}</strong>
                    <span>Fällig: {formatDate(deadline.due_at)}</span>
                  </div>
                  {deadline.completed_at ? (
                    <span className="deadline-done">Erledigt</span>
                  ) : (
                    <form action={`/api/cases/${id}/deadlines/${deadline.id}/complete`} method="post">
                      <button type="submit">Erledigen</button>
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
