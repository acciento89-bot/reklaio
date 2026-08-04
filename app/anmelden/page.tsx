import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; deleted?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const { error, deleted } = await searchParams;

  return (
    <main className="auth-page container">
      <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
      <section className="auth-card">
        <span className="eyebrow">Willkommen zurück</span>
        <h1>Anmelden</h1>
        <p>Öffne deine Fälle, Fristen und Dokumente.</p>

        {deleted === "1" ? (
          <div className="notice-card auth-deleted-notice" role="status">
            <strong>Dein Reklaio-Konto wurde gelöscht.</strong>
            <span>Alle zugehörigen Fälle und Kontodaten wurden entfernt.</span>
          </div>
        ) : null}

        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <form className="auth-form" action="/api/auth/login" method="post">
          <label>
            E-Mail-Adresse
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Passwort
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="button button-primary" type="submit">Anmelden</button>
        </form>

        <p className="auth-switch">Noch kein Konto? <Link href="/registrieren">Kostenlos registrieren</Link></p>
      </section>
    </main>
  );
}
