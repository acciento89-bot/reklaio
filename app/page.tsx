import Image from "next/image";
import Link from "next/link";
import { caseTypes } from "@/lib/case-types";
import { getCurrentUser } from "@/lib/auth";
import { CaseTypeIcon } from "@/components/case-type-icon";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="marketing-page">
      <header className="site-header container">
        <Link className="brand" href="/" aria-label="Reklaio Startseite">
          <span className="brand-mark">R</span>
          <span className="brand-copy"><strong>Reklaio</strong><small>by Kamilunavo</small></span>
        </Link>
        <nav className="header-actions" aria-label="Hauptnavigation">
          <Link className="text-link" href="#fallarten">Fallarten</Link>
          <Link className="text-link" href="#so-funktionierts">Ablauf</Link>
          <Link className="text-link" href="/preise">Preise</Link>
          <Link className="text-link" href="/kontakt">Kontakt</Link>
          {user ? (
            <Link className="button button-primary" href="/dashboard">Zum Dashboard</Link>
          ) : (
            <>
              <Link className="text-link" href="/anmelden">Anmelden</Link>
              <Link className="button button-primary" href="/registrieren">Kostenlos starten</Link>
            </>
          )}
        </nav>
      </header>

      <section className="brand-banner container" aria-label="Reklaio Markenbanner">
        <Image
          src="/reklaio-banner.svg"
          alt="Reklaio – Dein Fall. Deine Frist. Dein Überblick."
          width={2048}
          height={682}
          priority
        />
      </section>

      <section className="hero hero-brand-copy container">
        <div className="hero-content">
          <div className="eyebrow">Digitales Fallmanagement für Verbraucher</div>
          <h1>Reklamationen klar dokumentieren. <span>Fristen sicher im Blick behalten.</span></h1>
          <p className="hero-copy">
            Reklaio bündelt Belege, Kommunikation, Fristen und Schreiben in einer nachvollziehbaren Fallakte – vom ersten Problem bis zum Abschluss.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href={user ? "/neuer-fall" : "/registrieren"}>
              Fallakte anlegen
            </Link>
            <Link className="button button-secondary" href="/preise">Free und Pro vergleichen</Link>
          </div>
          <div className="trust-row" aria-label="Vorteile">
            <span>Geschützte Dokumente</span>
            <span>Automatische Fristerinnerungen</span>
            <span>Geführte nächste Schritte</span>
            <span>Keine Rechtsberatung</span>
          </div>
        </div>
      </section>

      <section className="professional-strip">
        <div className="container professional-strip-grid">
          <div><strong>Eine Fallakte</strong><span>Alle Informationen an einem Ort</span></div>
          <div><strong>Klare Chronik</strong><span>Zusagen und Ereignisse nachvollziehbar</span></div>
          <div><strong>Fallassistent</strong><span>Vollständigkeit und nächsten Schritt sehen</span></div>
          <div><strong>Free + Pro</strong><span>Kernfunktionen kostenlos, KI optional im Pro-Tarif</span></div>
        </div>
      </section>

      <section className="container section" id="fallarten">
        <div className="section-heading professional-section-heading">
          <div>
            <span className="eyebrow">Typische Verbraucherfälle</span>
            <h2>Mit der passenden Struktur starten</h2>
          </div>
          <p>Jede Fallart führt durch die relevanten Angaben und zeigt, welche Nachweise für die weitere Bearbeitung hilfreich sind.</p>
        </div>
        <div className="case-grid professional-case-grid">
          {caseTypes.map((item) => (
            <article className="case-card professional-case-card" key={item.slug}>
              <div className="case-icon" aria-hidden="true"><CaseTypeIcon type={item.dbValue} /></div>
              <div className="case-card-copy">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <ul>
                {item.checklist.slice(0, 2).map((entry) => <li key={entry}>{entry}</li>)}
              </ul>
              <Link href={user ? `/neuer-fall?typ=${item.slug}` : "/registrieren"}>Fallart auswählen <span>→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container section workflow-section" id="so-funktionierts">
        <div className="section-heading professional-section-heading">
          <div>
            <span className="eyebrow">Nachvollziehbarer Ablauf</span>
            <h2>Vom Problem zum empfohlenen nächsten Schritt</h2>
          </div>
          <p>Reklaio ersetzt kein juristisches Urteil. Es sorgt dafür, dass Informationen vollständig, geordnet und rechtzeitig verfügbar sind.</p>
        </div>
        <div className="workflow professional-workflow">
          {[
            ["01", "Fall erfassen", "Situation auswählen und die wichtigsten Eckdaten festhalten."],
            ["02", "Nachweise sammeln", "Rechnungen, E-Mails, Fotos und weitere Dokumente geschützt speichern."],
            ["03", "Fristen verfolgen", "Offene Termine zentral sehen und automatische Erinnerungen erhalten."],
            ["04", "Nächsten Schritt sehen", "Der Fallassistent bewertet Vollständigkeit und priorisiert die passende Aktion."]
          ].map(([number, title, text]) => (
            <div className="workflow-step" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container closing-cta">
        <div>
          <span className="eyebrow">Bereit für den ersten Fall?</span>
          <h2>Aus einzelnen Nachrichten wird eine vollständige, geführte Fallakte.</h2>
        </div>
        <div className="hero-actions">
          <Link className="button button-primary" href={user ? "/neuer-fall" : "/registrieren"}>Jetzt Fallakte anlegen</Link>
          <Link className="button button-secondary" href="/preise">Tarife ansehen</Link>
        </div>
      </section>

      <footer className="container footer">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span className="brand-copy"><strong>Reklaio</strong><small>by Kamilunavo</small></span>
        </Link>
        <p>Digitale Organisation von Verbraucherfällen · Keine Rechtsberatung.</p>
      </footer>
    </main>
  );
}
