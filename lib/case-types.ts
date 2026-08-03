export const caseTypes = [
  {
    slug: "refund-missing",
    dbValue: "refund_missing",
    title: "Rückzahlung fehlt",
    description: "Retoure oder Storno bestätigt, aber das Geld ist noch nicht da.",
    icon: "€"
  },
  {
    slug: "delivery-missing",
    dbValue: "delivery_missing",
    title: "Lieferung fehlt",
    description: "Das Paket ist verspätet, verschwunden oder als zugestellt markiert.",
    icon: "↗"
  },
  {
    slug: "product-problem",
    dbValue: "product_problem",
    title: "Ware defekt oder falsch",
    description: "Mangel, Transportschaden, Falschlieferung oder unvollständige Bestellung.",
    icon: "!"
  },
  {
    slug: "cancellation-ignored",
    dbValue: "cancellation_ignored",
    title: "Kündigung wird ignoriert",
    description: "Der Anbieter bestätigt nicht oder bucht weiter Geld ab.",
    icon: "×"
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
