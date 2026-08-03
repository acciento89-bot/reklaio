"use client";

import { useState } from "react";

type LetterActionsProps = {
  subject: string;
  body: string;
};

export function LetterActions({ subject, body }: LetterActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copyLetter() {
    try {
      await navigator.clipboard.writeText(`Betreff: ${subject}\n\n${body}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="letter-action-buttons letter-no-print">
      <button className="button button-secondary" type="button" onClick={copyLetter}>
        {copied ? "Kopiert" : "Text kopieren"}
      </button>
      <button className="button button-secondary" type="button" onClick={() => window.print()}>
        Drucken / PDF
      </button>
    </div>
  );
}
