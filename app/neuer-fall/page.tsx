import Link from "next/link";
import { getCaseTypeBySlug, caseTypes } from "@/lib/case-types";
import { requireUser } from "@/lib/auth";
import { CaseTypeSelector } from "@/components/case-type-selector";
import { getLocale, localizedPath } from "@/lib/i18n";

type NewCasePageProps = {
  searchParams: Promise<{ typ?: string; error?: string }>;
};

export default async function NewCasePage({ searchParams }: NewCasePageProps) {
  await requireUser();
  const locale = await getLocale();
  const en = locale === "en";
  const { typ, error } = await searchParams;
  const selectedType = getCaseTypeBySlug(typ ?? "")?.slug ?? caseTypes[0].slug;

  return (
    <main className="form-page container">
      <div className="form-page-header">
        <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={localizedPath("/dashboard", locale)}>← {en ? "Dashboard" : "Zum Dashboard"}</Link>
      </div>

      <form className="form-card case-create-card professional-form-card" action="/api/cases" method="post">
        <input type="hidden" name="locale" value={locale} />
        <header className="case-create-intro">
          <span className="eyebrow">{en ? "New case file" : "Neue Fallakte"}</span>
          <h1>{en ? "Create a structured case" : "Fall strukturiert anlegen"}</h1>
          <p>{en ? "Choose the relevant situation first. Reklaio immediately shows which documents and details will help." : "Wähle zuerst die passende Situation. Reklaio zeigt dir direkt, welche Unterlagen und Angaben für den Fall hilfreich sind."}</p>
        </header>

        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <CaseTypeSelector defaultValue={selectedType} locale={locale} />

        <section className="case-details-section">
          <div className="case-section-heading">
            <div>
              <span className="eyebrow">{en ? "Basic details" : "Grunddaten"}</span>
              <h2>{en ? "Case details" : "Angaben zum Fall"}</h2>
              <p>{en ? "A clear title and the most important references are enough to get started." : "Ein aussagekräftiger Titel und die wichtigsten Referenzen reichen für den Start."}</p>
            </div>
            <span>{en ? "2 of 2" : "2 von 2"}</span>
          </div>

          <div className="case-form-grid">
            <label className="field field-full">
              {en ? "Case title" : "Titel des Falls"}
              <input name="title" type="text" maxLength={140} placeholder={en ? "e.g. Refund for returned order" : "z. B. Rückzahlung für retournierte Bestellung"} required />
            </label>

            <label className="field">
              {en ? "Provider or company" : "Anbieter oder Unternehmen"}
              <input name="companyName" type="text" maxLength={160} placeholder={en ? "e.g. Example Shop Ltd" : "z. B. Beispiel-Shop GmbH"} />
            </label>

            <label className="field">
              {en ? "Order, contract or case number" : "Bestell-, Vertrags- oder Vorgangsnummer"}
              <input name="orderReference" type="text" maxLength={120} placeholder={en ? "optional" : "optional"} />
            </label>

            <label className="field">
              {en ? "Amount in euros" : "Betrag in Euro"}
              <input name="amount" type="text" inputMode="decimal" placeholder="129,90" />
            </label>

            <label className="field">
              {en ? "Incident date" : "Datum des Vorfalls"}
              <input name="incidentDate" type="date" />
            </label>

            <label className="field field-full">
              {en ? "Short summary" : "Kurze Zusammenfassung"}
              <textarea
                name="summary"
                rows={6}
                maxLength={5000}
                placeholder={en ? "What happened, what have you already tried and what was promised?" : "Was ist passiert, was wurde bereits versucht und was wurde zugesagt?"}
              />
            </label>
          </div>
        </section>

        <div className="form-actions">
          <Link className="button button-ghost" href={localizedPath("/dashboard", locale)}>{en ? "Cancel" : "Abbrechen"}</Link>
          <button className="button button-primary" type="submit">{en ? "Create case file" : "Fallakte anlegen"}</button>
        </div>
      </form>
    </main>
  );
}
