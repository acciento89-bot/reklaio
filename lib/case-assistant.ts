export type CaseAssistantPriority = "complete" | "urgent" | "soon" | "normal";

export type CaseAssistantAction =
  | { kind: "link"; href: string; label: string }
  | { kind: "deadline"; label: string };

export type CaseAssistantInput = {
  id: string;
  type: string;
  status: string;
  companyName: string | null;
  orderReference: string | null;
  amountCents: number | null;
  incidentDate: string | Date | null;
  summary: string | null;
  documentCount: number;
  eventCount: number;
  openDeadlineCount: number;
  nextDueAt: string | Date | null;
  letterCount: number;
  openTaskCount?: number;
  latestResponseOutcome?: string | null;
  latestPromisedDueAt?: string | Date | null;
  lastEscalationStage?: string | null;
};

export type CaseAssistantResult = {
  completeness: number;
  priority: CaseAssistantPriority;
  priorityLabel: string;
  headline: string;
  description: string;
  missingItems: string[];
  action: CaseAssistantAction;
};

type Check = { done: boolean; label: string; weight: number };

function hasText(value: string | null | undefined, minimum = 1) {
  return Boolean(value && value.trim().length >= minimum);
}

function distanceInDays(value: string | Date | null | undefined) {
  if (!value) return null;
  const due = new Date(value).getTime();
  if (!Number.isFinite(due)) return null;
  return Math.ceil((due - Date.now()) / 86_400_000);
}

function defaultLetterLabel(type: string) {
  switch (type) {
    case "refund_missing": return "Zahlungserinnerung vorbereiten";
    case "delivery_missing": return "Lieferstatus schriftlich anfordern";
    case "product_problem": return "Mängelanzeige vorbereiten";
    case "cancellation_ignored": return "Kündigungsbestätigung anfordern";
    default: return "Schreiben vorbereiten";
  }
}

