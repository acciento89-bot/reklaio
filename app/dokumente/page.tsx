import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { formatDateTime } from "@/lib/cases";
import { formatFileSize, getDocumentTypeLabel } from "@/lib/documents";
import { getLocale, localizedPath } from "@/lib/i18n";

type AccountDocument = {
  id: string;
  case_id: string;
  case_title: string;
  original_name: string;
  mime_type: string;
  size_bytes: string;
  document_type: string | null;
  created_at: string;
  analysis_created_at: string | null;
};

export default async function DocumentsPage() {
  const locale = await getLocale();
  const en = locale === "en";
  const numberLocale = en ? "en-GB" : "de-DE";
  const user = await requireUser();
  const accountName = user.displayName || user.email;

  const result = await query<AccountDocument>(
    `SELECT
       d.id,
       d.case_id,
       c.title AS case_title,
       d.original_name,
       d.mime_type,
       d.size_bytes,
       d.document_type,
       d.created_at,
       analysis.created_at AS analysis_created_at
     FROM case_documents d
     JOIN cases c ON c.id = d.case_id
     LEFT JOIN LATERAL (
       SELECT a.created_at
       FROM document_ai_analyses a
       WHERE a.document_id = d.id
       ORDER BY a.created_at DESC
       LIMIT 1
     ) analysis ON TRUE
     WHERE c.user_id = $1
     ORDER BY d.created_at DESC`,
    [user.id]
  );

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <nav>
          <Link href={localizedPath("/dashboard", locale)}>{en ? "My cases" : "Meine Fälle"}</Link>
          <Link href={localizedPath("/neuer-fall", locale)}>{en ? "New case" : "Neuer Fall"}</Link>
          <Link href={localizedPath("/fristen", locale)}>{en ? "Deadlines" : "Fristen"}</Link>
          <Link className="active" href={localizedPath("/dokumente", locale)}>{en ? "Documents" : "Dokumente"}</Link>
          <Link href={localizedPath("/hilfe", locale)}>{en ? "Help" : "Hilfe"}</Link>
          <Link href={localizedPath("/einstellungen", locale)}>{en ? "Settings" : "Einstellungen"}</Link>
        </nav>
        <div className="sidebar-account">
          <strong>{accountName}</strong>
          <span>{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit">{en ? "Sign out" : "Abmelden"}</button>
          </form>
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">{en ? "Evidence archive" : "Belegarchiv"}</span>
            <h1>{en ? "Documents" : "Dokumente"}</h1>
            <p className="dashboard-welcome">{en ? "All evidence from your cases in one place. AI analyses are optional and never apply anything automatically." : "Alle Belege aus deinen Fällen an einem Ort. KI-Analysen sind freiwillig und übernehmen nichts automatisch."}</p>
          </div>
          <Link className="button button-primary" href={localizedPath("/dashboard", locale)}>{en ? "View cases" : "Zu den Fällen"}</Link>
        </header>

        <div className="panel document-overview-panel">
          <div className="panel-header">
            <h2>{en ? "Your files" : "Deine Dateien"}</h2>
            <span>{result.rows.length} {en ? (result.rows.length === 1 ? "file" : "files") : (result.rows.length === 1 ? "Datei" : "Dateien")}</span>
          </div>

          {result.rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">▤</div>
              <h3>{en ? "No documents yet" : "Noch keine Dokumente"}</h3>
              <p>{en ? "Upload evidence directly to a case file. It will then appear here automatically." : "Lade Belege direkt in einer Fallakte hoch. Sie erscheinen anschließend automatisch hier."}</p>
              <Link className="button button-primary" href={localizedPath("/dashboard", locale)}>{en ? "Open case" : "Fall öffnen"}</Link>
            </div>
          ) : (
            <div className="document-list document-overview-list">
              {result.rows.map((document) => {
                const analyzable = ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(document.mime_type);
                return (
                  <article className="document-item" key={document.id}>
                    <div className="document-icon" aria-hidden="true">▤</div>
                    <div className="document-main">
                      <strong>{document.original_name}</strong>
                      <span>
                        {getDocumentTypeLabel(document.document_type)} · {formatFileSize(document.size_bytes)} · {formatDateTime(document.created_at, numberLocale)}
                      </span>
                      <Link className="document-case-link" href={localizedPath(`/faelle/${document.case_id}`, locale)}>
                        {en ? "Case" : "Fall"}: {document.case_title}
                      </Link>
                      {document.analysis_created_at ? <small>{en ? "Latest AI analysis" : "Letzte KI-Analyse"}: {formatDateTime(document.analysis_created_at, numberLocale)}</small> : null}
                    </div>
                    <div className="document-actions">
                      <a href={`/api/cases/${document.case_id}/documents/${document.id}/download`}>{en ? "Download" : "Herunterladen"}</a>
                      {analyzable ? <Link href={localizedPath(`/faelle/${document.case_id}/dokumente/${document.id}/analyse`, locale)}>{document.analysis_created_at ? (en ? "Review analysis" : "Analyse prüfen") : (en ? "Analyse with AI" : "KI analysieren")}</Link> : null}
                      <Link href={localizedPath(`/faelle/${document.case_id}`, locale)}>{en ? "Open case" : "Fall öffnen"}</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
