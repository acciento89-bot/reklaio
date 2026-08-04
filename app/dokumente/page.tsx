import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDateTime } from "@/lib/cases";
import { formatFileSize, getDocumentTypeLabel } from "@/lib/documents";

type AccountDocument = {
  id: string;
  case_id: string;
  case_title: string;
  original_name: string;
  size_bytes: string;
  document_type: string | null;
  created_at: string;
};

export default async function DocumentsPage() {
  const user = await requireUser();
  const accountName = user.displayName || user.email;

  const result = await query<AccountDocument>(
    `SELECT
       d.id,
       d.case_id,
       c.title AS case_title,
       d.original_name,
       d.size_bytes,
       d.document_type,
       d.created_at
     FROM case_documents d
     JOIN cases c ON c.id = d.case_id
     WHERE c.user_id = $1
     ORDER BY d.created_at DESC`,
    [user.id]
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <nav>
          <Link href="/dashboard">Meine Fälle</Link>
          <Link href="/neuer-fall">Neuer Fall</Link>
          <Link href="/fristen">Fristen</Link>
          <Link className="active" href="/dokumente">Dokumente</Link>
          <Link href="/einstellungen">Einstellungen</Link>
        </nav>
        <div className="sidebar-account">
          <strong>{accountName}</strong>
          <span>{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit">Abmelden</button>
          </form>
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">Belegarchiv</span>
            <h1>Dokumente</h1>
            <p className="dashboard-welcome">Alle Belege aus deinen Fällen an einem Ort.</p>
          </div>
          <Link className="button button-primary" href="/dashboard">Zu den Fällen</Link>
        </header>

        <div className="panel document-overview-panel">
          <div className="panel-header">
            <h2>Deine Dateien</h2>
            <span>{result.rows.length} {result.rows.length === 1 ? "Datei" : "Dateien"}</span>
          </div>

          {result.rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">▤</div>
              <h3>Noch keine Dokumente</h3>
              <p>Lade Belege direkt in einer Fallakte hoch. Sie erscheinen anschließend automatisch hier.</p>
              <Link className="button button-primary" href="/dashboard">Fall öffnen</Link>
            </div>
          ) : (
            <div className="document-list document-overview-list">
              {result.rows.map((document) => (
                <article className="document-item" key={document.id}>
                  <div className="document-icon" aria-hidden="true">▤</div>
                  <div className="document-main">
                    <strong>{document.original_name}</strong>
                    <span>
                      {getDocumentTypeLabel(document.document_type)} · {formatFileSize(document.size_bytes)} · {formatDateTime(document.created_at)}
                    </span>
                    <Link className="document-case-link" href={`/faelle/${document.case_id}`}>
                      Fall: {document.case_title}
                    </Link>
                  </div>
                  <div className="document-actions">
                    <a href={`/api/cases/${document.case_id}/documents/${document.id}/download`}>Herunterladen</a>
                    <Link href={`/faelle/${document.case_id}`}>Fall öffnen</Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
