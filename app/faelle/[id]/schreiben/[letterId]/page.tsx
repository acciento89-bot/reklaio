import Link from "next/link";
import { notFound } from "next/navigation";
import { LetterActions } from "@/components/letter-actions";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/cases";
import { query } from "@/lib/db";
import { getLetterKindLabel } from "@/lib/letters";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LetterPageProps = {
  params: Promise<{ id: string; letterId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

type LetterRow = {
  id: string;
  kind: string;
  subject: string | null;
  body: string;
  created_at: string;
  approved_at: string | null;
  case_title: string;
  company_name: string | null;
};

export default async function LetterPage({ params, searchParams }: LetterPageProps) {
  const user = await requireUser();
  const { id: caseId, letterId } = await params;
  const { saved, error } = await searchParams;

  if (!UUID_PATTERN.test(caseId) || !UUID_PATTERN.test(letterId)) {
    notFound();
  }

  const result = await query<LetterRow>(
    `SELECT l.id, l.kind, l.subject, l.body, l.created_at, l.approved_at,
            c.title AS case_title, c.company_name
     FROM generated_letters l
     JOIN cases c ON c.id = l.case_id
     WHERE l.id = $1
       AND l.case_id = $2
       AND c.user_id = $3
     LIMIT 1`,
    [letterId, caseId, user.id]
  );

  const letter = result.rows[0];
  if (!letter) {
    notFound();
  }

  const subject = letter.subject || "Schreiben ohne Betreff";

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

      {saved === "1" ? (
        <div className="notice-card letter-notice letter-no-print">
          <strong>Änderungen gespeichert.</strong>
          <span>Die aktuelle Fassung ist jetzt in der Fallakte hinterlegt.</span>
        </div>
      ) : null}

      {error ? <div className="form-error letter-error letter-no-print" role="alert">{error}</div> : null}

      <div className="letter-workspace">
        <section className="detail-panel letter-edit-panel letter-no-print">
          <div className="detail-panel-header">
            <div>
              <span className="eyebrow">Bearbeiten</span>
              <h2>Gespeicherte Fassung</h2>
            </div>
          </div>

          <form className="letter-edit-form" action={`/api/cases/${caseId}/letters/${letterId}`} method="post">
            <label className="field">
              Betreff
              <input name="subject" type="text" maxLength={240} defaultValue={subject} required />
            </label>
            <label className="field">
              Nachricht
              <textarea className="letter-body-input" name="body" rows={22} maxLength={20000} defaultValue={letter.body} required />
            </label>
            <div className="letter-editor-footer">
              <p>Prüfe Namen, Daten, Fristen und gewünschte Lösung vor dem Versand.</p>
              <button className="button button-primary" type="submit">Änderungen speichern</button>
            </div>
          </form>
        </section>

        <aside className="letter-preview-wrap">
          <span className="letter-preview-label letter-no-print">Druckvorschau</span>
          <article className="letter-paper">
            <header>
              <strong>{user.displayName || user.email}</strong>
              <span>{user.email}</span>
            </header>
            <div className="letter-recipient">
              <span>An</span>
              <strong>{letter.company_name || "Empfänger ergänzen"}</strong>
            </div>
            <h2>{subject}</h2>
            <div className="letter-paper-body">{letter.body}</div>
            <footer>Erstellt und verwaltet mit Reklaio · Keine Rechtsberatung</footer>
          </article>
        </aside>
      </div>
    </main>
  );
}
