import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCaseStatus, type CaseStatus } from "@/lib/cases";
import { query } from "@/lib/db";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

type ManagedCase = {
  id: string;
  title: string;
  company_name: string | null;
  status: CaseStatus;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ManageCasePage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const result = await query<ManagedCase>(
    `SELECT id, title, company_name, status
     FROM cases
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, user.id]
  );

  const currentCase = result.rows[0];
  if (!currentCase) {
    notFound();
  }

  const status = getCaseStatus(currentCase.status);
  const isArchived = currentCase.status === "closed";

  return (
    <main className="form-page container settings-content">
      <header className="form-page-header">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={`/faelle/${id}`}>← Zur Fallakte</Link>
      </header>

      <section className="case-detail-header">
        <div>
          <span className="eyebrow">Fallverwaltung</span>
          <h1>{currentCase.title}</h1>
          <p>{currentCase.company_name || "Kein Anbieter eingetragen"}</p>
        </div>
        <span className={`status status-${status.tone} status-large`}>{status.label}</span>
      </section>

      {error ? <div className="form-error settings-error" role="alert">{error}</div> : null}

      <div className="settings-grid">
        <section className="panel settings-panel settings-data-panel">
          <div className="settings-panel-heading">
            <div>
              <span className="eyebrow">Archiv</span>
              <h2>{isArchived ? "Fall wieder öffnen" : "Fall archivieren"}</h2>
            </div>
          </div>

          {isArchived ? (
            <>
              <p>Der Fall ist archiviert und zählt nicht mehr als aktiver Fall. Beim Wiederöffnen wird sein Status auf „Entwurf“ gesetzt; alle Daten, Dokumente, Fristen und Schreiben bleiben erhalten.</p>
              <form action={`/api/cases/${id}/restore`} method="post">
                <button className="button button-secondary" type="submit">Fall wieder öffnen</button>
              </form>
            </>
          ) : (
            <>
              <p>Verschiebe den Fall ins Archiv, wenn er abgeschlossen ist oder vorerst nicht weiterbearbeitet werden soll. Nichts wird gelöscht und der Fall kann später wieder geöffnet werden.</p>
              <form action={`/api/cases/${id}/archive`} method="post">
                <button className="button button-secondary" type="submit">Fall archivieren</button>
              </form>
            </>
          )}
        </section>

        <section className="panel settings-panel settings-danger-panel">
          <div className="settings-panel-heading">
            <div>
              <span className="eyebrow">Gefahrenbereich</span>
              <h2>Fall endgültig löschen</h2>
            </div>
          </div>

          <p>Dadurch werden Falldaten, Chronik, Fristen, Schreiben, Dokumenteinträge und die hochgeladenen Dateien dauerhaft entfernt. Dieser Vorgang kann nicht rückgängig gemacht werden.</p>

          <form className="settings-form" action={`/api/cases/${id}/delete`} method="post">
            <label className="field">
              Zur Bestätigung LÖSCHEN eingeben
              <input name="confirmation" type="text" required autoComplete="off" />
            </label>
            <button className="button settings-delete-button" type="submit">Fall unwiderruflich löschen</button>
          </form>
        </section>
      </div>
    </main>
  );
}
