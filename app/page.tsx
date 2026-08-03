import Link from "next/link";
import { caseTypes } from "@/lib/case-types";

export default function HomePage() {
  return (
    <main>
      <header className="site-header container">
        <Link className="brand" href="/" aria-label="Reklaio Startseite">
          <span className="brand-mark">R</span>
          <span>Reklaio</span>
        </Link>
        <nav className="header-actions" aria-label="Hauptnavigation">
          <Link className="text-link" href="#so-funktionierts">So funktioniert’s</Link>
          <Link className="button button-secondary" href="/dashboard">Demo öffnen</Link>
        </nav>
      </header>

      <section className="hero container">
        <div className="eyebrow">Reklaio by Kamilunavo</div>
        <h1>Dein Fall. Deine Frist. <span>Dein Überblick.</span></h1>
        <p className="hero-copy">
          Reklamationen, Rückzahlungen und Kündigungen endlich an einem Ort – mit Belegen,
          Chronik, Fristen und dem nächsten sinnvollen Schritt.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/neuer-fall">Neuen Fall starten</Link>
          <Link className="button button-ghost" href="/dashboard">Beispiel-Dashboard</Link>
        </div>
        <div className="trust-row">
          <span>Keine Rechtsberatung</span>
          <span>Dokumente geschützt</span>
          <span>Für Handy und Desktop</span>
        </div>
      </section>

      <section className="container section" id="so-funktionierts">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Zum Start</span>
            <h2>Vier typische Fälle, klar geführt</h2>
          </div>
          <p>Reklaio fragt nur das ab, was für deinen Fall wirklich benötigt wird.</p>
        </div>
        <div className="case-grid">
          {caseTypes.map((item) => (
            <article className="case-card" key={item.slug}>
              <div className="case-icon" aria-hidden="true">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <Link href={`/neuer-fall?typ=${item.slug}`}>Fall anlegen <span>→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container section workflow-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Nicht nur ein KI-Chat</span>
            <h2>Ein Fall bleibt nachvollziehbar</h2>
          </div>
        </div>
        <div className="workflow">
          {[
            ["01", "Belege sammeln", "Rechnung, E-Mails, Tracking und Screenshots zusammenführen."],
            ["02", "Chronik aufbauen", "Wichtige Ereignisse und Zusagen automatisch sortieren."],
            ["03", "Frist verfolgen", "Reklaio merkt sich, wann eine Antwort oder Zahlung fällig ist."],
            ["04", "Nächsten Schritt wählen", "Passende Nachricht vorbereiten und den Fall sauber dokumentieren."]
          ].map(([number, title, text]) => (
            <div className="workflow-step" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="container footer">
        <div>
          <strong>Reklaio</strong>
          <span>by Kamilunavo</span>
        </div>
        <p>Früher Produktprototyp – keine Rechtsberatung.</p>
      </footer>
    </main>
  );
}
