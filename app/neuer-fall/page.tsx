import Link from "next/link";
import { caseTypes, getCaseTypeBySlug } from "@/lib/case-types";
import { requireUser } from "@/lib/auth";

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

      <form className="form-card case-create-card" action="/api/cases" method="post">
        <span className="eyebrow">Neuer Fall</span>
        <h1>Was ist passiert?</h1>
        <p>Lege die wichtigsten Eckdaten an. Chronik, Fristen und weitere Schritte ergänzt du danach im Fall.</p>

        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <fieldset className="case-type-fieldset">
          <legend>Fallart</legend>
          <div className="choice-list choice-list-compact">
            {caseTypes.map((item) => (
              <label className="choice-card choice-radio" key={item.slug}>
                <input
                  name="type"
                  type="radio"
                  value={item.slug}
                  defaultChecked={item.slug === selectedType}
                  required
                />
                <span className="case-icon">{item.icon}</span>
                <span><strong>{item.title}</strong><small>{item.description}</small></span>
                <span className="radio-indicator" aria-hidden="true" />
              </label>
            ))}
          </div>
        </fieldset>

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

        <div className="form-actions">
          <Link className="button button-ghost" href="/dashboard">Abbrechen</Link>
          <button className="button button-primary" type="submit">Fall anlegen</button>
        </div>
      </form>
    </main>
  );
}
