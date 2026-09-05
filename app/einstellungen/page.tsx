import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/cases";
import { query } from "@/lib/db";
import { getLocale, localizedPath } from "@/lib/i18n";

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
  const locale = await getLocale();
  const en = locale === "en";
  const numberLocale = en ? "en-GB" : "de-DE";
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
  const emailVerified = Boolean(account?.email_verified_at);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <nav>
          <Link href={localizedPath("/dashboard", locale)}>{en ? "My cases" : "Meine Fälle"}</Link>
          <Link href={localizedPath("/neuer-fall", locale)}>{en ? "New case" : "Neuer Fall"}</Link>
          <Link href={localizedPath("/fristen", locale)}>{en ? "Deadlines" : "Fristen"}</Link>
          <Link href={localizedPath("/dokumente", locale)}>{en ? "Documents" : "Dokumente"}</Link>
          <Link className="active" href={localizedPath("/einstellungen", locale)}>{en ? "Settings" : "Einstellungen"}</Link>
        </nav>
        <div className="sidebar-account">
          <strong>{account?.display_name || account?.email || user.email}</strong>
          <span>{account?.email || user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit">{en ? "Sign out" : "Abmelden"}</button>
          </form>
        </div>
      </aside>

      <section className="app-content settings-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">{en ? "Account & security" : "Konto & Sicherheit"}</span>
            <h1>{en ? "Settings" : "Einstellungen"}</h1>
            <p className="dashboard-welcome">{en ? "Manage your profile, password and stored data." : "Verwalte dein Profil, Passwort und deine gespeicherten Daten."}</p>
          </div>
          <Link className="button button-primary" href={localizedPath("/dashboard", locale)}>{en ? "View cases" : "Zu den Fällen"}</Link>
        </header>

        {notice ? <div className="notice-card settings-notice" role="status"><strong>{notice}</strong></div> : null}
        {error ? <div className="form-error settings-error" role="alert">{error}</div> : null}

        <div className="settings-grid">
          <section className="panel settings-panel">
            <div className="settings-panel-heading">
              <div>
                <span className="eyebrow">{en ? "Profile" : "Profil"}</span>
                <h2>{en ? "Personal details" : "Persönliche Angaben"}</h2>
              </div>
              <span>{en ? "Member since" : "Mitglied seit"} {formatDateTime(account?.created_at ?? null, numberLocale)}</span>
            </div>

            <form className="settings-form" action="/api/account/profile" method="post">
              <label className="field">
                {en ? "Display name" : "Anzeigename"}
                <input
                  name="displayName"
                  type="text"
                  maxLength={80}
                  defaultValue={account?.display_name ?? ""}
                  placeholder={en ? "Your name" : "Dein Name"}
                  autoComplete="name"
                />
              </label>
              <label className="field">
                {en ? "Email address" : "E-Mail-Adresse"}
                <input type="email" value={account?.email ?? user.email} readOnly aria-readonly="true" />
                <small>{en ? "The address remains read-only until a future email change has been confirmed twice." : "Die Adresse bleibt bis zu einer späteren, doppelt bestätigten E-Mail-Änderung schreibgeschützt."}</small>
              </label>
              <button className="button button-secondary" type="submit">{en ? "Save profile" : "Profil speichern"}</button>
            </form>
          </section>

          <section className={`panel settings-panel settings-verification-panel${emailVerified ? " is-verified" : ""}`}>
            <div className="settings-panel-heading">
              <div>
                <span className="eyebrow">E-Mail</span>
                <h2>{emailVerified ? (en ? "Address confirmed" : "Adresse bestätigt") : (en ? "Confirm address" : "Adresse bestätigen")}</h2>
              </div>
              <span>{emailVerified ? (en ? "Active" : "Aktiv") : (en ? "Pending" : "Ausstehend")}</span>
            </div>

            {emailVerified ? (
              <p>{en ? "Confirmed on" : "Bestätigt am"} {formatDateTime(account?.email_verified_at ?? null, numberLocale)}. {en ? "Deadline reminders and direct email are enabled for this account." : "Fristerinnerungen und direkter E-Mail-Versand sind für dieses Konto freigeschaltet."}</p>
            ) : (
              <>
                <p>{en ? "Confirm your address so Reklaio can send deadline reminders and saved letters." : "Bestätige deine Adresse, damit Reklaio Fristerinnerungen senden und gespeicherte Schreiben direkt verschicken darf."}</p>
                <form action="/api/account/verification/resend" method="post">
                  <button className="button button-secondary" type="submit">{en ? "Send confirmation link" : "Bestätigungslink senden"}</button>
                </form>
              </>
            )}
          </section>

          <section className="panel settings-panel">
            <div className="settings-panel-heading">
              <div>
                <span className="eyebrow">{en ? "Security" : "Sicherheit"}</span>
                <h2>{en ? "Change password" : "Passwort ändern"}</h2>
              </div>
              <span>{en ? "At least 10 characters" : "Mindestens 10 Zeichen"}</span>
            </div>

            <form className="settings-form" action="/api/account/password" method="post">
              <label className="field">
                {en ? "Current password" : "Aktuelles Passwort"}
                <input name="currentPassword" type="password" minLength={10} maxLength={128} required autoComplete="current-password" />
              </label>
              <label className="field">
                {en ? "New password" : "Neues Passwort"}
                <input name="newPassword" type="password" minLength={10} maxLength={128} required autoComplete="new-password" />
              </label>
              <label className="field">
                {en ? "Repeat new password" : "Neues Passwort wiederholen"}
                <input name="confirmPassword" type="password" minLength={10} maxLength={128} required autoComplete="new-password" />
              </label>
              <button className="button button-secondary" type="submit">{en ? "Update password" : "Passwort aktualisieren"}</button>
            </form>
          </section>

          <section className="panel settings-panel settings-data-panel">
            <div className="settings-panel-heading">
              <div>
                <span className="eyebrow">{en ? "Privacy" : "Datenschutz"}</span>
                <h2>{en ? "Export account data" : "Kontodaten exportieren"}</h2>
              </div>
            </div>
            <p>{en ? "The JSON export contains your profile, cases, timeline, deadlines, letters and document information. Passwords, session tokens and uploaded binary files are excluded." : "Der JSON-Export enthält dein Profil, Fälle, Chronik, Fristen, Schreiben und Dokumentinformationen. Passwörter, Sitzungstoken und hochgeladene Binärdateien werden nicht hineingeschrieben."}</p>
            <a className="button button-secondary" href="/api/account/export">{en ? "Download my data" : "Meine Daten herunterladen"}</a>
          </section>

          <section className="panel settings-panel settings-danger-panel">
            <div className="settings-panel-heading">
              <div>
                <span className="eyebrow">{en ? "Danger zone" : "Gefahrenbereich"}</span>
                <h2>{en ? "Permanently delete account" : "Konto endgültig löschen"}</h2>
              </div>
            </div>
            <p>{en ? "This permanently removes your account, all cases, letters, deadlines, timeline entries and uploaded files. This cannot be undone." : "Dadurch werden dein Konto, alle Fälle, Schreiben, Fristen, Chronikeinträge und hochgeladenen Dateien dauerhaft entfernt. Dieser Vorgang kann nicht rückgängig gemacht werden."}</p>

            <form className="settings-form" action="/api/account/delete" method="post">
              <label className="field">
                {en ? "Current password" : "Aktuelles Passwort"}
                <input name="password" type="password" minLength={10} maxLength={128} required autoComplete="current-password" />
              </label>
              <label className="field">
                {en ? "Enter LÖSCHEN to confirm" : "Zur Bestätigung LÖSCHEN eingeben"}
                <input name="confirmation" type="text" required autoComplete="off" />
              </label>
              <button className="button settings-delete-button" type="submit">{en ? "Permanently delete account" : "Konto unwiderruflich löschen"}</button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
