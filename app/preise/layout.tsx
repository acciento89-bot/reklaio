import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preise: Reklaio Free und Pro",
  description:
    "Vergleiche Reklaio Free und Reklaio Pro. Die digitale Fallakte bleibt kostenlos; optionale KI-Funktionen sind im Pro-Tarif enthalten.",
  alternates: {
    canonical: "/preise"
  },
  openGraph: {
    url: "/preise",
    title: "Reklaio Preise – Free und Pro vergleichen",
    description:
      "Kostenlose Fallorganisation und optionale KI-Unterstützung im Reklaio-Pro-Tarif."
  }
};

export default function PricingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
