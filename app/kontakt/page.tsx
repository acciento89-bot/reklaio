import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { legalOperator } from "@/lib/legal";
import { getLocale, localizedPath } from "@/lib/i18n";

type ContactPageProps = {
  searchParams: Promise<{ sent?: string; error?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const locale = await getLocale();
  const en = locale === "en";
  const user = await getCurrentUser();
  const { sent, error } = await searchParams;

  return (
    <main className="contact-page container">
      <header className="contact-header">
        <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={localizedPath(user ? "/dashboard" : "/", locale)}>← {en ? "Back" : "Zurück"}</Link>
      </header>

      <section className="contact-hero">
        <span className="eyebrow">{en ? "Contact" : "Direkter Kontakt"}</span>
        <h1>{en ? "How can we help?" : "Wie können wir helfen?"}</h1>
        <p>{en ? "Use the contact form for questions about Reklaio, your account, privacy or technical problems. Reklaio does not provide individual legal advice." : "Nutze das Kontaktformular für Fragen zu Reklaio, deinem Konto, Datenschutz oder technischen Problemen. Für konkrete Rechtsberatung ist Reklaio nicht zuständig."}</p>
      </section>

      {sent === "1" ? <div className="notice-card contact-success" role="status"><strong>{en ? "Message sent." : "Nachricht wurde versendet."}</strong><span>{en ? "We will reply to the email address you provided." : "Wir melden uns über die angegebene E-Mail-Adresse."}</span></div> : null}
      {error ? <div className="form-error contact-success" role="alert">{error}</div> : null}

      <section className="contact-shell">
        <aside className="contact-info">
          <span className="eyebrow">{en ? "Ways to contact us" : "Kontaktwege"}</span>
          <h2>{en ? "Reach Reklaio" : "Reklaio erreichen"}</h2>
          <p>{en ? "Use the form or email us directly." : "Du kannst das Formular verwenden oder uns direkt eine E-Mail schreiben."}</p>
          <p><strong>Email</strong><br /><a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a></p>
          <p><strong>{en ? "Contact form" : "Kontaktformular"}</strong><br />{en ? "Send a direct electronic message from this page." : "Direkte elektronische Nachricht über diese Seite."}</p>
          <p><strong>{en ? "Reply" : "Antwort"}</strong><br />{en ? "We reply to the email address you provide." : "Die Rückmeldung erfolgt an deine angegebene E-Mail-Adresse."}</p>
        </aside>

        <article className="contact-form-card">
          <span className="eyebrow">{en ? "Send a message" : "Nachricht senden"}</span>
          <h2>{en ? "Contact form" : "Kontaktformular"}</h2>
          <p>{en ? "Required fields are clearly labelled. Do not enter passwords, API keys or complete payment details." : "Pflichtfelder sind mit klarer Bezeichnung versehen. Bitte keine Passwörter, API-Schlüssel oder vollständigen Zahlungsdaten eintragen."}</p>

          <form className="contact-form" action="/api/contact" method="post">
            <input type="hidden" name="locale" value={locale} />
            <label className="field">
              Name
              <input name="name" type="text" maxLength={100} defaultValue={user?.displayName ?? ""} required autoComplete="name" />
            </label>
            <label className="field">
              {en ? "Email address" : "E-Mail-Adresse"}
              <input name="email" type="email" maxLength={254} defaultValue={user?.email ?? ""} required autoComplete="email" />
            </label>
            <label className="field">
              {en ? "Subject" : "Thema"}
              <select name="subject" defaultValue={en ? "General question" : "Allgemeine Frage"} required>
                {(en ? ["General question","Technical problem","Account and sign-in","Privacy","Subscription and billing"] : ["Allgemeine Frage","Technisches Problem","Konto und Anmeldung","Datenschutz","Abonnement und Rechnung"]).map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="field field-full">
              {en ? "Message" : "Nachricht"}
              <textarea name="message" rows={8} minLength={20} maxLength={5000} required placeholder={en ? "Describe your request as clearly as possible." : "Beschreibe dein Anliegen möglichst konkret."} />
            </label>
            <label className="contact-honeypot" aria-hidden="true">
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="auth-consent-row">
              <input name="privacyAccepted" type="checkbox" required />
              <span>{en ? "I have read the " : "Ich habe die "}<Link href={localizedPath("/datenschutz", locale)} target="_blank">{en ? "Privacy Policy" : "Datenschutzerklärung"}</Link>{en ? " regarding the processing of my contact request." : " zur Verarbeitung meiner Kontaktanfrage gelesen."}</span>
            </label>
            <button className="button button-primary" type="submit">{en ? "Send message" : "Nachricht senden"}</button>
          </form>
        </article>
      </section>
    </main>
  );
}
