export const caseTypes = [
  {
    slug: "refund-missing",
    title: "Rückzahlung fehlt",
    description: "Retoure oder Storno bestätigt, aber das Geld ist noch nicht da.",
    icon: "€"
  },
  {
    slug: "delivery-missing",
    title: "Lieferung fehlt",
    description: "Das Paket ist verspätet, verschwunden oder als zugestellt markiert.",
    icon: "↗"
  },
  {
    slug: "product-problem",
    title: "Ware defekt oder falsch",
    description: "Mangel, Transportschaden, Falschlieferung oder unvollständige Bestellung.",
    icon: "!"
  },
  {
    slug: "cancellation-ignored",
    title: "Kündigung wird ignoriert",
    description: "Der Anbieter bestätigt nicht oder bucht weiter Geld ab.",
    icon: "×"
  }
] as const;
