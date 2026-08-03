import Link from "next/link";
import { caseTypes } from "@/lib/case-types";
import { requireUser } from "@/lib/auth";

export default async function NewCasePage() {
  await requireUser();

  return (
    <main className="form-page container">
      <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
      <div className="form-card">
        <span className="eyebrow">Schritt 1 von 4</span>
        <h1>Worum geht es?</h1>
        <p>Wähle den Fall, der am besten zu deiner Situation passt.</p>
        <div className="choice-list">
          {caseTypes.map((item) => (
            <button className="choice-card" key={item.slug} type="button">
              <span className="case-icon">{item.icon}</span>
              <span><strong>{item.title}</strong><small>{item.description}</small></span>
              <span>→</span>
            </button>
          ))}
        </div>
        <div className="form-footer">
          <Link className="text-link" href="/dashboard">Abbrechen</Link>
          <span>Im nächsten Schritt erfassen wir Anbieter, Betrag und Datum.</span>
        </div>
      </div>
    </main>
  );
}
