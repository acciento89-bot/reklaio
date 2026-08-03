import Link from "next/link";
import { notFound } from "next/navigation";
import { LetterEditor } from "@/components/letter-editor";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  buildAllLetterTemplates,
  getSuggestedLetterKind,
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
          <p>Vorlage auswählen, Inhalt prüfen und als Entwurf in der Fallakte speichern.</p>
        </div>
      </section>

      {error ? <div className="form-error letter-error letter-no-print" role="alert">{error}</div> : null}

      <section className="detail-panel letter-editor-panel letter-no-print">
        <div className="letter-case-reference">
          <span>Fall</span>
          <strong>{currentCase.title}</strong>
          <small>{currentCase.company_name || "Kein Anbieter eingetragen"}</small>
        </div>

        <LetterEditor
          caseId={id}
          templates={templates}
          initialKind={getSuggestedLetterKind(currentCase.type)}
        />
      </section>
    </main>
  );
}
