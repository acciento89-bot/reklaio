export const caseStatuses = [
  { value: "draft", label: "Entwurf", tone: "neutral" },
  { value: "collecting_evidence", label: "Belege sammeln", tone: "neutral" },
  { value: "ready_to_contact", label: "Kontakt vorbereiten", tone: "neutral" },
  { value: "waiting_for_reply", label: "Antwort ausstehend", tone: "warning" },
  { value: "deadline_expired", label: "Frist abgelaufen", tone: "danger" },
  { value: "escalation", label: "Eskalation prüfen", tone: "danger" },
  { value: "resolved", label: "Gelöst", tone: "success" },
  { value: "closed", label: "Geschlossen", tone: "muted" }
] as const;

export type CaseStatus = (typeof caseStatuses)[number]["value"];

export function getCaseStatus(value: string) {
  return caseStatuses.find((item) => item.value === value) ?? caseStatuses[0];
}

export function formatCurrency(cents: number | null, currency = "EUR") {
  if (cents === null) {
    return "–";
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency
  }).format(cents / 100);
}

export function formatDate(value: string | Date | null) {
  if (!value) {
    return "–";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null) {
  if (!value) {
    return "–";
  }

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function parseAmountCents(rawValue: string) {
  const value = rawValue.trim().replace(/\s/g, "");

  if (!value) {
    return null;
  }

  if (!/^\d{1,9}(?:[,.]\d{1,2})?$/.test(value)) {
    throw new Error("INVALID_AMOUNT");
  }

  const normalized = value.replace(",", ".");
  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("INVALID_AMOUNT");
  }

  return Math.round(amount * 100);
}
