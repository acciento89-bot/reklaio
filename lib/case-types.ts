export const caseTypes = [
  {
    slug: "refund-missing",
    dbValue: "refund_missing",
    title: "Rückzahlung fehlt",
    description: "Retoure oder Storno bestätigt, aber das Geld ist noch nicht eingegangen.",
    icon: "€",
    checklistTitle: "Für diesen Fall bereithalten",
    checklist: [
      "Bestell- oder Vertragsnummer",
      "Retourenbeleg oder Stornobestätigung",
      "Datum der zugesagten Rückzahlung",
      "Kontoauszug oder Zahlungsnachweis"
    ]
  },
  {
    slug: "delivery-missing",
    dbValue: "delivery_missing",
    title: "Lieferung fehlt",
    description: "Das Paket ist verspätet, verschwunden oder fälschlich als zugestellt markiert.",
    icon: "↗",
    checklistTitle: "Für diesen Fall bereithalten",
    checklist: [
      "Bestellnummer und Kaufdatum",
      "Sendungsnummer und Trackingverlauf",
      "Angekündigtes Lieferdatum",
      "Bisherige Kommunikation mit Händler oder Paketdienst"
    ]
  },
  {
    slug: "product-problem",
    dbValue: "product_problem",
    title: "Ware defekt oder falsch",
    description: "Mangel, Transportschaden, Falschlieferung oder unvollständige Bestellung.",
    icon: "!",
    checklistTitle: "Für diesen Fall bereithalten",
    checklist: [
      "Rechnung oder Bestellbestätigung",
      "Fotos des Mangels oder der Falschlieferung",
      "Datum der Lieferung und ersten Reklamation",
      "Gewünschte Lösung: Ersatz, Reparatur oder Erstattung"
    ]
  },
  {
    slug: "cancellation-ignored",
    dbValue: "cancellation_ignored",
    title: "Kündigung wird ignoriert",
    description: "Der Anbieter bestätigt nicht, verlängert weiter oder bucht erneut Geld ab.",
    icon: "×",
    checklistTitle: "Für diesen Fall bereithalten",
    checklist: [
      "Vertrags- oder Kundennummer",
      "Kündigungsschreiben und Versandnachweis",
      "Gewünschtes Vertragsende",
      "Abbuchungen nach der Kündigung"
    ]
  }
] as const;

export type CaseTypeSlug = (typeof caseTypes)[number]["slug"];
export type CaseTypeValue = (typeof caseTypes)[number]["dbValue"];

export function getCaseTypeBySlug(slug: string) {
  return caseTypes.find((item) => item.slug === slug) ?? null;
}

export function getCaseTypeByValue(value: string) {
  return caseTypes.find((item) => item.dbValue === value) ?? null;
}
