import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocale, localizedPath } from "@/lib/i18n";

type RegistrationPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegistrationPage({ searchParams }: RegistrationPageProps) {
  const locale = await getLocale();
  const en = locale === "en";
  const user = await getCurrentUser();
  if (user) redirect(localizedPath("/dashboard", locale));
  const { error } = await searchParams;

  return (
    <main className="auth-page container">
      <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
      <section className="auth-card">
        <span className="eyebrow">{en ? "Your first case" : "Dein erster Fall"}</span>
        <h1>{en ? "Create account" : "Konto erstellen"}</h1>
        <p>{en ? "Your cases and deadlines stay linked to your personal account." : "Deine Fälle und Fristen bleiben deinem persönlichen Konto zugeordnet."}</p>
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <form className="auth-form" action="/api/auth/register" method="post">
          <input type="hidden" name="locale" value={locale} />
          <label>{en ? "Name" : "Name"} <span>({en ? "optional" : "optional"})</span><input name="displayName" type="text" autoComplete="name" maxLength={80} /></label>
          <label>{en ? "Email address" : "E-Mail-Adresse"}<input name="email" type="email" autoComplete="email" required /></label>
          <label>{en ? "Password" : "Passwort"}<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /><small>{en ? "At least 10 characters." : "Mindestens 10 Zeichen."}</small></label>
          <label className="auth-consent-row"><input name="acceptTerms" type="checkbox" required /><span>{en ? "I accept the " : "Ich akzeptiere die "}<Link href={localizedPath("/agb", locale)} target="_blank">{en ? "Terms and Conditions" : "Allgemeinen Geschäftsbedingungen (AGB)"}</Link>.</span></label>
          <label className="auth-consent-row"><input name="acknowledgePrivacy" type="checkbox" required /><span>{en ? "I have read the " : "Ich habe die "}<Link href={localizedPath("/datenschutz", locale)} target="_blank">{en ? "Privacy Policy" : "Datenschutzerklärung"}</Link>{en ? "." : " gelesen."}</span></label>
          <p className="auth-legal-hint">{en ? "AI features are optional. Consent is requested only immediately before an analysis or AI draft." : "Die KI-Funktionen sind freiwillig. Eine Zustimmung dazu wird erst direkt vor einer Analyse oder einem KI-Entwurf abgefragt."}</p>
          <button className="button button-primary" type="submit">{en ? "Create account" : "Konto erstellen"}</button>
        </form>
        <p className="auth-switch">{en ? "Already registered?" : "Schon registriert?"} <Link href={localizedPath("/anmelden", locale)}>{en ? "Sign in" : "Anmelden"}</Link></p>
      </section>
    </main>
  );
}
