import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function HelpPage() {
  const user = await getCurrentUser();

  return (
    <main className="legal-page">
      <header className="legal-header container">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={user ? "/dashboard" : "/"}>← Zurück</Link>
      </header>

      <section className="legal-hero container">
        <span className="eyebrow">Hilfe & Orientierung</span>
        <h1>So arbeitest du mit Reklaio</h1>
        <p>Kurze Erklärungen zu Fallakten, Dokumenten, Fristen, Schreiben und freiwilligen KI-Funktionen.</p>
      </section>

      <section className="legal-content container">
        <div className="help-grid">
          <article className="help-card">
            <span className="eyebrow">Erste Schritte</span>
            <h2>Geführtes Onboarding</h2>
            <p>Die Einführung führt in fünf Schritten vom ersten Fall über Belege und Fristen bis zum Fallassistenten.</p>
            <Link className="button button-secondary" href={user ? "/onboarding" : "/registrieren"}>{user ? "Einführung öffnen" : "Konto erstellen"}</Link>
          </article>

          <article className="help-card">
            <span className="eyebrow">Fallakte</span>
            <h2>Alles an einem Ort</h2>
            <p>Speichere Anbieter, Referenz, Betrag, Chronik, Aufgaben, Antworten, Fristen und Schreiben gemeinsam in einem geschützten Fall.</p>
            <Link className="button button-secondary" href={user ? "/dashboard" : "/registrieren"}>Fälle öffnen</Link>
          </article>

          <article className="help-card">
            <span className="eyebrow">Dokumente</span>
            <h2>KI-Analyse nur nach Zustimmung</h2>
            <p>PDFs und unterstützte Bilder können freiwillig analysiert werden. Reklaio zeigt erkannte Werte und Textstellen, übernimmt aber nichts ungefragt.</p>
            <Link className="button button-secondary" href={user ? "/dokumente" : "/datenschutz"}>{user ? "Dokumente öffnen" : "Datenschutz lesen"}</Link>
          </article>

          <article className="help-card">
            <span className="eyebrow">Schreiben</span>
            <h2>Vorlage oder KI-Entwurf</h2>
            <p>Jedes Schreiben bleibt bearbeitbar. Prüfe Tatsachen, Empfänger, Frist und Anhänge vor dem Versand. Entwürfe können dupliziert oder sicher gelöscht werden.</p>
            <Link className="button button-secondary" href={user ? "/dashboard" : "/nutzungsbedingungen"}>{user ? "Fall auswählen" : "Regeln lesen"}</Link>
          </article>

          <article className="help-card">
            <span className="eyebrow">Fristen</span>
            <h2>Erinnerungen und Aufgaben</h2>
            <p>Fristen und Aufgaben erscheinen in der Arbeitszentrale. E-Mail-Erinnerungen funktionieren nach bestätigter Konto-E-Mail.</p>
            <Link className="button button-secondary" href={user ? "/fristen" : "/anmelden"}>{user ? "Fristen öffnen" : "Anmelden"}</Link>
          </article>

          <article className="help-card">
            <span className="eyebrow">Wichtig</span>
            <h2>Keine Rechtsberatung</h2>
            <p>Reklaio organisiert Informationen und hilft beim Formulieren. Es entscheidet nicht, ob ein Anspruch besteht oder welcher rechtliche Schritt im Einzelfall richtig ist.</p>
            <Link className="button button-secondary" href="/nutzungsbedingungen">Nutzungsbedingungen</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
