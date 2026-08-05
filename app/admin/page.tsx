import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { defaultAiLimit } from "@/lib/ai-quota";
import { formatDateTime } from "@/lib/cases";
import { query } from "@/lib/db";
import { getSystemHealthChecks } from "@/lib/system-health";

type AdminPageProps = {
  searchParams: Promise<{ q?: string; notice?: string; error?: string }>;
};

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: "user" | "admin";
  plan_code: "free" | "pro";
  subscription_status: string | null;
  suspended_at: string | null;
  ai_document_limit_override: number | null;
  ai_letter_limit_override: number | null;
  created_at: string;
  case_count: number;
  ai_document_used: number;
  ai_letter_used: number;
};

type ContactRow = {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  delivered_at: string | null;
  created_at: string;
};

type WebhookRow = {
  event_id: string;
  event_type: string;
  status: string;
  error_message: string | null;
  processed_at: string;
};

type BackupRow = {
  id: string;
  status: string;
  database_bytes: string | null;
  uploads_bytes: string | null;
  error_message: string | null;
  completed_at: string;
};

type WithdrawalRow = {
  id: string;
  name: string;
  email: string;
  contract_reference: string | null;
  submitted_at: string;
  processed_at: string | null;
};

function bytes(value: string | null) {
  if (!value) return "–";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "–";
  return `${(amount / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

  const [
    statsResult,
    userResult,
    contactResult,
    webhookResult,
    backupResult,
    withdrawalResult,
    healthChecks
  ] = await Promise.all([
    query<{
      user_count: number;
      pro_count: number;
      suspended_count: number;
      case_count: number;
      open_contact_count: number;
      open_withdrawal_count: number;
      ai_document_month: number;
      ai_letter_month: number;
      ai_failed_month: number;
    }>(
      `SELECT
         (SELECT COUNT(*)::int FROM app_users) AS user_count,
         (SELECT COUNT(*)::int FROM app_users WHERE plan_code = 'pro') AS pro_count,
         (SELECT COUNT(*)::int FROM app_users WHERE suspended_at IS NOT NULL) AS suspended_count,
         (SELECT COUNT(*)::int FROM cases) AS case_count,
         (SELECT COUNT(*)::int FROM contact_messages WHERE status = 'open') AS open_contact_count,
         (SELECT COUNT(*)::int FROM withdrawal_requests WHERE processed_at IS NULL) AS open_withdrawal_count,
         (SELECT COUNT(*)::int FROM ai_usage_events WHERE operation = 'document_analysis' AND status = 'completed' AND created_at >= date_trunc('month', NOW())) AS ai_document_month,
         (SELECT COUNT(*)::int FROM ai_usage_events WHERE operation = 'letter_draft' AND status = 'completed' AND created_at >= date_trunc('month', NOW())) AS ai_letter_month,
         (SELECT COUNT(*)::int FROM ai_usage_events WHERE status = 'failed' AND created_at >= date_trunc('month', NOW())) AS ai_failed_month`
    ),
    query<UserRow>(
      `SELECT
         u.id, u.email, u.display_name, u.role, u.plan_code,
         u.subscription_status, u.suspended_at,
         u.ai_document_limit_override, u.ai_letter_limit_override,
         u.created_at,
         (SELECT COUNT(*)::int FROM cases c WHERE c.user_id = u.id) AS case_count,
         (SELECT COUNT(*)::int FROM ai_usage_events a WHERE a.user_id = u.id AND a.operation = 'document_analysis' AND a.status IN ('reserved', 'completed') AND a.created_at >= date_trunc('month', NOW())) AS ai_document_used,
         (SELECT COUNT(*)::int FROM ai_usage_events a WHERE a.user_id = u.id AND a.operation = 'letter_draft' AND a.status IN ('reserved', 'completed') AND a.created_at >= date_trunc('month', NOW())) AS ai_letter_used
       FROM app_users u
       WHERE ($1 = '' OR u.email ILIKE '%' || $1 || '%' OR COALESCE(u.display_name, '') ILIKE '%' || $1 || '%')
       ORDER BY u.created_at DESC
       LIMIT 50`,
      [search]
    ),
    query<ContactRow>(
      `SELECT id, name, email, subject, status, delivered_at, created_at
       FROM contact_messages
       ORDER BY (status = 'open') DESC, created_at DESC
       LIMIT 12`
    ),
    query<WebhookRow>(
      `SELECT event_id, event_type, status, error_message, processed_at
       FROM billing_webhook_events
       ORDER BY processed_at DESC
       LIMIT 12`
    ),
    query<BackupRow>(
      `SELECT id, status, database_bytes, uploads_bytes, error_message, completed_at
       FROM backup_runs
       ORDER BY completed_at DESC
       LIMIT 8`
    ),
    query<WithdrawalRow>(
      `SELECT id, name, email, contract_reference, submitted_at, processed_at
       FROM withdrawal_requests
       ORDER BY (processed_at IS NULL) DESC, submitted_at DESC
       LIMIT 10`
    ),
    getSystemHealthChecks()
  ]);

  const stats = statsResult.rows[0];
  const defaultDocumentLimit = defaultAiLimit("document_analysis");
  const defaultLetterLimit = defaultAiLimit("letter_draft");

  return (
    <main className="admin-page container">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Nur Administratoren</span>
          <h1>Reklaio Admin-Center</h1>
          <p>Angemeldet als {admin.email}</p>
        </div>
        <div className="admin-header-actions">
          <Link className="button button-secondary" href="/dashboard">Zur Anwendung</Link>
          <Link className="button button-secondary" href="/preise">Preise</Link>
        </div>
      </header>

      {params.notice ? <div className="notice-card admin-message" role="status"><strong>{params.notice}</strong></div> : null}
      {params.error ? <div className="form-error admin-message" role="alert">{params.error}</div> : null}

      <section className="admin-stats">
        <article><span>Nutzer</span><strong>{stats?.user_count ?? 0}</strong><small>{stats?.pro_count ?? 0} Pro</small></article>
        <article><span>Fallakten</span><strong>{stats?.case_count ?? 0}</strong><small>{stats?.suspended_count ?? 0} gesperrte Konten</small></article>
        <article><span>KI diesen Monat</span><strong>{(stats?.ai_document_month ?? 0) + (stats?.ai_letter_month ?? 0)}</strong><small>{stats?.ai_failed_month ?? 0} fehlgeschlagen</small></article>
        <article><span>Offene Anfragen</span><strong>{(stats?.open_contact_count ?? 0) + (stats?.open_withdrawal_count ?? 0)}</strong><small>Kontakt + Widerruf</small></article>
      </section>

      <section className="admin-grid admin-grid-health">
        <article className="admin-panel">
          <div className="admin-panel-header"><div><span className="eyebrow">Betrieb</span><h2>Systemstatus</h2></div></div>
          <div className="admin-health-list">
            {healthChecks.map((check) => (
              <article className={`admin-health admin-health-${check.status}`} key={check.key}>
                <span className="admin-health-dot" />
                <div><strong>{check.label}</strong><p>{check.detail}</p></div>
                <span>{check.status === "ok" ? "OK" : check.status === "warning" ? "Prüfen" : "Kritisch"}</span>
              </article>
            ))}
          </div>
          <form action="/api/admin/backups/request" method="post">
            <button className="button button-secondary" type="submit">Backup jetzt anfordern</button>
          </form>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header"><div><span className="eyebrow">KI-Kostenkontrolle</span><h2>Monatliche Standardlimits</h2></div></div>
          <div className="admin-limit-summary">
            <div><span>Dokumentanalysen</span><strong>{defaultDocumentLimit === -1 ? "Unbegrenzt" : defaultDocumentLimit}</strong></div>
            <div><span>KI-Schreiben</span><strong>{defaultLetterLimit === -1 ? "Unbegrenzt" : defaultLetterLimit}</strong></div>
          </div>
          <p className="muted-copy">Individuelle Abweichungen werden direkt beim Nutzer gespeichert. Der Wert −1 bedeutet unbegrenzt.</p>
          <div className="admin-config-code">
            <code>PRO_AI_DOCUMENTS_MONTHLY={defaultDocumentLimit}</code>
            <code>PRO_AI_LETTERS_MONTHLY={defaultLetterLimit}</code>
          </div>
        </article>
      </section>

      <section className="admin-panel admin-users-panel">
        <div className="admin-panel-header">
          <div><span className="eyebrow">Konten und Tarife</span><h2>Nutzerverwaltung</h2></div>
          <form className="admin-search" method="get">
            <input name="q" type="search" defaultValue={search} placeholder="E-Mail oder Name" />
            <button className="button button-secondary" type="submit">Suchen</button>
          </form>
        </div>

        <div className="admin-user-list">
          {userResult.rows.map((user) => (
            <article className="admin-user" key={user.id}>
              <div className="admin-user-main">
                <strong>{user.display_name || user.email}</strong>
                <span>{user.email}</span>
                <small>Seit {formatDateTime(user.created_at)} · {user.case_count} Fälle · {user.role}</small>
              </div>
              <div className="admin-user-badges">
                <span className={user.plan_code === "pro" ? "is-pro" : ""}>{user.plan_code.toUpperCase()}</span>
                {user.subscription_status ? <span>{user.subscription_status}</span> : null}
                {user.suspended_at ? <span className="is-danger">Gesperrt</span> : null}
              </div>
              <div className="admin-user-usage">
                <span>Dokumente: {user.ai_document_used}/{user.ai_document_limit_override ?? defaultDocumentLimit}</span>
                <span>Schreiben: {user.ai_letter_used}/{user.ai_letter_limit_override ?? defaultLetterLimit}</span>
              </div>
              <form className="admin-user-form" action={`/api/admin/users/${user.id}/update`} method="post">
                <label>Dokumentlimit<input name="documentLimit" type="number" min="-1" defaultValue={user.ai_document_limit_override ?? ""} placeholder={String(defaultDocumentLimit)} /></label>
                <label>Schreibenlimit<input name="letterLimit" type="number" min="-1" defaultValue={user.ai_letter_limit_override ?? ""} placeholder={String(defaultLetterLimit)} /></label>
                <label>Aktion<select name="action" defaultValue="set_quotas">
                  <option value="set_quotas">Limits speichern</option>
                  <option value="grant_pro">Pro freischalten</option>
                  <option value="revoke_pro">Auf Free setzen</option>
                  <option value={user.suspended_at ? "unsuspend" : "suspend"}>{user.suspended_at ? "Entsperren" : "Sperren"}</option>
                  <option value={user.role === "admin" ? "remove_admin" : "make_admin"}>{user.role === "admin" ? "Adminrecht entfernen" : "Zum Admin machen"}</option>
                </select></label>
                <button className="button button-secondary" type="submit">Ausführen</button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-grid">
        <article className="admin-panel">
          <div className="admin-panel-header"><div><span className="eyebrow">Support</span><h2>Kontaktanfragen</h2></div><Link className="text-link" href="/kontakt">Formular</Link></div>
          <div className="admin-compact-list">
            {contactResult.rows.length ? contactResult.rows.map((item) => (
              <article key={item.id}>
                <div><strong>{item.subject}</strong><span>{item.name} · {item.email}</span><small>{formatDateTime(item.created_at)}</small></div>
                {item.status === "open" ? <form action={`/api/admin/contact/${item.id}/resolve`} method="post"><button type="submit">Erledigt</button></form> : <span>{item.status}</span>}
              </article>
            )) : <p className="muted-copy">Keine Kontaktanfragen vorhanden.</p>}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header"><div><span className="eyebrow">Verbraucherrecht</span><h2>Widerrufe</h2></div><Link className="text-link" href="/widerruf">Formular</Link></div>
          <div className="admin-compact-list">
            {withdrawalResult.rows.length ? withdrawalResult.rows.map((item) => (
              <article key={item.id}>
                <div><strong>{item.name}</strong><span>{item.email} · {item.contract_reference || "ohne Referenz"}</span><small>{formatDateTime(item.submitted_at)}</small></div>
                {item.processed_at ? <span>Erledigt</span> : <form action={`/api/admin/withdrawals/${item.id}/resolve`} method="post"><button type="submit">Bearbeitet</button></form>}
              </article>
            )) : <p className="muted-copy">Keine Widerrufe vorhanden.</p>}
          </div>
        </article>
      </section>

      <section className="admin-grid">
        <article className="admin-panel">
          <div className="admin-panel-header"><div><span className="eyebrow">Abrechnung</span><h2>Stripe-Webhooks</h2></div></div>
          <div className="admin-compact-list">
            {webhookResult.rows.length ? webhookResult.rows.map((item) => (
              <article key={item.event_id}>
                <div><strong>{item.event_type}</strong><span>{item.event_id}</span><small>{formatDateTime(item.processed_at)}</small>{item.error_message ? <p>{item.error_message}</p> : null}</div>
                <span className={item.status === "processed" ? "is-ok" : "is-danger"}>{item.status}</span>
              </article>
            )) : <p className="muted-copy">Noch keine Stripe-Webhooks protokolliert.</p>}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header"><div><span className="eyebrow">Datensicherung</span><h2>Backup-Verlauf</h2></div></div>
          <div className="admin-compact-list">
            {backupResult.rows.length ? backupResult.rows.map((item) => (
              <article key={item.id}>
                <div><strong>{item.status === "completed" ? "Backup erfolgreich" : "Backup fehlgeschlagen"}</strong><span>DB {bytes(item.database_bytes)} · Uploads {bytes(item.uploads_bytes)}</span><small>{formatDateTime(item.completed_at)}</small>{item.error_message ? <p>{item.error_message}</p> : null}</div>
                <span className={item.status === "completed" ? "is-ok" : "is-danger"}>{item.status}</span>
              </article>
            )) : <p className="muted-copy">Noch kein Backup protokolliert.</p>}
          </div>
        </article>
      </section>
    </main>
  );
}
