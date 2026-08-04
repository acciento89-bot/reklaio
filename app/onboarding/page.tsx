import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

const steps = [
  {
    key: "case",
    number: "01",
    title: "Ersten Fall anlegen",
    description: "Wähle die passende Fallart und erfasse Anbieter, Referenz und Sachverhalt.",
    href: "/neuer-fall",
    action: "Fall anlegen"
  },
  {
    key: "document",
    number: "02",
    title: "Beleg hinzufügen",
    description: "Lade Rechnung, E-Mail, Foto oder Trackingbeleg in der Fallakte hoch.",
    href: "/dashboard",
    action: "Fall öffnen"
  },
  {
    key: "deadline",
    number: "03",
    title: "Frist festhalten",
    description: "Lege einen überprüfbaren Termin an oder nutze die Empfehlung des Fallassistenten.",
    href: "/fristen",
    action: "Fristen ansehen"
  },
  {
    key: "letter",
    number: "04",
    title: "Schreiben vorbereiten",
    description: "Nutze eine neutrale Vorlage oder erstelle freiwillig einen KI-Entwurf und prüfe ihn vollständig.",
    href: "/dashboard",
    action: "Fall öffnen"
  },
  {
    key: "assistant",
    number: "05",
    title: "Nächsten Schritt prüfen",
    description: "Der Fallassistent zeigt Vollständigkeit, Priorität und die nächste sinnvolle organisatorische Aktion.",
    href: "/dashboard",
    action: "Zum Dashboard"
  }
] as const;

type Counts = {
  case_count: number;
  document_count: number;
  deadline_count: number;
  letter_count: number;
};

type OnboardingPageProps = {
  searchParams: Promise<{ notice?: string; error?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const user = await requireUser();
  const messages = await searchParams;

  const result = await query<Counts>(
    `SELECT
       (SELECT COUNT(*)::int FROM cases c WHERE c.user_id = $1) AS case_count,
       (SELECT COUNT(*)::int FROM case_documents d JOIN cases c ON c.id = d.case_id WHERE c.user_id = $1) AS document_count,
       (SELECT COUNT(*)::int FROM case_deadlines d JOIN cases c ON c.id = d.case_id WHERE c.user_id = $1) AS deadline_count,
       (SELECT COUNT(*)::int FROM generated_letters l JOIN cases c ON c.id = l.case_id WHERE c.user_id = $1) AS letter_count`,
    [user.id]
  );

  const counts = result.rows[0] ?? { case_count: 0, document_count: 0, deadline_count: 0, letter_count: 0 };
  const completed = {
    case: counts.case_count > 0,
    document: counts.document_count > 0,
    deadline: counts.deadline_count > 0,
    letter: counts.letter_count > 0,
    assistant: counts.case_count > 0
  };
  const completedCount = Object.values(completed).filter(Boolean).length;

  return (
    <main className="onboarding-page">
      <header className="onboarding-header container">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href="/dashboard">Zum Dashboard</Link>
      </header>

      <section className="onboarding-hero container">
        <div>
          <span className="eyebrow">Geführter Einstieg</span>
          <h1>Dein erster Fall in fünf klaren Schritten</h1>
          <p>Du kannst die Einführung jederzeit unter Hilfe erneut öffnen. Alle Schritte sind freiwillig und lassen sich später vervollständigen.</p>
        </div>
        <div className="onboarding-progress-card">
          <strong>{completedCount} von 5</strong>
          <span>Schritten erledigt</span>
          <div className="onboarding-progress"><span style={{ width: `${completedCount * 20}%` }} /></div>
        </div>
      </section>

      {messages.notice ? <div className="notice-card onboarding-notice container" role="status"><strong>{messages.notice}</strong></div> : null}
      {messages.error ? <div className="form-error onboarding-notice container" role="alert">{messages.error}</div> : null}

      <section className="onboarding-steps container">
        {steps.map((step) => {
          const done = completed[step.key];
          return (
            <article className={`onboarding-step${done ? " is-complete" : ""}`} key={step.key}>
              <span className="onboarding-step-number">{done ? "✓" : step.number}</span>
              <div>
                <h2>{step.title}</h2>
                <p>{step.description}</p>
              </div>
              <Link className="button button-secondary" href={step.href}>{done ? "Erledigt" : step.action}</Link>
            </article>
          );
        })}
      </section>

      <section className="onboarding-footer container">
        <div>
          <strong>Einführung abschließen</strong>
          <p>Dadurch werden keine Falldaten verändert. Der Einstieg verschwindet lediglich aus den Hinweisen.</p>
        </div>
        <form action="/api/onboarding/complete" method="post">
          <button className="button button-primary" name="mode" value="complete" type="submit">Einführung abschließen</button>
          <button className="button button-ghost" name="mode" value="dismiss" type="submit">Vorerst überspringen</button>
        </form>
      </section>
    </main>
  );
}