export function getCaseAssistant(input: CaseAssistantInput): CaseAssistantResult {
  const amountRelevant = ["refund_missing", "product_problem", "cancellation_ignored"].includes(input.type);
  const checks: Check[] = [
    { done: hasText(input.companyName), label: "Anbieter oder Unternehmen", weight: 12 },
    { done: hasText(input.orderReference), label: "Bestell-, Vertrags- oder Vorgangsnummer", weight: 10 },
    { done: Boolean(input.incidentDate), label: "Datum des Vorfalls", weight: 10 },
    { done: hasText(input.summary, 20), label: "aussagekräftige Zusammenfassung", weight: 14 },
    { done: !amountRelevant || (input.amountCents ?? 0) > 0, label: "betroffener Betrag", weight: amountRelevant ? 8 : 0 },
    { done: input.documentCount > 0, label: "mindestens ein Beleg", weight: 16 },
    { done: input.eventCount > 0, label: "mindestens ein Chronik-Eintrag", weight: 10 },
    { done: input.openDeadlineCount > 0, label: "offene Frist", weight: 12 },
    { done: input.letterCount > 0, label: "vorbereitetes oder gespeichertes Schreiben", weight: 8 }
  ].filter((check) => check.weight > 0);

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const completedWeight = checks.reduce((sum, check) => sum + (check.done ? check.weight : 0), 0);
  const completeness = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 100;
  const missingItems = checks.filter((check) => !check.done).map((check) => check.label);
  const deadlineDistance = distanceInDays(input.nextDueAt);
  const promiseDistance = distanceInDays(input.latestPromisedDueAt);

  if (["resolved", "closed"].includes(input.status)) {
    return {
      completeness: 100,
      priority: "complete",
      priorityLabel: "Abgeschlossen",
      headline: "Fall ist abgeschlossen",
      description: "Die Fallakte bleibt mit Chronik, Dokumenten, Fristen, Aufgaben und Schreiben vollständig erhalten.",
      missingItems: [],
      action: { kind: "link", href: `/faelle/${input.id}/verwalten`, label: "Fall verwalten" }
    };
  }

  if (promiseDistance !== null && promiseDistance < 0) {
    return {
      completeness,
      priority: "urgent",
      priorityLabel: "Zusage überfällig",
      headline: "Ein zugesagter Termin ist überschritten",
      description: "Prüfe Zahlung, Lieferung oder Bestätigung und dokumentiere anschließend die nächste Eskalationsstufe.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}/steuerung#eskalation`, label: "Eskalation prüfen" }
    };
  }

  if (deadlineDistance !== null && deadlineDistance < 0) {
    return {
      completeness,
      priority: "urgent",
      priorityLabel: "Dringend",
      headline: "Eine Frist ist überschritten",
      description: "Dokumentiere die ausbleibende Reaktion und wähle in der Fallsteuerung den nächsten Schritt.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}/steuerung#eskalation`, label: "Eskalationsstufe wählen" }
    };
  }

  if (promiseDistance !== null && promiseDistance <= 3) {
    return {
      completeness,
      priority: "soon",
      priorityLabel: "Zusage beobachten",
      headline: promiseDistance === 0 ? "Zugesagter Termin ist heute" : `Zugesagter Termin in ${promiseDistance} Tagen`,
      description: "Prüfe am Termin, ob die angekündigte Zahlung, Lieferung oder Bestätigung eingegangen ist.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}/steuerung#aufgaben`, label: "Aufgaben öffnen" }
    };
  }

  if (deadlineDistance !== null && deadlineDistance <= 3) {
    return {
      completeness,
      priority: "soon",
      priorityLabel: "Bald fällig",
      headline: deadlineDistance === 0 ? "Frist läuft heute ab" : `Frist läuft in ${deadlineDistance} Tagen ab`,
      description: "Prüfe, ob eine Antwort oder Zahlung eingegangen ist, und erfasse das Ergebnis in der Fallsteuerung.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}/steuerung#antworten`, label: "Antwort erfassen" }
    };
  }

  if (["rejected", "partial_offer"].includes(input.latestResponseOutcome ?? "")) {
    return {
      completeness,
      priority: "normal",
      priorityLabel: "Entscheidung nötig",
      headline: input.latestResponseOutcome === "rejected" ? "Anbieter hat abgelehnt" : "Teilangebot liegt vor",
      description: "Bewerte die Antwort und dokumentiere, ob erneut geschrieben, eine letzte Frist gesetzt oder eine weitere Stelle eingeschaltet wird.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}/steuerung#eskalation`, label: "Nächste Stufe wählen" }
    };
  }

  if (input.latestResponseOutcome === "question") {
    return {
      completeness,
      priority: "normal",
      priorityLabel: "Antwort erforderlich",
      headline: "Der Anbieter hat eine Rückfrage gestellt",
      description: "Beantworte die Rückfrage schriftlich und füge passende Belege direkt als E-Mail-Anhang hinzu.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}/schreiben/neu`, label: "Antwort vorbereiten" }
    };
  }

  if ((input.openTaskCount ?? 0) > 0) {
    return {
      completeness,
      priority: "normal",
      priorityLabel: "Aufgabe offen",
      headline: `${input.openTaskCount} offene ${input.openTaskCount === 1 ? "Aufgabe" : "Aufgaben"}`,
      description: "Bearbeite die nächste Aufgabe oder passe die Fallsteuerung an die aktuelle Entwicklung an.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}/steuerung#aufgaben`, label: "Aufgaben öffnen" }
    };
  }

  if (!hasText(input.companyName) || !hasText(input.orderReference) || !hasText(input.summary, 20)) {
    return {
      completeness,
      priority: "normal",
      priorityLabel: "Ergänzen",
      headline: "Grunddaten vervollständigen",
      description: "Anbieter, Referenz und eine kurze Zusammenfassung machen die Fallakte nachvollziehbar und verbessern alle weiteren Schreiben.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}/bearbeiten`, label: "Falldaten ergänzen" }
    };
  }

  if (input.documentCount === 0) {
    return {
      completeness,
      priority: "normal",
      priorityLabel: "Nachweis fehlt",
      headline: "Ersten Beleg hinzufügen",
      description: "Speichere Rechnung, Bestätigung, Tracking, Kündigung oder einen anderen Nachweis direkt in der Fallakte.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}`, label: "Dokument hochladen" }
    };
  }

  if (input.openDeadlineCount === 0) {
    return {
      completeness,
      priority: "normal",
      priorityLabel: "Frist empfohlen",
      headline: "Verbindliche Frist setzen",
      description: "Eine klare Frist schafft einen überprüfbaren Zeitpunkt für die nächste Reaktion. Reklaio kann automatisch eine Frist in sieben Tagen anlegen.",
      missingItems,
      action: { kind: "deadline", label: "7-Tage-Frist anlegen" }
    };
  }

  if (input.letterCount === 0) {
    return {
      completeness,
      priority: "normal",
      priorityLabel: "Nächster Schritt",
      headline: "Schriftliche Aufforderung vorbereiten",
      description: "Erstelle ein Schreiben aus den vorhandenen Falldaten und passe es vor dem Versand persönlich an.",
      missingItems,
      action: { kind: "link", href: `/faelle/${input.id}/schreiben/neu`, label: defaultLetterLabel(input.type) }
    };
  }

  return {
    completeness,
    priority: "normal",
    priorityLabel: input.lastEscalationStage ? "Eskalation läuft" : "Gut vorbereitet",
    headline: input.lastEscalationStage ? "Dokumentierten Eskalationsschritt verfolgen" : "Fall weiter beobachten",
    description: "Prüfe eingehende Antworten, erledige offene Aufgaben und dokumentiere jede neue Entwicklung.",
    missingItems,
    action: { kind: "link", href: `/faelle/${input.id}/steuerung`, label: "Fallsteuerung öffnen" }
  };
}

export function assistantPriorityRank(priority: CaseAssistantPriority) {
  switch (priority) {
    case "urgent": return 0;
    case "soon": return 1;
    case "normal": return 2;
    case "complete": return 3;
  }
}
