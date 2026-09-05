import Link from "next/link";
import { hashAuthEmailToken } from "@/lib/auth-email-tokens";
import { query } from "@/lib/db";
import { getLocale, localizedPath } from "@/lib/i18n";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const locale = await getLocale();
  const en = locale === "en";
  const { token = "", error } = await searchParams;
  const tokenLooksValid = token.length >= 20 && token.length <= 200;

  const result = tokenLooksValid
    ? await query<{ valid: boolean }>(
        `SELECT TRUE AS valid
         FROM auth_email_tokens
         WHERE token_hash = $1
           AND purpose = 'reset_password'
           AND used_at IS NULL
           AND expires_at > NOW()
         LIMIT 1`,
        [hashAuthEmailToken(token)]
      )
    : { rows: [] as { valid: boolean }[] };

  const isValid = Boolean(result.rows[0]?.valid);

  return (
    <main className="auth-page container">
      <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
      <section className="auth-card">
        <span className="eyebrow">{en ? "Account security" : "Kontosicherheit"}</span>
        <h1>{en ? "New password" : "Neues Passwort"}</h1>

        {!isValid ? (
          <>
            <div className="form-error" role="alert">{en ? "The reset link is invalid or has expired." : "Der Reset-Link ist ungültig oder abgelaufen."}</div>
            <p className="auth-switch"><Link href={localizedPath("/passwort-vergessen", locale)}>{en ? "Request a new link" : "Neuen Link anfordern"}</Link></p>
          </>
        ) : (
          <>
            <p>{en ? "Choose a new password with at least 10 characters." : "Lege ein neues Passwort mit mindestens 10 Zeichen fest."}</p>
            {error ? <div className="form-error" role="alert">{error}</div> : null}
            <form className="auth-form" action="/api/auth/password/reset" method="post">
              <input name="token" type="hidden" value={token} />
              <input name="locale" type="hidden" value={locale} />
              <label>
                {en ? "New password" : "Neues Passwort"}
                <input name="password" type="password" minLength={10} maxLength={128} required autoComplete="new-password" />
              </label>
              <label>
                {en ? "Repeat password" : "Passwort wiederholen"}
                <input name="confirmPassword" type="password" minLength={10} maxLength={128} required autoComplete="new-password" />
              </label>
              <button className="button button-primary" type="submit">{en ? "Save password" : "Passwort speichern"}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
