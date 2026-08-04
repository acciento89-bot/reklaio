import Link from "next/link";
import type { CaseAssistantResult } from "@/lib/case-assistant";

type CaseAssistantCardProps = {
  caseId: string;
  assistant: CaseAssistantResult;
};

export function CaseAssistantCard({ caseId, assistant }: CaseAssistantCardProps) {
  return (
    <article className={`case-assistant case-assistant-${assistant.priority}`}>
      <div className="case-assistant-heading">
        <div>
          <span className="eyebrow">Reklaio Fallassistent</span>
          <h2>{assistant.headline}</h2>
          <p>{assistant.description}</p>
        </div>
        <span className={`assistant-priority assistant-priority-${assistant.priority}`}>
          {assistant.priorityLabel}
        </span>
      </div>

      <div className="case-assistant-progress-row">
        <div>
          <span>Vollständigkeit der Fallakte</span>
          <strong>{assistant.completeness}%</strong>
        </div>
        <div className="case-assistant-progress" aria-label={`Fallakte zu ${assistant.completeness} Prozent vollständig`}>
          <span style={{ width: `${assistant.completeness}%` }} />
        </div>
      </div>

      {assistant.missingItems.length > 0 ? (
        <div className="case-assistant-missing">
          <strong>Noch sinnvoll zu ergänzen</strong>
          <ul>
            {assistant.missingItems.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="case-assistant-action">
        <div>
          <span>Nächster empfohlener Schritt</span>
          <strong>{assistant.action.label}</strong>
        </div>
        {assistant.action.kind === "deadline" ? (
          <form action={`/api/cases/${caseId}/assistant/deadline`} method="post">
            <button className="button button-primary" type="submit">{assistant.action.label}</button>
          </form>
        ) : (
          <Link className="button button-primary" href={assistant.action.href}>{assistant.action.label}</Link>
        )}
      </div>
    </article>
  );
}
