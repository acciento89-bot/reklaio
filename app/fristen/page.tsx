import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/cases";
import { getLocale, localizedPath } from "@/lib/i18n";

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
  const locale = await getLocale();
  const en = locale === "en";
  const numberLocale = en ? "en-GB" : "de-DE";
  const labels: Record<DeadlineState, string> = en ? { overdue: "Overdue", soon: "Due soon", open: "Open", completed: "Done" } : stateLabels;
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
        <Link className="brand" href={localizedPath("/", locale)}>
          <span className="brand-mark">R</span>
          <span>Reklaio</span>
        </Link>
        <nav>
          <Link href={localizedPath("/dashboard", locale)}>{en ? "My cases" : "Meine Fälle"}</Link>
          <Link href={localizedPath("/neuer-fall", locale)}>{en ? "New case" : "Neuer Fall"}</Link>
          <Link className="active" href={localizedPath("/fristen", locale)}>{en ? "Deadlines" : "Fristen"}</Link>
          <Link href={localizedPath("/dokumente", locale)}>{en ? "Documents" : "Dokumente"}</Link>
          <Link href={localizedPath("/einstellungen", locale)}>{en ? "Settings" : "Einstellungen"}</Link>
        </nav>
        <div className="sidebar-account">
          <strong>{accountName}</strong>
          <span>{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit">{en ? "Sign out" : "Abmelden"}</button>
          </form>
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">{en ? "Keep track of dates" : "Termine im Blick"}</span>
            <h1>{en ? "Deadlines" : "Fristen"}</h1>
            <p className="dashboard-welcome">{en ? "All deadlines from your cases in one overview." : "Alle Fristen deiner Fälle in einer gemeinsamen Übersicht."}</p>
          </div>
          <Link className="button button-primary" href={localizedPath("/dashboard", locale)}>{en ? "View cases" : "Zu den Fällen"}</Link>
        </header>

        {error ? <div className="form-error deadline-page-error" role="alert">{error}</div> : null}

        <div className="stats-grid deadline-stats-grid">
          <div className="stat-card deadline-stat-card deadline-stat-overdue">
            <span>{en ? "Overdue" : "Überfällig"}</span>
            <strong>{overdueCount}</strong>
            <small>{en ? "review now" : "sofort prüfen"}</small>
          </div>
          <div className="stat-card deadline-stat-card deadline-stat-soon">
            <span>{en ? "Next 7 days" : "Nächste 7 Tage"}</span>
            <strong>{soonCount}</strong>
            <small>{en ? "due soon" : "bald fällig"}</small>
          </div>
          <div className="stat-card deadline-stat-card">
            <span>{en ? "Open deadlines" : "Offene Fristen"}</span>
            <strong>{openCount}</strong>
            <small>{completedCount} {en ? "completed" : "erledigt"}</small>
          </div>
        </div>

        <div className="panel deadline-overview-panel">
          <div className="panel-header">
            <h2>{en ? "Deadline overview" : "Fristenübersicht"}</h2>
            <span>{deadlines.length} {en ? (deadlines.length === 1 ? "deadline" : "deadlines") : (deadlines.length === 1 ? "Frist" : "Fristen")}</span>
          </div>

          {deadlines.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⌛</div>
              <h3>{en ? "No deadlines yet" : "Noch keine Frist vorhanden"}</h3>
              <p>{en ? "Open a case file and add a reply, payment or processing deadline." : "Öffne eine Fallakte und lege dort eine Antwort-, Zahlungs- oder Bearbeitungsfrist an."}</p>
              <Link className="button button-primary" href={localizedPath("/dashboard", locale)}>{en ? "Select case" : "Fall auswählen"}</Link>
            </div>
          ) : (
            <div className="deadline-overview-list">
              {deadlines.map((deadline) => (
                <article
                  className={`deadline-overview-row deadline-state-${deadline.deadline_state}`}
                  key={deadline.id}
                >
                  <div className="deadline-date-block">
                    <strong>{formatDate(deadline.due_at, numberLocale)}</strong>
                    <span>{labels[deadline.deadline_state]}</span>
                  </div>

                  <div className="deadline-copy">
                    <h3>{deadline.title}</h3>
                    <p>
                      {deadline.case_title}
                      {deadline.company_name ? ` · ${deadline.company_name}` : ""}
                    </p>
                    {deadline.completed_at ? (
                      <small>{en ? "Completed on" : "Erledigt am"} {formatDateTime(deadline.completed_at, numberLocale)}</small>
                    ) : null}
                  </div>

                  <div className="deadline-row-actions">
                    <Link href={localizedPath(`/faelle/${deadline.case_id}`, locale)}>{en ? "Open case" : "Fall öffnen"}</Link>
                    {deadline.deadline_state !== "completed" ? (
                      <form action={`/api/deadlines/${deadline.id}/complete`} method="post">
                        <button type="submit">{en ? "Complete" : "Erledigen"}</button>
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
