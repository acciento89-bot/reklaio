import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/einstellungen");
  }

  const { notice, error } = await searchParams;

  return (
    <main className="auth-page container">
      <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
      <section className="auth-card">
        <span className="eyebrow">Kontozugang</span>
        <h1>Passwort vergessen</h1>
        <p>Gib deine E-Mail-Adresse ein. Falls ein Konto existiert, senden wir dir einen einmaligen Link.</p>

        {notice ? <div className="notice-card" role="status"><strong>{notice}</strong></div> : null}
        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <form className="auth-form" action="/api/auth/password/request" method="post">
          <label>
            E-Mail-Adresse
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <button className="button button-primary" type="submit">Reset-Link anfordern</button>
        </form>

        <p className="auth-switch"><Link href="/anmelden">Zurück zur Anmeldung</Link></p>
      </section>
    </main>
  );
}
