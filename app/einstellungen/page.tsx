import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/cases";
import { query } from "@/lib/db";

type SettingsPageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

type AccountRow = {
  display_name: string | null;
  email: string;
  email_verified_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await requireUser();
  const { notice, error } = await searchParams;

  const result = await query<AccountRow>(
    `SELECT display_name, email, email_verified_at, created_at, updated_at
     FROM app_users
     WHERE id = $1
     LIMIT 1`,
    [user.id]
  );

  const account = result.rows[0];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <nav>
          <Link href="/dashboard">Meine Fälle</Link>
          <Link href="/neuer-fall">Neuer Fall</Link>
          <Link href="/fristen">Fristen</Link>
          <Link href="/dokumente">Dokumente</Link>
          <Link className="active" href="/einstellungen">Einstellungen</Link>
        </nav>
        <div className="sidebar-account">
          <strong>{account?.display_name || account?.email || user.email}</strong>
          <span>{account?.email || user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit">Abmelden</button>
          </form>
        </div>
      </aside>

      <section className="app-content settings-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">Konto & Sicherheit</span>
            <h1>Einstellungen</h1>
            <p className="dashboard-welcome">Verwalte dein Profil, Passwort und deine gespeicherten Daten.</p>
          </div>
          <Link className="button button-primary" href="/dashboard">Zu den Fällen</Link>
        </header>

        {notice ? <div className="notice-card settings-notice" role="status"><strong>{notice}</strong></div> : null}
        {error ? <div className="form-error settings-error" role="alert">{error}</div> : null}

        <div className="settings-grid">
          <section className="panel settings-panel">
            <div className="settings-panel-heading">
              <div>
                <span className="eyebrow">Profil</span>
                <h2>Persönliche Angaben</h2>
              </div>
              <span>Mitglied seit {formatDateTime(account?.created_at ?? null)}</span>
            </div>

            <form className="settings-form" action="/api/account/profile" method="post">
              <label className="field">
                Anzeigename
                <input
                  name="displayName"
                  type="text"
                  maxLength={80}
                  defaultValue={account?.display_name ?? ""}
                  placeholder="Dein Name"
                  autoComplete="name"
                />
              </label>
              <label className="field">
                E-Mail-Adresse
                <input type="email" value={account?.email ?? user.email} readOnly aria-readonly="true" />
                <small>Die E-Mail kann erst geändert werden, sobald E-Mail-Verifizierung und Wiederherstellung eingebaut sind.</small>
              </label>
              <button className="button button-secondary" type="submit">Profil speichern</button>
            </form>
          </section>

          <section className="panel settings-panel">
            <div className="settings-panel-heading">
              <div>
                <span className="eyebrow">Sicherheit</span>
                <h2>Passwort ändern</h2>
              </div>
              <span>Mindestens 10 Zeichen</span>
            </div>

            <form className="settings-form" action="/api/account/password" method="post">
              <label className="field">
                Aktuelles Passwort
                <input name="currentPassword" type="password" minLength={10} maxLength={128} required autoComplete="current-password" />
              </label>
              <label className="field">
                Neues Passwort
                <input name="newPassword" type="password" minLength={10} maxLength={128} required autoComplete="new-password" />
              </label>
              <label className="field">
                Neues Passwort wiederholen
                <input name="confirmPassword" type="password" minLength={10} maxLength={128} required autoComplete="new-password" />
              </label>
              <button className="button button-secondary" type="submit">Passwort aktualisieren</button>
            </form>
          </section>

          <section className="panel settings-panel settings-data-panel">
            <div className="settings-panel-heading">
              <div>
                <span className="eyebrow">Datenschutz</span>
                <h2>Kontodaten exportieren</h2>
              </div>
            </div>
            <p>Der JSON-Export enthält dein Profil, Fälle, Chronik, Fristen, Schreiben und Dokumentinformationen. Passwörter, Sitzungstoken und hochgeladene Binärdateien werden nicht hineingeschrieben.</p>
            <a className="button button-secondary" href="/api/account/export">Meine Daten herunterladen</a>
          </section>

          <section className="panel settings-panel settings-danger-panel">
            <div className="settings-panel-heading">
              <div>
                <span className="eyebrow">Gefahrenbereich</span>
                <h2>Konto endgültig löschen</h2>
              </div>
            </div>
            <p>Dadurch werden dein Konto, alle Fälle, Schreiben, Fristen, Chronikeinträge und hochgeladenen Dateien dauerhaft entfernt. Dieser Vorgang kann nicht rückgängig gemacht werden.</p>

            <form className="settings-form" action="/api/account/delete" method="post">
              <label className="field">
                Aktuelles Passwort
                <input name="password" type="password" minLength={10} maxLength={128} required autoComplete="current-password" />
              </label>
              <label className="field">
                Zur Bestätigung LÖSCHEN eingeben
                <input name="confirmation" type="text" required autoComplete="off" />
              </label>
              <button className="button settings-delete-button" type="submit">Konto unwiderruflich löschen</button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
