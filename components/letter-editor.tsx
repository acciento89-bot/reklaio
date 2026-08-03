"use client";

import { useMemo, useState } from "react";
import type { LetterKind, PreparedLetter } from "@/lib/letters";

type LetterEditorProps = {
  caseId: string;
  templates: PreparedLetter[];
  initialKind: LetterKind;
};

export function LetterEditor({ caseId, templates, initialKind }: LetterEditorProps) {
  const initialTemplate = templates.find((item) => item.kind === initialKind) ?? templates[0];
  const [kind, setKind] = useState<LetterKind>(initialTemplate.kind);
  const [subject, setSubject] = useState(initialTemplate.subject);
  const [body, setBody] = useState(initialTemplate.body);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.kind === kind) ?? templates[0],
    [kind, templates]
  );

  function changeTemplate(nextKind: LetterKind) {
    const nextTemplate = templates.find((item) => item.kind === nextKind);
    if (!nextTemplate) {
      return;
    }

    setKind(nextKind);
    setSubject(nextTemplate.subject);
    setBody(nextTemplate.body);
  }

  return (
    <form className="letter-editor" action={`/api/cases/${caseId}/letters`} method="post">
      <div className="letter-template-grid">
        <label className="field">
          Vorlage
          <select
            name="kind"
            value={kind}
            onChange={(event) => changeTemplate(event.target.value as LetterKind)}
          >
            {templates.map((template) => (
              <option value={template.kind} key={template.kind}>{template.label}</option>
            ))}
          </select>
          <small>{selectedTemplate.description}</small>
        </label>

        <div className="letter-safety-note">
          <strong>Vor dem Speichern prüfen</strong>
          <span>Platzhalter wie „[Datum einsetzen]“ ersetzen und den Text an deinen tatsächlichen Fall anpassen.</span>
        </div>
      </div>

      <label className="field">
        Betreff
        <input
          name="subject"
          type="text"
          maxLength={240}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
        />
      </label>

      <label className="field">
        Nachricht
        <textarea
          className="letter-body-input"
          name="body"
          rows={22}
          maxLength={20000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
        />
      </label>

      <div className="letter-editor-footer">
        <p>Reklaio erstellt eine Formulierungshilfe, keine Rechtsberatung. Du entscheidest über den endgültigen Inhalt.</p>
        <button className="button button-primary" type="submit">Schreiben speichern</button>
      </div>
    </form>
  );
}
