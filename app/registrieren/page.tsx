import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type RegistrationPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegistrationPage({ searchParams }: RegistrationPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <main className="auth-page container">
      <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
      <section className="auth-card">
        <span className="eyebrow">Dein erster Fall</span>
        <h1>Konto erstellen</h1>
        <p>Deine Fälle und Fristen bleiben deinem persönlichen Konto zugeordnet.</p>

        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <form className="auth-form" action="/api/auth/register" method="post">
          <label>
            Name <span>(optional)</span>
            <input name="displayName" type="text" autoComplete="name" maxLength={80} />
          </label>
          <label>
            E-Mail-Adresse
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Passwort
            <input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
            <small>Mindestens 10 Zeichen.</small>
          </label>

          <label className="auth-consent-row">
            <input name="acceptTerms" type="checkbox" required />
            <span>Ich akzeptiere die <Link href="/nutzungsbedingungen" target="_blank">Nutzungsbedingungen</Link>.</span>
          </label>
          <label className="auth-consent-row">
            <input name="acknowledgePrivacy" type="checkbox" required />
            <span>Ich habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> gelesen.</span>
          </label>
          <p className="auth-legal-hint">Die KI-Funktionen sind freiwillig. Eine Zustimmung dazu wird erst direkt vor einer Analyse oder einem KI-Entwurf abgefragt.</p>

          <button className="button button-primary" type="submit">Konto erstellen</button>
        </form>

        <p className="auth-switch">Schon registriert? <Link href="/anmelden">Anmelden</Link></p>
      </section>
    </main>
  );
}
