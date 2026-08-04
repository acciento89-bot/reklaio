import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { getCaseAssistant } from "@/lib/case-assistant";
import { getCaseTypeByValue } from "@/lib/case-types";
import { CaseAssistantCard } from "@/components/case-assistant-card";

type AssistantPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; error?: string }>;
};

type AssistantCase = {
  id: string;
  type: string;
  status: string;
  title: string;
  company_name: string | null;
  order_reference: string | null;
  amount_cents: number | null;
  incident_date: string | null;
  summary: string | null;
  document_count: number;
  event_count: number;
  open_deadline_count: number;
  next_due_at: string | null;
  letter_count: number;
  open_task_count: number;
  latest_response_outcome: string | null;
  latest_promised_due_at: string | null;
  last_escalation_stage: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AssistantPage({ params, searchParams }: AssistantPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const messages = await searchParams;

  if (!UUID_PATTERN.test(id)) notFound();

  const result = await query<AssistantCase>(
    `SELECT
       c.id, c.type, c.status, c.title, c.company_name, c.order_reference,
       c.amount_cents, c.incident_date, c.summary,
       (SELECT COUNT(*)::int FROM case_documents d WHERE d.case_id = c.id) AS document_count,
       (SELECT COUNT(*)::int FROM case_events e WHERE e.case_id = c.id) AS event_count,
       (SELECT COUNT(*)::int FROM case_deadlines d WHERE d.case_id = c.id AND d.completed_at IS NULL) AS open_deadline_count,
       (SELECT MIN(d.due_at) FROM case_deadlines d WHERE d.case_id = c.id AND d.completed_at IS NULL) AS next_due_at,
       (SELECT COUNT(*)::int FROM generated_letters l WHERE l.case_id = c.id) AS letter_count,
       (SELECT COUNT(*)::int FROM case_tasks t WHERE t.case_id = c.id AND t.status = 'open') AS open_task_count,
       (SELECT r.outcome FROM provider_responses r WHERE r.case_id = c.id ORDER BY r.response_received_at DESC, r.created_at DESC LIMIT 1) AS latest_response_outcome,
       (SELECT r.promised_due_at FROM provider_responses r WHERE r.case_id = c.id AND r.promised_due_at IS NOT NULL ORDER BY r.response_received_at DESC, r.created_at DESC LIMIT 1) AS latest_promised_due_at,
       (SELECT e.stage FROM case_escalations e WHERE e.case_id = c.id ORDER BY e.created_at DESC LIMIT 1) AS last_escalation_stage
     FROM cases c
     WHERE c.id = $1 AND c.user_id = $2
     LIMIT 1`,
    [id, user.id]
  );

  const currentCase = result.rows[0];
  if (!currentCase) notFound();

  const assistant = getCaseAssistant({
    id: currentCase.id,
    type: currentCase.type,
    status: currentCase.status,
    companyName: currentCase.company_name,
    orderReference: currentCase.order_reference,
    amountCents: currentCase.amount_cents,
    incidentDate: currentCase.incident_date,
    summary: currentCase.summary,
    documentCount: currentCase.document_count,
    eventCount: currentCase.event_count,
    openDeadlineCount: currentCase.open_deadline_count,
    nextDueAt: currentCase.next_due_at,
    letterCount: currentCase.letter_count,
    openTaskCount: currentCase.open_task_count,
    latestResponseOutcome: currentCase.latest_response_outcome,
    latestPromisedDueAt: currentCase.latest_promised_due_at,
    lastEscalationStage: currentCase.last_escalation_stage
  });

  const type = getCaseTypeByValue(currentCase.type);

  return (
    <main className="assistant-page container">
      <header className="case-detail-topbar">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={`/faelle/${id}`}>← Zur Fallakte</Link>
      </header>

      <section className="assistant-page-header">
        <div>
          <span className="eyebrow">{type?.title ?? "Verbraucherfall"}</span>
          <h1>Fallassistent</h1>
          <p>{currentCase.title}{currentCase.company_name ? ` · ${currentCase.company_name}` : ""}</p>
        </div>
      </section>

      {messages.notice ? <div className="notice-card assistant-notice" role="status"><strong>{messages.notice}</strong></div> : null}
      {messages.error ? <div className="form-error assistant-notice" role="alert">{messages.error}</div> : null}

      <CaseAssistantCard caseId={id} assistant={assistant} />

      <section className="assistant-explanation-grid">
        <article className="detail-panel">
          <span className="eyebrow">So bewertet Reklaio</span>
          <h2>Vollständigkeit</h2>
          <p>Berücksichtigt werden Falldaten, Belege, Chronik, Fristen, Schreiben, Aufgaben, Anbieterantworten und dokumentierte Eskalationsschritte.</p>
        </article>
        <article className="detail-panel">
          <span className="eyebrow">Priorität</span>
          <h2>Fristen und Zusagen zuerst</h2>
          <p>Überfällige Fristen und überschrittene Anbieterzusagen werden automatisch vor anderen Empfehlungen priorisiert.</p>
        </article>
        <article className="detail-panel">
          <span className="eyebrow">Fallsteuerung</span>
          <h2>Aufgabe oder Eskalation</h2>
          <p>Antworten erzeugen passende Folgeaufgaben. Nach Ablehnung oder Fristablauf führt der Assistent direkt zur dokumentierten Eskalation.</p>
        </article>
      </section>
    </main>
  );
}
