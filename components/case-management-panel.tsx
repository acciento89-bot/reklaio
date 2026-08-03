import Link from "next/link";

type CaseManagementPanelProps = {
  caseId: string;
};

export function CaseManagementPanel({ caseId }: CaseManagementPanelProps) {
  return (
    <article className="detail-panel compact-panel case-management-panel">
      <span className="eyebrow">Verwaltung</span>
      <h2>Fall verwalten</h2>

      <Link className="button button-secondary case-edit-button" href={`/faelle/${caseId}/bearbeiten`}>
        Falldaten bearbeiten
      </Link>

      <details className="danger-zone">
        <summary>Fall endgültig löschen</summary>
        <div className="danger-zone-content">
          <p>
            Dabei werden der Fall, seine Chronik, Fristen, Schreiben und alle hochgeladenen Dateien dauerhaft entfernt.
          </p>
          <form action={`/api/cases/${caseId}/delete`} method="post">
            <label className="field">
              Zur Bestätigung <strong>LÖSCHEN</strong> eingeben
              <input name="confirmation" type="text" autoComplete="off" required />
            </label>
            <button className="danger-button" type="submit">Fall endgültig löschen</button>
          </form>
        </div>
      </details>
    </article>
  );
}
