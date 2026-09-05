import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLocale, localizedPath } from "@/lib/i18n";

export default async function HelpPage() {
  const locale = await getLocale();
  const en = locale === "en";
  const user = await getCurrentUser();
  const cards = en ? [
    ["Getting started","Guided onboarding","Five steps take you from your first case through evidence and deadlines to the case assistant.",user ? "/onboarding" : "/registrieren",user ? "Open onboarding" : "Create account"],
    ["Case file","Everything in one place","Keep the provider, reference, amount, timeline, tasks, replies, deadlines and letters together in one protected case.",user ? "/dashboard" : "/registrieren","Open cases"],
    ["Documents","AI analysis only with consent","PDFs and supported images can be analysed optionally. Reklaio shows detected values and passages but never applies them without asking.",user ? "/dokumente" : "/datenschutz",user ? "Open documents" : "Read privacy policy"],
    ["Letters","Template or AI draft","Every letter remains editable. Check the facts, recipient, deadline and attachments before sending it.",user ? "/dashboard" : "/nutzungsbedingungen",user ? "Select case" : "Read terms"],
    ["Deadlines","Reminders and tasks","Deadlines and tasks appear in your workspace. Email reminders work after your account email has been confirmed.",user ? "/fristen" : "/anmelden",user ? "Open deadlines" : "Sign in"],
    ["Important","No legal advice","Reklaio organises information and helps with wording. It does not decide whether a claim exists or which legal step is right for an individual case.","/nutzungsbedingungen","Terms of use"]
  ] : null;

  return (
    <main className="legal-page">
      <header className="legal-header container">
        <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={localizedPath(user ? "/dashboard" : "/", locale)}>← {en ? "Back" : "Zurück"}</Link>
      </header>

      <section className="legal-hero container">
        <span className="eyebrow">{en ? "Help & guidance" : "Hilfe & Orientierung"}</span>
        <h1>{en ? "How to use Reklaio" : "So arbeitest du mit Reklaio"}</h1>
        <p>{en ? "Quick explanations of case files, documents, deadlines, letters and optional AI features." : "Kurze Erklärungen zu Fallakten, Dokumenten, Fristen, Schreiben und freiwilligen KI-Funktionen."}</p>
      </section>

      <section className="legal-content container">
        <div className="help-grid">
          {cards ? cards.map(([eyebrow,title,description,href,action]) => <article className="help-card" key={title}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p><Link className="button button-secondary" href={localizedPath(href, locale)}>{action}</Link></article>) : <>
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
          </>}
        </div>
      </section>
    </main>
  );
}
