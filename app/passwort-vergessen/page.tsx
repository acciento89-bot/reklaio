import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocale, localizedPath } from "@/lib/i18n";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const locale = await getLocale();
  const en = locale === "en";
  const user = await getCurrentUser();
  if (user) {
    redirect(localizedPath("/einstellungen", locale));
  }

  const { notice, error } = await searchParams;

  return (
    <main className="auth-page container">
      <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
      <section className="auth-card">
        <span className="eyebrow">{en ? "Account access" : "Kontozugang"}</span>
        <h1>{en ? "Forgot password" : "Passwort vergessen"}</h1>
        <p>{en ? "Enter your email address. If an account exists, we will send you a one-time link." : "Gib deine E-Mail-Adresse ein. Falls ein Konto existiert, senden wir dir einen einmaligen Link."}</p>

        {notice ? <div className="notice-card" role="status"><strong>{notice}</strong></div> : null}
        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <form className="auth-form" action="/api/auth/password/request" method="post">
          <input type="hidden" name="locale" value={locale} />
          <label>
            {en ? "Email address" : "E-Mail-Adresse"}
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <button className="button button-primary" type="submit">{en ? "Request reset link" : "Reset-Link anfordern"}</button>
        </form>

        <p className="auth-switch"><Link href={localizedPath("/anmelden", locale)}>{en ? "Back to sign in" : "Zurück zur Anmeldung"}</Link></p>
      </section>
    </main>
  );
}
