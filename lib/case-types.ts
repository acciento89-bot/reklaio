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

export const caseTypesEn = [
  {
    ...caseTypes[0],
    title: "Refund missing",
    description: "Your return or cancellation was confirmed, but the money has not arrived.",
    checklistTitle: "What you should have ready",
    checklist: ["Order or contract number", "Return receipt or cancellation confirmation", "Promised refund date", "Bank statement or proof of payment"]
  },
  {
    ...caseTypes[1],
    title: "Delivery missing",
    description: "Your parcel is late, missing or incorrectly marked as delivered.",
    checklistTitle: "What you should have ready",
    checklist: ["Order number and purchase date", "Tracking number and tracking history", "Announced delivery date", "Previous communication with the retailer or carrier"]
  },
  {
    ...caseTypes[2],
    title: "Product faulty or incorrect",
    description: "A defect, shipping damage, incorrect item or incomplete order.",
    checklistTitle: "What you should have ready",
    checklist: ["Invoice or order confirmation", "Photos of the defect or incorrect item", "Delivery date and first complaint", "Preferred solution: replacement, repair or refund"]
  },
  {
    ...caseTypes[3],
    title: "Cancellation ignored",
    description: "The provider does not confirm your cancellation, renews the contract or charges you again.",
    checklistTitle: "What you should have ready",
    checklist: ["Contract or customer number", "Cancellation notice and proof of delivery", "Requested contract end date", "Charges made after cancellation"]
  }
] as const;

export function getLocalizedCaseTypes(locale: "de" | "en") {
  return locale === "en" ? caseTypesEn : caseTypes;
}

export function getLocalizedCaseTypeByValue(value: string, locale: "de" | "en") {
  return getLocalizedCaseTypes(locale).find((item) => item.dbValue === value) ?? null;
}
