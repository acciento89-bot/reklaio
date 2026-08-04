import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate, formatDateTime, getCaseStatus } from "@/lib/cases";
import { query } from "@/lib/db";
import {
  escalationStages,
  getEscalationStage,
  getProviderOutcome,
  getTaskPriority,
  providerOutcomes,
  taskPriorities
} from "@/lib/workflow";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
};

type CaseRow = { id: string; title: string; company_name: string | null; status: string };
type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  source: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
};
type ResponseRow = {
  id: string;
  response_received_at: string;
  outcome: string;
  promised_amount_cents: number | null;
  promised_due_at: string | null;
  summary: string;
  original_name: string | null;
};
type EscalationRow = { id: string; stage: string; note: string | null; created_at: string };
type DocumentRow = { id: string; original_name: string; created_at: string };

function berlinDateTimeValue() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date()).replace(" ", "T");
}

function taskState(task: TaskRow) {
  if (task.status === "completed") return { label: "Erledigt", className: "workflow-state-complete" };
  if (task.due_at && new Date(task.due_at).getTime() < Date.now()) return { label: "Überfällig", className: "workflow-state-overdue" };
  return { label: "Offen", className: "workflow-state-open" };
}

export default async function CaseWorkflowPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const messages = await searchParams;
  if (!UUID_PATTERN.test(id)) notFound();

  const caseResult = await query<CaseRow>(
    `SELECT id, title, company_name, status FROM cases WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [id, user.id]
  );
  const currentCase = caseResult.rows[0];
  if (!currentCase) notFound();

  const [taskResult, responseResult, escalationResult, documentResult] = await Promise.all([
    query<TaskRow>(
      `SELECT id, title, description, priority, status, source, due_at, completed_at, created_at
       FROM case_tasks
       WHERE case_id = $1
       ORDER BY (status = 'completed'), due_at ASC NULLS LAST, created_at DESC`,
      [id]
    ),
    query<ResponseRow>(
      `SELECT r.id, r.response_received_at, r.outcome, r.promised_amount_cents,
              r.promised_due_at, r.summary, d.original_name
       FROM provider_responses r
       LEFT JOIN case_documents d ON d.id = r.document_id
       WHERE r.case_id = $1
       ORDER BY r.response_received_at DESC, r.created_at DESC`,
      [id]
    ),
    query<EscalationRow>(
      `SELECT id, stage, note, created_at
       FROM case_escalations
       WHERE case_id = $1
       ORDER BY created_at DESC`,
      [id]
    ),
    query<DocumentRow>(
      `SELECT id, original_name, created_at
       FROM case_documents
       WHERE case_id = $1
       ORDER BY created_at DESC`,
      [id]
    )
  ]);

  const openTasks = taskResult.rows.filter((task) => task.status === "open");
  const overdueTasks = openTasks.filter((task) => task.due_at && new Date(task.due_at).getTime() < Date.now());
  const status = getCaseStatus(currentCase.status);

  return (
    <main className="workflow-page container">
      <header className="case-detail-topbar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={`/faelle/${id}`}>← Zur Fallakte</Link>
      </header>

      <section className="workflow-page-header">
        <div>
          <span className="eyebrow">Fallsteuerung</span>
          <h1>Aufgaben und Eskalation</h1>
          <p>{currentCase.title}{currentCase.company_name ? ` · ${currentCase.company_name}` : ""}</p>
        </div>
        <span className={`status status-${status.tone} status-large`}>{status.label}</span>
      </section>

      {messages.notice ? <div className="notice-card workflow-notice" role="status"><strong>{messages.notice}</strong></div> : null}
      {messages.error ? <div className="form-error workflow-notice" role="alert">{messages.error}</div> : null}

      <section className="workflow-summary-grid">
        <article><span>Offene Aufgaben</span><strong>{openTasks.length}</strong><small>direkt im Dashboard sichtbar</small></article>
        <article className={overdueTasks.length ? "workflow-summary-danger" : ""}><span>Überfällig</span><strong>{overdueTasks.length}</strong><small>benötigen deine Aufmerksamkeit</small></article>
        <article><span>Anbieterantworten</span><strong>{responseResult.rows.length}</strong><small>mit Zusagen und Ergebnissen</small></article>
        <article><span>Eskalationsschritte</span><strong>{escalationResult.rows.length}</strong><small>vollständig dokumentiert</small></article>
      </section>

      <div className="workflow-page-grid">
        <section className="workflow-main-column">
          <article className="detail-panel" id="aufgaben">
            <div className="detail-panel-header">
              <div><span className="eyebrow">Aufgaben</span><h2>Nächste Schritte verwalten</h2></div>
              <span>{openTasks.length} offen</span>
            </div>

            <form className="workflow-form workflow-task-form" action={`/api/cases/${id}/tasks`} method="post">
              <label className="field field-full">Aufgabe<input name="title" type="text" maxLength={180} placeholder="z. B. Händlerantwort am Freitag prüfen" required /></label>
              <label className="field">Fällig am<input name="dueAt" type="datetime-local" /></label>
              <label className="field">Priorität<select name="priority" defaultValue="normal">{taskPriorities.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
              <label className="field field-full">Notiz<textarea name="description" rows={3} maxLength={3000} placeholder="Optionaler Hinweis zur Aufgabe" /></label>
              <button className="button button-primary" type="submit">Aufgabe anlegen</button>
            </form>

            <div className="workflow-list">
              {taskResult.rows.length === 0 ? <p className="muted-copy">Noch keine Aufgaben vorhanden.</p> : taskResult.rows.map((task) => {
                const state = taskState(task);
                const priority = getTaskPriority(task.priority);
                return (
                  <article className={`workflow-task ${task.status === "completed" ? "workflow-task-complete" : ""}`} key={task.id}>
                    <div className="workflow-task-copy">
                      <div className="workflow-task-meta">
                        <span className={`workflow-state ${state.className}`}>{state.label}</span>
                        <span>{priority.label}</span>
                        <span>{task.due_at ? `Fällig: ${formatDateTime(task.due_at)}` : "Ohne Fälligkeit"}</span>
                      </div>
                      <h3>{task.title}</h3>
                      {task.description ? <p>{task.description}</p> : null}
                    </div>
                    {task.status === "open" ? (
                      <form action={`/api/tasks/${task.id}/complete`} method="post">
                        <input name="returnTo" type="hidden" value={`/faelle/${id}/steuerung`} />
                        <button className="button button-secondary" type="submit">Erledigen</button>
                      </form>
                    ) : <span className="workflow-completed-date">{formatDateTime(task.completed_at)}</span>}
                  </article>
                );
              })}
            </div>
          </article>

          <article className="detail-panel" id="antworten">
            <div className="detail-panel-header">
              <div><span className="eyebrow">Anbieterantwort</span><h2>Ergebnis und Zusagen erfassen</h2></div>
              <span>{responseResult.rows.length} Einträge</span>
            </div>

            <form className="workflow-form" action={`/api/cases/${id}/responses`} method="post">
              <label className="field">Antwort erhalten am<input name="responseReceivedAt" type="datetime-local" defaultValue={berlinDateTimeValue()} required /></label>
              <label className="field">Ergebnis<select name="outcome" defaultValue="question">{providerOutcomes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
              <label className="field">Zugesagter Betrag<input name="promisedAmount" type="text" inputMode="decimal" placeholder="optional, z. B. 129,90" /></label>
              <label className="field">Zugesagtes Datum<input name="promisedDueDate" type="date" /></label>
              <label className="field field-full">Zusammenfassung<textarea name="summary" rows={5} maxLength={5000} placeholder="Was hat der Anbieter geschrieben oder zugesagt?" required /></label>
              <label className="field field-full">Antwortdokument<select name="documentId" defaultValue=""><option value="">Kein Dokument zuordnen</option>{documentResult.rows.map((document) => <option value={document.id} key={document.id}>{document.original_name}</option>)}</select></label>
              <button className="button button-primary" type="submit">Antwort und Folgeaufgabe speichern</button>
            </form>

            <div className="workflow-list">
              {responseResult.rows.length === 0 ? <p className="muted-copy">Noch keine Anbieterantwort erfasst.</p> : responseResult.rows.map((response) => {
                const outcome = getProviderOutcome(response.outcome);
                return (
                  <article className="workflow-response" key={response.id}>
                    <div className="workflow-response-heading"><strong>{outcome.label}</strong><time>{formatDateTime(response.response_received_at)}</time></div>
                    <p>{response.summary}</p>
                    <div className="workflow-response-facts">
                      {response.promised_amount_cents !== null ? <span>Zusage: {formatCurrency(response.promised_amount_cents)}</span> : null}
                      {response.promised_due_at ? <span>Zieldatum: {formatDate(response.promised_due_at)}</span> : null}
                      {response.original_name ? <span>Dokument: {response.original_name}</span> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </article>
        </section>

        <aside className="workflow-side-column">
          <article className="detail-panel workflow-escalation-panel" id="eskalation">
            <span className="eyebrow">Eskalation</span>
            <h2>Nächste Stufe dokumentieren</h2>
            <p className="muted-copy">Reklaio organisiert und dokumentiert den Vorgang. Die Auswahl ist keine individuelle Rechtsberatung.</p>
            <form className="stack-form" action={`/api/cases/${id}/escalations`} method="post">
              <label className="field">Stufe<select name="stage" defaultValue="reminder">{escalationStages.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
              <label className="field">Notiz<textarea name="note" rows={4} maxLength={3000} placeholder="Was soll als Nächstes passieren?" /></label>
              <button className="button button-secondary" type="submit">Stufe übernehmen</button>
            </form>
          </article>

          <article className="detail-panel workflow-escalation-history">
            <span className="eyebrow">Verlauf</span>
            <h2>Eskalationshistorie</h2>
            {escalationResult.rows.length === 0 ? <p className="muted-copy">Noch kein Eskalationsschritt dokumentiert.</p> : (
              <div className="workflow-mini-list">
                {escalationResult.rows.map((entry) => {
                  const stage = getEscalationStage(entry.stage);
                  return <article key={entry.id}><strong>{stage.label}</strong><span>{formatDateTime(entry.created_at)}</span>{entry.note ? <p>{entry.note}</p> : null}</article>;
                })}
              </div>
            )}
          </article>
        </aside>
      </div>
    </main>
  );
}
