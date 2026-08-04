import Link from "next/link";
import { notFound } from "next/navigation";
import { LetterActions } from "@/components/letter-actions";
import { requireUser } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/cases";
import { query } from "@/lib/db";
import { formatFileSize } from "@/lib/documents";
import { getLetterKindLabel } from "@/lib/letters";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LetterPageProps = {
  params: Promise<{ id: string; letterId: string }>;
  searchParams: Promise<{ saved?: string; sent?: string; error?: string; warning?: string }>;
};

type LetterRow = {
  id: string;
  kind: string;
  subject: string | null;
  body: string;
  created_at: string;
  approved_at: string | null;
  recipient_email: string | null;
  last_sent_at: string | null;
  case_title: string;
  company_name: string | null;
  email_verified_at: string | null;
};

type CaseDocument = {
  id: string;
  original_name: string;
  size_bytes: string;
};

type DeliveryRow = {
  id: string;
  recipient_email: string;
  subject: string;
  attachment_count: number;
  sent_at: string;
  deadline_due_at: string | null;
};

export default async function LetterPage({ params, searchParams }: LetterPageProps) {
  const user = await requireUser();
  const { id: caseId, letterId } = await params;
  const { saved, sent, error, warning } = await searchParams;

  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(letterId)) notFound();

  const result = await query<LetterRow>(
    `SELECT
       l.id, l.kind, l.subject, l.body, l.created_at, l.approved_at,
       l.recipient_email, l.last_sent_at,
       c.title AS case_title, c.company_name, u.email_verified_at
     FROM generated_letters l
     JOIN cases c ON c.id = l.case_id
     JOIN app_users u ON u.id = c.user_id
     WHERE l.id = $1 AND l.case_id = $2 AND c.user_id = $3
     LIMIT 1`,
    [letterId, caseId, user.id]
  );

  const letter = result.rows[0];
  if (!letter) notFound();

  const [documentResult, deliveryResult] = await Promise.all([
    query<CaseDocument>(
      `SELECT d.id, d.original_name, d.size_bytes
       FROM case_documents d
       JOIN cases c ON c.id = d.case_id
       WHERE d.case_id = $1 AND c.user_id = $2
       ORDER BY d.created_at DESC`,
      [caseId, user.id]
    ),
    query<DeliveryRow>(
      `SELECT e.id, e.recipient_email, e.subject, e.attachment_count,
              e.sent_at, d.due_at AS deadline_due_at
       FROM letter_email_deliveries e
       LEFT JOIN case_deadlines d ON d.id = e.reply_deadline_id
       WHERE e.letter_id = $1 AND e.case_id = $2
       ORDER BY e.sent_at DESC
       LIMIT 10`,
      [letterId, caseId]
    )
  ]);

  const subject = letter.subject || "Schreiben ohne Betreff";
  const emailVerified = Boolean(letter.email_verified_at);

  return (
    <main className="letter-page container">
      <header className="case-detail-topbar letter-no-print">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={`/faelle/${caseId}`}>← Zur Fallakte</Link>
      </header>

      <section className="letter-page-header letter-no-print">
        <div>
          <span className="eyebrow">{getLetterKindLabel(letter.kind)}</span>
          <h1>{subject}</h1>
          <p>{letter.case_title} · erstellt am {formatDateTime(letter.created_at)}</p>
        </div>
        <LetterActions subject={subject} body={letter.body} />
      </section>

      {saved === "1" ? <div className="notice-card letter-notice letter-no-print"><strong>Änderungen gespeichert.</strong><span>Die aktuelle Fassung ist jetzt in der Fallakte hinterlegt.</span></div> : null}
      {sent === "1" ? <div className="notice-card letter-notice letter-no-print"><strong>Schreiben per E-Mail versendet.</strong><span>Empfänger, Anhänge und eine gewählte Antwortfrist wurden in der Fallakte dokumentiert.</span></div> : null}
      {warning ? <div className="notice-card letter-notice letter-no-print"><strong>Versandhinweis</strong><span>{warning}</span></div> : null}
      {error ? <div className="form-error letter-error letter-no-print" role="alert">{error}</div> : null}

      <div className="letter-workspace">
        <section className="detail-panel letter-edit-panel letter-no-print">
          <div className="detail-panel-header"><div><span className="eyebrow">Bearbeiten</span><h2>Gespeicherte Fassung</h2></div></div>

          <form className="letter-edit-form" action={`/api/cases/${caseId}/letters/${letterId}`} method="post">
            <label className="field">Betreff<input name="subject" type="text" maxLength={240} defaultValue={subject} required /></label>
            <label className="field">Nachricht<textarea className="letter-body-input" name="body" rows={22} maxLength={20000} defaultValue={letter.body} required /></label>
            <div className="letter-editor-footer"><p>Prüfe Namen, Daten, Fristen und gewünschte Lösung vor dem Versand.</p><button className="button button-primary" type="submit">Änderungen speichern</button></div>
          </form>

          <section className="letter-email-panel">
            <div>
              <span className="eyebrow">Direktversand</span>
              <h2>Per E-Mail senden</h2>
              <p>Antworten gehen direkt an {user.email}. Bis zu fünf Dokumente mit zusammen höchstens 10 MB können angehängt werden.</p>
              {letter.last_sent_at ? <small>Zuletzt an {letter.recipient_email || "Empfänger"} gesendet: {formatDateTime(letter.last_sent_at)}</small> : null}
            </div>

            {emailVerified ? (
              <form className="letter-email-form" action={`/api/cases/${caseId}/letters/${letterId}/send`} method="post">
                <label className="field">Empfängeradresse<input name="recipientEmail" type="email" defaultValue={letter.recipient_email ?? ""} placeholder="service@anbieter.de" required autoComplete="email" /></label>

                <div className="letter-attachment-picker">
                  <strong>Dokumente anhängen</strong>
                  {documentResult.rows.length === 0 ? (
                    <p className="muted-copy">Noch keine Dokumente im Fall. <Link className="text-link" href={`/faelle/${caseId}#dokumente`}>Dokument hochladen</Link></p>
                  ) : documentResult.rows.map((document) => (
                    <label className="letter-attachment-option" key={document.id}>
                      <input name="documentIds" type="checkbox" value={document.id} />
                      <span>{document.original_name}</span>
                      <small>{formatFileSize(document.size_bytes)}</small>
                    </label>
                  ))}
                </div>

                <div className="letter-deadline-options">
                  <label className="letter-deadline-check"><input name="createReplyDeadline" type="checkbox" defaultChecked /><span>Nach Versand Antwortfrist und Aufgabe anlegen</span></label>
                  <label className="field">Frist<select name="deadlineDays" defaultValue="7"><option value="7">7 Tage</option><option value="14">14 Tage</option></select></label>
                </div>

                <button className="button button-secondary" type="submit">Schreiben mit Nachweisen senden</button>
              </form>
            ) : (
              <div className="letter-email-blocked"><p>Für den Direktversand muss deine E-Mail-Adresse zuerst bestätigt sein.</p><Link className="button button-secondary" href="/einstellungen">E-Mail bestätigen</Link></div>
            )}

            {deliveryResult.rows.length ? (
              <div className="letter-delivery-history">
                <strong>Versandverlauf</strong>
                {deliveryResult.rows.map((delivery) => (
                  <article key={delivery.id}>
                    <strong>{delivery.recipient_email}</strong>
                    <span>{formatDateTime(delivery.sent_at)} · {delivery.attachment_count} Anhänge{delivery.deadline_due_at ? ` · Antwortfrist ${formatDate(delivery.deadline_due_at)}` : ""}</span>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </section>

        <aside className="letter-preview-wrap">
          <span className="letter-preview-label letter-no-print">Druckvorschau</span>
          <article className="letter-paper">
            <header><strong>{user.displayName || user.email}</strong><span>{user.email}</span></header>
            <div className="letter-recipient"><span>An</span><strong>{letter.company_name || "Empfänger ergänzen"}</strong></div>
            <h2>{subject}</h2>
            <div className="letter-paper-body">{letter.body}</div>
            <footer>Erstellt und verwaltet mit Reklaio · Keine Rechtsberatung</footer>
          </article>
        </aside>
      </div>
    </main>
  );
}
