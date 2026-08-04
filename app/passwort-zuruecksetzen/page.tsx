import Link from "next/link";
import { hashAuthEmailToken } from "@/lib/auth-email-tokens";
import { query } from "@/lib/db";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
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
      <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
      <section className="auth-card">
        <span className="eyebrow">Kontosicherheit</span>
        <h1>Neues Passwort</h1>

        {!isValid ? (
          <>
            <div className="form-error" role="alert">Der Reset-Link ist ungültig oder abgelaufen.</div>
            <p className="auth-switch"><Link href="/passwort-vergessen">Neuen Link anfordern</Link></p>
          </>
        ) : (
          <>
            <p>Lege ein neues Passwort mit mindestens 10 Zeichen fest.</p>
            {error ? <div className="form-error" role="alert">{error}</div> : null}
            <form className="auth-form" action="/api/auth/password/reset" method="post">
              <input name="token" type="hidden" value={token} />
              <label>
                Neues Passwort
                <input name="password" type="password" minLength={10} maxLength={128} required autoComplete="new-password" />
              </label>
              <label>
                Passwort wiederholen
                <input name="confirmPassword" type="password" minLength={10} maxLength={128} required autoComplete="new-password" />
              </label>
              <button className="button button-primary" type="submit">Passwort speichern</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
