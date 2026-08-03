import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/cases";

type DeadlineRow = {
  id: string;
  case_id: string;
  case_title: string;
  company_name: string | null;
  title: string;
  due_at: string;
  completed_at: string | null;
};

function deadlineState(deadline: DeadlineRow, now: number, soonLimit: number) {
  if (deadline.completed_at) {
    return { key: "completed", label: "Erledigt", tone: "success" } as const;
  }

  const dueAt = new Date(deadline.due_at).getTime();
  if (dueAt < now) {
    return { key: "overdue", label: "Überfällig", tone: "danger" } as const;
  }

  if (dueAt <= soonLimit) {
    return { key: "soon", label: "Bald fällig", tone: "warning" } as const;
  }

  return { key: "open", label: "Offen", tone: "neutral" } as const;
}

export default async function DeadlinesPage() {
  const user = await requireUser();
  const accountName = user.displayName || user.email;

  const result = await query<DeadlineRow>(
    `SELECT
       d.id,
       d.case_id,
       c.title AS case_title,
       c.company_name,
       d.title,
       d.due_at,
       d.completed_at
     FROM case_deadlines d
     JOIN cases c ON c.id = d.case_id
     WHERE c.user_id = $1
     ORDER BY (d.completed_at IS NOT NULL), d.due_at ASC`,
    [user.id]
  );

  const now = Date.now();
  const soonLimit = now + 7 * 24 * 60 * 60 * 1000;
  const deadlines = result.rows.map((deadline) => ({
    ...deadline,
    state: deadlineState(deadline, now, soonLimit)
  }));

  const overdue = deadlines.filter((item) => item.state.key === "overdue");
  const soon = deadlines.filter((item) => item.state.key === "soon");
  const open = deadlines.filter((item) => item.state.key === "open");
  const completed = deadlines.filter((item) => item.state.key === "completed");
  const active = deadlines.filter((item) => item.state.key !== "completed");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
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
            <p className="dashboard-welcome">Alle offenen und erledigten Fristen aus deinen Fällen.</p>
          </div>
          <Link className="button button-primary" href="/dashboard">Zu den Fällen</Link>
        </header>

        <div className="stats-grid deadline-stats">
          <div className="stat-card deadline-stat-danger">
            <span>Überfällig</span>
            <strong>{overdue.length}</strong>
            <small>sofort prüfen</small>
          </div>
          <div className="stat-card deadline-stat-warning">
            <span>Nächste 7 Tage</span>
            <strong>{soon.length}</strong>
            <small>bald fällig</small>
          </div>
          <div className="stat-card">
            <span>Offene Fristen</span>
            <strong>{active.length}</strong>
            <small>{completed.length} erledigt</small>
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
              <h3>Noch keine Frist erfasst</h3>
              <p>Öffne einen Fall und lege dort eine Zahlungs-, Antwort- oder sonstige Bearbeitungsfrist an.</p>
              <Link className="button button-primary" href="/dashboard">Fall öffnen</Link>
            </div>
          ) : (
            <div className="deadline-overview-list">
              {[...overdue, ...soon, ...open, ...completed].map((deadline) => (
                <article className={`deadline-overview-item deadline-overview-${deadline.state.key}`} key={deadline.id}>
                  <div className="deadline-overview-date">
                    <strong>{formatDate(deadline.due_at)}</strong>
                    <span className={`status status-${deadline.state.tone}`}>{deadline.state.label}</span>
                  </div>

                  <div className="deadline-overview-main">
                    <h3>{deadline.title}</h3>
                    <p>{deadline.case_title}{deadline.company_name ? ` · ${deadline.company_name}` : ""}</p>
                    {deadline.completed_at ? <small>Erledigt am {formatDateTime(deadline.completed_at)}</small> : null}
                  </div>

                  <div className="deadline-overview-actions">
                    <Link href={`/faelle/${deadline.case_id}`}>Fall öffnen</Link>
                    {!deadline.completed_at ? (
                      <form action={`/api/cases/${deadline.case_id}/deadlines/${deadline.id}/complete`} method="post">
                        <input type="hidden" name="returnTo" value="/fristen" />
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
