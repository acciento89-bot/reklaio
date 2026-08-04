import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { legalOperator } from "@/lib/legal";

type ContactPageProps = {
  searchParams: Promise<{ sent?: string; error?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const user = await getCurrentUser();
  const { sent, error } = await searchParams;

  return (
    <main className="contact-page container">
      <header className="contact-header">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={user ? "/dashboard" : "/"}>← Zurück</Link>
      </header>

      <section className="contact-hero">
        <span className="eyebrow">Direkter Kontakt</span>
        <h1>Wie können wir helfen?</h1>
        <p>Nutze das Kontaktformular für Fragen zu Reklaio, deinem Konto, Datenschutz oder technischen Problemen. Für konkrete Rechtsberatung ist Reklaio nicht zuständig.</p>
      </section>

      {sent === "1" ? <div className="notice-card contact-success" role="status"><strong>Nachricht wurde versendet.</strong><span>Wir melden uns über die angegebene E-Mail-Adresse.</span></div> : null}
      {error ? <div className="form-error contact-success" role="alert">{error}</div> : null}

      <section className="contact-shell">
        <aside className="contact-info">
          <span className="eyebrow">Kontaktwege</span>
          <h2>Reklaio erreichen</h2>
          <p>Du kannst das Formular verwenden oder uns direkt eine E-Mail schreiben.</p>
          <p><strong>E-Mail</strong><br /><a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a></p>
          <p><strong>Kontaktformular</strong><br />Direkte elektronische Nachricht über diese Seite.</p>
          <p><strong>Antwort</strong><br />Die Rückmeldung erfolgt an deine angegebene E-Mail-Adresse.</p>
        </aside>

        <article className="contact-form-card">
          <span className="eyebrow">Nachricht senden</span>
          <h2>Kontaktformular</h2>
          <p>Pflichtfelder sind mit klarer Bezeichnung versehen. Bitte keine Passwörter, API-Schlüssel oder vollständigen Zahlungsdaten eintragen.</p>

          <form className="contact-form" action="/api/contact" method="post">
            <label className="field">
              Name
              <input name="name" type="text" maxLength={100} defaultValue={user?.displayName ?? ""} required autoComplete="name" />
            </label>
            <label className="field">
              E-Mail-Adresse
              <input name="email" type="email" maxLength={254} defaultValue={user?.email ?? ""} required autoComplete="email" />
            </label>
            <label className="field">
              Thema
              <select name="subject" defaultValue="Allgemeine Frage" required>
                <option>Allgemeine Frage</option>
                <option>Technisches Problem</option>
                <option>Konto und Anmeldung</option>
                <option>Datenschutz</option>
                <option>Abonnement und Rechnung</option>
              </select>
            </label>
            <label className="field field-full">
              Nachricht
              <textarea name="message" rows={8} minLength={20} maxLength={5000} required placeholder="Beschreibe dein Anliegen möglichst konkret." />
            </label>
            <label className="contact-honeypot" aria-hidden="true">
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="auth-consent-row">
              <input name="privacyAccepted" type="checkbox" required />
              <span>Ich habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> zur Verarbeitung meiner Kontaktanfrage gelesen.</span>
            </label>
            <button className="button button-primary" type="submit">Nachricht senden</button>
          </form>
        </article>
      </section>
    </main>
  );
}
