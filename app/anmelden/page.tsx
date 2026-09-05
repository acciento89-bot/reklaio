import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocale, localizedPath } from "@/lib/i18n";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; deleted?: string; notice?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const locale = await getLocale();
  const en = locale === "en";
  const user = await getCurrentUser();
  if (user) {
    redirect(localizedPath("/dashboard", locale));
  }

  const { error, deleted, notice } = await searchParams;

  return (
    <main className="auth-page container">
      <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
      <section className="auth-card">
        <span className="eyebrow">{en ? "Welcome back" : "Willkommen zurück"}</span>
        <h1>{en ? "Sign in" : "Anmelden"}</h1>
        <p>{en ? "Open your cases, deadlines and documents." : "Öffne deine Fälle, Fristen und Dokumente."}</p>

        {deleted === "1" ? (
          <div className="notice-card auth-deleted-notice" role="status">
            <strong>{en ? "Your Reklaio account has been deleted." : "Dein Reklaio-Konto wurde gelöscht."}</strong>
            <span>{en ? "All associated cases and account data have been removed." : "Alle zugehörigen Fälle und Kontodaten wurden entfernt."}</span>
          </div>
        ) : null}

        {notice ? <div className="notice-card auth-deleted-notice" role="status"><strong>{notice}</strong></div> : null}
        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <form className="auth-form" action="/api/auth/login" method="post">
          <input type="hidden" name="locale" value={locale} />
          <label>
            {en ? "Email address" : "E-Mail-Adresse"}
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            {en ? "Password" : "Passwort"}
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <div className="auth-password-help"><Link href={localizedPath("/passwort-vergessen", locale)}>{en ? "Forgot password?" : "Passwort vergessen?"}</Link></div>
          <button className="button button-primary" type="submit">{en ? "Sign in" : "Anmelden"}</button>
        </form>

        <p className="auth-switch">{en ? "No account yet?" : "Noch kein Konto?"} <Link href={localizedPath("/registrieren", locale)}>{en ? "Register for free" : "Kostenlos registrieren"}</Link></p>
      </section>
    </main>
  );
}
