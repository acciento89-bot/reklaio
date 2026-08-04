export const taskPriorities = [
  { value: "low", label: "Niedrig" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Hoch" },
  { value: "urgent", label: "Dringend" }
] as const;

export const providerOutcomes = [
  { value: "accepted", label: "Forderung akzeptiert" },
  { value: "rejected", label: "Forderung abgelehnt" },
  { value: "question", label: "Rückfrage erhalten" },
  { value: "partial_offer", label: "Teilangebot erhalten" },
  { value: "other", label: "Andere Antwort" }
] as const;

export const escalationStages = [
  { value: "reminder", label: "Erneute Aufforderung", description: "Sachlich an die offene Reaktion erinnern." },
  { value: "final_deadline", label: "Letzte Frist", description: "Eine letzte, eindeutig dokumentierte Frist setzen." },
  { value: "payment_provider", label: "Zahlungsanbieter oder Bank", description: "Kontakt oder Vorgang beim Zahlungsdienst dokumentieren." },
  { value: "mediation", label: "Schlichtungsstelle", description: "Eine passende Schlichtungsstelle als nächsten organisatorischen Weg festhalten." },
  { value: "consumer_center", label: "Verbraucherzentrale", description: "Beratung oder weitere Prüfung durch eine Verbraucherzentrale dokumentieren." },
  { value: "closed", label: "Fall abschließen", description: "Den Vorgang abschließen und die Fallakte erhalten." }
] as const;

export type TaskPriority = (typeof taskPriorities)[number]["value"];
export type ProviderOutcome = (typeof providerOutcomes)[number]["value"];
export type EscalationStage = (typeof escalationStages)[number]["value"];

export function getTaskPriority(value: string) {
  return taskPriorities.find((item) => item.value === value) ?? taskPriorities[1];
}

export function getProviderOutcome(value: string) {
  return providerOutcomes.find((item) => item.value === value) ?? providerOutcomes[4];
}

export function getEscalationStage(value: string) {
  return escalationStages.find((item) => item.value === value) ?? escalationStages[0];
}

export function parseOptionalDateTimeLocal(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) throw new Error("INVALID_DATETIME");
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) throw new Error("INVALID_DATETIME");
  return raw;
}
