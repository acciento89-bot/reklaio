import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatCurrency, formatDate, getCaseStatus, type CaseStatus } from "@/lib/cases";
import { getCaseTypeByValue, type CaseTypeValue } from "@/lib/case-types";

type DashboardCase = {
  id: string;
  type: CaseTypeValue;
  status: CaseStatus;
  title: string;
  company_name: string | null;
  amount_cents: number | null;
  currency: string;
  updated_at: string;
  next_due_at: string | null;
};

export default async function DashboardPage() {
  const user = await requireUser();
  const accountName = user.displayName || user.email;

  const result = await query<DashboardCase>(
    `SELECT
       c.id,
       c.type,
       c.status,
       c.title,
       c.company_name,
       c.amount_cents,
       c.currency,
       c.updated_at,
       (
         SELECT MIN(d.due_at)
         FROM case_deadlines d
         WHERE d.case_id = c.id
           AND d.completed_at IS NULL
       ) AS next_due_at
     FROM cases c
     WHERE c.user_id = $1
     ORDER BY c.updated_at DESC`,
    [user.id]
  );

  const cases = result.rows;
  const activeCases = cases.filter((item) => !["resolved", "closed"].includes(item.status));
  const openAmount = activeCases.reduce((sum, item) => sum + (item.amount_cents ?? 0), 0);
  const nextDeadline = cases
    .map((item) => item.next_due_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <nav>
          <Link className="active" href="/dashboard">Meine Fälle</Link>
          <Link href="/neuer-fall">Neuer Fall</Link>
          <Link href="/fristen">Fristen</Link>
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
            <span className="eyebrow">Übersicht</span>
            <h1>Meine Fälle</h1>
            <p className="dashboard-welcome">Willkommen, {user.displayName || user.email}.</p>
          </div>
          <Link className="button button-primary" href="/neuer-fall">+ Neuer Fall</Link>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Aktive Fälle</span>
            <strong>{activeCases.length}</strong>
            <small>{cases.length} insgesamt</small>
          </div>
          <div className="stat-card">
            <span>Offener Betrag</span>
            <strong>{formatCurrency(openAmount)}</strong>
            <small>über aktive Fälle</small>
          </div>
          <div className="stat-card">
            <span>Nächste Frist</span>
            <strong>{nextDeadline ? formatDate(nextDeadline) : "Keine"}</strong>
            <small>{nextDeadline ? "offene Frist" : "noch keine Frist erfasst"}</small>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Deine Fälle</h2>
            <span>{cases.length} {cases.length === 1 ? "Fall" : "Fälle"}</span>
          </div>

          {cases.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">+</div>
              <h3>Noch kein Fall angelegt</h3>
              <p>Lege deinen ersten Fall an und sammle Anbieter, Betrag, Chronik und Fristen an einem Ort.</p>
              <Link className="button button-primary" href="/neuer-fall">Ersten Fall anlegen</Link>
            </div>
          ) : (
            <div className="case-list">
              {cases.map((item) => {
                const status = getCaseStatus(item.status);
                const type = getCaseTypeByValue(item.type);

                return (
                  <Link className="case-row" href={`/faelle/${item.id}`} key={item.id}>
                    <div className="case-row-main">
                      <div className="case-avatar">{type?.icon ?? item.title.charAt(0)}</div>
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.company_name || type?.title || "Ohne Anbieter"}</p>
                      </div>
                    </div>
                    <strong>{formatCurrency(item.amount_cents, item.currency)}</strong>
                    <span className={`status status-${status.tone}`}>{status.label}</span>
                    <span className="case-row-arrow" aria-hidden="true">→</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
