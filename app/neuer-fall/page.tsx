import Link from "next/link";
import { getCaseTypeBySlug, caseTypes } from "@/lib/case-types";
import { requireUser } from "@/lib/auth";
import { CaseTypeSelector } from "@/components/case-type-selector";

type NewCasePageProps = {
  searchParams: Promise<{ typ?: string; error?: string }>;
};

export default async function NewCasePage({ searchParams }: NewCasePageProps) {
  await requireUser();
  const { typ, error } = await searchParams;
  const selectedType = getCaseTypeBySlug(typ ?? "")?.slug ?? caseTypes[0].slug;

  return (
    <main className="form-page container">
      <div className="form-page-header">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href="/dashboard">← Zum Dashboard</Link>
      </div>

      <form className="form-card case-create-card professional-form-card" action="/api/cases" method="post">
        <header className="case-create-intro">
          <span className="eyebrow">Neue Fallakte</span>
          <h1>Fall strukturiert anlegen</h1>
          <p>Wähle zuerst die passende Situation. Reklaio zeigt dir direkt, welche Unterlagen und Angaben für den Fall hilfreich sind.</p>
        </header>

        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <CaseTypeSelector defaultValue={selectedType} />

        <section className="case-details-section">
          <div className="case-section-heading">
            <div>
              <span className="eyebrow">Grunddaten</span>
              <h2>Angaben zum Fall</h2>
              <p>Ein aussagekräftiger Titel und die wichtigsten Referenzen reichen für den Start.</p>
            </div>
            <span>2 von 2</span>
          </div>

          <div className="case-form-grid">
            <label className="field field-full">
              Titel des Falls
              <input name="title" type="text" maxLength={140} placeholder="z. B. Rückzahlung für retournierte Bestellung" required />
            </label>

            <label className="field">
              Anbieter oder Unternehmen
              <input name="companyName" type="text" maxLength={160} placeholder="z. B. Beispiel-Shop GmbH" />
            </label>

            <label className="field">
              Bestell-, Vertrags- oder Vorgangsnummer
              <input name="orderReference" type="text" maxLength={120} placeholder="optional" />
            </label>

            <label className="field">
              Betrag in Euro
              <input name="amount" type="text" inputMode="decimal" placeholder="129,90" />
            </label>

            <label className="field">
              Datum des Vorfalls
              <input name="incidentDate" type="date" />
            </label>

            <label className="field field-full">
              Kurze Zusammenfassung
              <textarea
                name="summary"
                rows={6}
                maxLength={5000}
                placeholder="Was ist passiert, was wurde bereits versucht und was wurde zugesagt?"
              />
            </label>
          </div>
        </section>

        <div className="form-actions">
          <Link className="button button-ghost" href="/dashboard">Abbrechen</Link>
          <button className="button button-primary" type="submit">Fallakte anlegen</button>
        </div>
      </form>
    </main>
  );
}
