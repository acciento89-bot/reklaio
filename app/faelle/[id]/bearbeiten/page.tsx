import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { caseTypes, type CaseTypeValue } from "@/lib/case-types";

type EditCasePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

type EditableCase = {
  id: string;
  type: CaseTypeValue;
  title: string;
  company_name: string | null;
  order_reference: string | null;
  amount_cents: number | null;
  incident_date: string | null;
  summary: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function amountValue(cents: number | null) {
  if (cents === null) {
    return "";
  }

  return (cents / 100).toFixed(2).replace(".", ",");
}

export default async function EditCasePage({ params, searchParams }: EditCasePageProps) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const result = await query<EditableCase>(
    `SELECT id, type, title, company_name, order_reference, amount_cents,
            incident_date::text AS incident_date, summary
     FROM cases
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, user.id]
  );

  const currentCase = result.rows[0];
  if (!currentCase) {
    notFound();
  }

  return (
    <main className="form-page container">
      <header className="form-page-header">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={`/faelle/${id}`}>← Zur Fallakte</Link>
      </header>

      <section className="form-card case-create-card">
        <span className="eyebrow">Falldaten</span>
        <h1>Fall bearbeiten</h1>
        <p>Korrigiere oder ergänze die Angaben. Änderungen werden automatisch in der Chronik vermerkt.</p>

        {error ? <div className="form-error" role="alert">{error}</div> : null}

        <form action={`/api/cases/${id}/update`} method="post">
          <div className="case-form-grid">
            <label className="field">
              Fallart
              <select name="type" defaultValue={currentCase.type} required>
                {caseTypes.map((item) => (
                  <option key={item.dbValue} value={item.dbValue}>{item.title}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Titel
              <input name="title" type="text" maxLength={140} defaultValue={currentCase.title} required />
            </label>

            <label className="field">
              Anbieter oder Unternehmen
              <input name="companyName" type="text" maxLength={160} defaultValue={currentCase.company_name ?? ""} />
            </label>

            <label className="field">
              Bestell-, Vertrags- oder Vorgangsnummer
              <input name="orderReference" type="text" maxLength={120} defaultValue={currentCase.order_reference ?? ""} />
            </label>

            <label className="field">
              Betrag in Euro
              <input name="amount" type="text" inputMode="decimal" maxLength={32} defaultValue={amountValue(currentCase.amount_cents)} placeholder="129,90" />
            </label>

            <label className="field">
              Vorfallsdatum
              <input name="incidentDate" type="date" defaultValue={currentCase.incident_date ?? ""} />
            </label>

            <label className="field field-full">
              Zusammenfassung
              <textarea name="summary" rows={7} maxLength={5000} defaultValue={currentCase.summary ?? ""} />
            </label>
          </div>

          <div className="form-actions">
            <Link className="button button-ghost" href={`/faelle/${id}`}>Abbrechen</Link>
            <button className="button button-primary" type="submit">Änderungen speichern</button>
          </div>
        </form>
      </section>
    </main>
  );
}
