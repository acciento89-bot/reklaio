import Link from "next/link";
import { requireUser } from "@/lib/auth";

const demoCases = [
  { title: "Rückzahlung Möbelhaus", company: "Beispiel GmbH", amount: "329,00 €", status: "Frist in 3 Tagen", tone: "warning" },
  { title: "Paket nicht angekommen", company: "Online-Shop", amount: "84,50 €", status: "Antwort ausstehend", tone: "neutral" },
  { title: "Fitnessstudio Kündigung", company: "FitPlus", amount: "39,90 €", status: "Eskalation prüfen", tone: "danger" }
];

export default async function DashboardPage() {
  const user = await requireUser();
  const accountName = user.displayName || user.email;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <nav>
          <Link className="active" href="/dashboard">Meine Fälle</Link>
          <Link href="/neuer-fall">Neuer Fall</Link>
          <a href="#">Dokumente</a>
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

        <div className="notice-card">
          <strong>Dein Konto ist aktiv.</strong>
          <span>Die unten sichtbaren Fälle sind noch Beispieldaten. Im nächsten Schritt werden echte Fälle gespeichert.</span>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><span>Aktive Fälle</span><strong>3</strong><small>Beispieldaten</small></div>
          <div className="stat-card"><span>Offener Betrag</span><strong>453,40 €</strong><small>Beispieldaten</small></div>
          <div className="stat-card"><span>Nächste Frist</span><strong>3 Tage</strong><small>Beispieldaten</small></div>
        </div>

        <div className="panel">
          <div className="panel-header"><h2>Beispiel-Fälle</h2><span>Vorschau</span></div>
          <div className="case-list">
            {demoCases.map((item) => (
              <article className="case-row" key={item.title}>
                <div className="case-row-main">
                  <div className="case-avatar">{item.title.charAt(0)}</div>
                  <div><h3>{item.title}</h3><p>{item.company}</p></div>
                </div>
                <strong>{item.amount}</strong>
                <span className={`status status-${item.tone}`}>{item.status}</span>
                <button type="button" aria-label={`${item.title} öffnen`}>→</button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
