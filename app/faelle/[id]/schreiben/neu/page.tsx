import Link from "next/link";
import { notFound } from "next/navigation";
import { LetterEditor } from "@/components/letter-editor";
import { isAiConfigured } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  buildAllLetterTemplates,
  getSuggestedLetterKind,
  letterKinds,
  type LetterCaseData
} from "@/lib/letters";
import type { CaseTypeValue } from "@/lib/case-types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type NewLetterPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

type LetterCaseRow = {
  type: CaseTypeValue;
  title: string;
  company_name: string | null;
  order_reference: string | null;
  amount_cents: number | null;
  currency: string;
  incident_date: string | null;
  summary: string | null;
};

export default async function NewLetterPage({ params, searchParams }: NewLetterPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const result = await query<LetterCaseRow>(
    `SELECT type, title, company_name, order_reference, amount_cents,
            currency, incident_date, summary
     FROM cases
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [id, user.id]
  );

  const currentCase = result.rows[0];
  if (!currentCase) {
    notFound();
  }

  const caseData: LetterCaseData = {
    type: currentCase.type,
    title: currentCase.title,
    companyName: currentCase.company_name,
    orderReference: currentCase.order_reference,
    amountCents: currentCase.amount_cents,
    currency: currentCase.currency,
    incidentDate: currentCase.incident_date,
    summary: currentCase.summary
  };

  const templates = buildAllLetterTemplates(caseData, {
    displayName: user.displayName,
    email: user.email
  });
  const suggestedKind = getSuggestedLetterKind(currentCase.type);
  const aiConfigured = isAiConfigured();

  return (
    <main className="letter-page container">
      <header className="case-detail-topbar letter-no-print">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={`/faelle/${id}`}>← Zur Fallakte</Link>
      </header>

      <section className="letter-page-header letter-no-print">
        <div>
          <span className="eyebrow">Formulierungshilfe</span>
          <h1>Neues Schreiben</h1>
          <p>Nutze eine feste Vorlage oder erstelle freiwillig einen KI-Entwurf. Jeder Text muss vor dem Versand geprüft werden.</p>
        </div>
      </section>

      {error ? <div className="form-error letter-error letter-no-print" role="alert">{error}</div> : null}

      <section className="detail-panel letter-editor-panel letter-no-print">
        <div className="letter-case-reference">
          <span>Fall</span>
          <strong>{currentCase.title}</strong>
          <small>{currentCase.company_name || "Kein Anbieter eingetragen"}</small>
        </div>

        <span className="eyebrow">Ohne externe Verarbeitung</span>
        <h2>Bewährte Reklaio-Vorlage</h2>
        <p className="muted-copy">Die Vorlage wird direkt aus deinen Falldaten im Reklaio-System erstellt und nicht an einen KI-Anbieter übermittelt.</p>

        <LetterEditor
          caseId={id}
          templates={templates}
          initialKind={suggestedKind}
        />
      </section>

      <section className="ai-letter-panel letter-no-print">
        <span className="eyebrow">Optionaler KI-Entwurf</span>
        <h2>Individuelles Schreiben aus bestätigten Falldaten</h2>
        <p>Reklaio übermittelt die sichtbaren Falldaten, die gewählte Schreibenart und deine gewünschte Lösung an die OpenAI API. Der Entwurf wird gespeichert, bleibt vollständig bearbeitbar und wird niemals automatisch versendet.</p>

        {aiConfigured ? (
          <form className="ai-letter-form" action={`/api/cases/${id}/letters/ai`} method="post">
            <label className="field">
              Schreibenart
              <select name="kind" defaultValue={suggestedKind}>
                {letterKinds.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="field">
              Gewünschte Antwortfrist
              <input name="deadlineDate" type="date" />
            </label>
            <label className="field field-full">
              Gewünschte Lösung
              <textarea
                name="desiredOutcome"
                rows={5}
                maxLength={1500}
                placeholder="z. B. Rückzahlung des vollständigen Betrags und schriftliche Bestätigung bis zum gewählten Datum"
                required
              />
            </label>
            <label className="ai-consent-check">
              <input name="aiConsent" type="checkbox" required />
              <span>Ich willige für diesen Vorgang in die Übermittlung der sichtbaren Falldaten und meiner Anweisung an die OpenAI API ein. Ich prüfe den Entwurf vollständig und habe die <Link href="/datenschutz" target="_blank">Datenschutzerklärung</Link> gelesen.</span>
            </label>
            <button className="button button-primary" type="submit">KI-Entwurf erstellen</button>
          </form>
        ) : (
          <div className="legal-note">Die KI-Funktion ist noch nicht konfiguriert. Die normalen Reklaio-Vorlagen stehen weiterhin vollständig zur Verfügung.</div>
        )}
      </section>
    </main>
  );
}
