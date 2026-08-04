import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/cases";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

type DeadlineState = "overdue" | "soon" | "open" | "completed";

type DeadlineRow = {
  id: string;
  case_id: string;
  case_title: string;
  company_name: string | null;
  title: string;
  due_at: string | Date;
  completed_at: string | Date | null;
  deadline_state: DeadlineState;
};

const stateLabels: Record<DeadlineState, string> = {
  overdue: "Überfällig",
  soon: "Bald fällig",
  open: "Offen",
  completed: "Erledigt"
};

export default async function DeadlinesPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const { error } = await searchParams;
  const accountName = user.displayName || user.email;

  const result = await query<DeadlineRow>(
    `SELECT
       d.id,
       d.case_id,
       c.title AS case_title,
       c.company_name,
       d.title,
       d.due_at,
       d.completed_at,
       CASE
         WHEN d.completed_at IS NOT NULL THEN 'completed'
         WHEN d.due_at < NOW() THEN 'overdue'
         WHEN d.due_at <= NOW() + INTERVAL '7 days' THEN 'soon'
         ELSE 'open'
       END AS deadline_state
     FROM case_deadlines d
     INNER JOIN cases c ON c.id = d.case_id
     WHERE c.user_id = $1
     ORDER BY
       CASE WHEN d.completed_at IS NULL THEN 0 ELSE 1 END,
       d.due_at ASC,
       d.created_at DESC`,
    [user.id]
  );

  const deadlines = result.rows;
  const overdueCount = deadlines.filter((item) => item.deadline_state === "overdue").length;
  const soonCount = deadlines.filter((item) => item.deadline_state === "soon").length;
  const openCount = deadlines.filter((item) => item.deadline_state !== "completed").length;
  const completedCount = deadlines.filter((item) => item.deadline_state === "completed").length;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>Reklaio</span>
        </Link>
        <nav>
          <Link href="/dashboard">Meine Fälle</Link>
          <Link href="/neuer-fall">Neuer Fall</Link>
          <Link className="active" href="/fristen">Fristen</Link>
          <Link href="/dokumente">Dokumente</Link>
          <a href="#">Einstellungen</a>
        </nav>
        <div className="sidebar-account">
          <strong>{accountName}</strong>
          <span>{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit">Abmelden</button>
          </form>
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">Termine im Blick</span>
            <h1>Fristen</h1>
            <p className="dashboard-welcome">Alle Fristen deiner Fälle in einer gemeinsamen Übersicht.</p>
          </div>
          <Link className="button button-primary" href="/dashboard">Zu den Fällen</Link>
        </header>

        {error ? <div className="form-error deadline-page-error" role="alert">{error}</div> : null}

        <div className="stats-grid deadline-stats-grid">
          <div className="stat-card deadline-stat-card deadline-stat-overdue">
            <span>Überfällig</span>
            <strong>{overdueCount}</strong>
            <small>sofort prüfen</small>
          </div>
          <div className="stat-card deadline-stat-card deadline-stat-soon">
            <span>Nächste 7 Tage</span>
            <strong>{soonCount}</strong>
            <small>bald fällig</small>
          </div>
          <div className="stat-card deadline-stat-card">
            <span>Offene Fristen</span>
            <strong>{openCount}</strong>
            <small>{completedCount} erledigt</small>
          </div>
        </div>

        <div className="panel deadline-overview-panel">
          <div className="panel-header">
            <h2>Fristenübersicht</h2>
            <span>{deadlines.length} {deadlines.length === 1 ? "Frist" : "Fristen"}</span>
          </div>

          {deadlines.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⌛</div>
              <h3>Noch keine Frist vorhanden</h3>
              <p>Öffne eine Fallakte und lege dort eine Antwort-, Zahlungs- oder Bearbeitungsfrist an.</p>
              <Link className="button button-primary" href="/dashboard">Fall auswählen</Link>
            </div>
          ) : (
            <div className="deadline-overview-list">
              {deadlines.map((deadline) => (
                <article
                  className={`deadline-overview-row deadline-state-${deadline.deadline_state}`}
                  key={deadline.id}
                >
                  <div className="deadline-date-block">
                    <strong>{formatDate(deadline.due_at)}</strong>
                    <span>{stateLabels[deadline.deadline_state]}</span>
                  </div>

                  <div className="deadline-copy">
                    <h3>{deadline.title}</h3>
                    <p>
                      {deadline.case_title}
                      {deadline.company_name ? ` · ${deadline.company_name}` : ""}
                    </p>
                    {deadline.completed_at ? (
                      <small>Erledigt am {formatDateTime(deadline.completed_at)}</small>
                    ) : null}
                  </div>

                  <div className="deadline-row-actions">
                    <Link href={`/faelle/${deadline.case_id}`}>Fall öffnen</Link>
                    {deadline.deadline_state !== "completed" ? (
                      <form action={`/api/deadlines/${deadline.id}/complete`} method="post">
                        <button type="submit">Erledigen</button>
                      </form>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
