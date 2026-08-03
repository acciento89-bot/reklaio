"use client";

import { usePathname } from "next/navigation";

const CASE_DETAIL_PATTERN = /^\/faelle\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

export function CaseDeletePanel() {
  const pathname = usePathname();
  const match = pathname.match(CASE_DETAIL_PATTERN);

  if (!match) {
    return null;
  }

  const caseId = match[1];

  return (
    <details className="case-delete-panel">
      <summary>Fall verwalten</summary>
      <div className="case-delete-panel-content">
        <strong>Fall endgültig löschen</strong>
        <p>Dabei werden Chronik, Fristen, Schreiben und hochgeladene Dokumente unwiderruflich entfernt.</p>
        <form action={`/api/cases/${caseId}/delete`} method="post">
          <label>
            Zur Bestätigung LÖSCHEN eingeben
            <input name="confirmation" type="text" autoComplete="off" required />
          </label>
          <button type="submit">Fall endgültig löschen</button>
        </form>
      </div>
    </details>
  );
}
