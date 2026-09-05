import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  if (await getLocale() === "en") return { title: "Pricing: Reklaio Free and Pro", description: "Compare Reklaio Free and Reklaio Pro. Digital case management stays free; optional AI features are included with Pro.", alternates: { canonical: "/en/preise", languages: { de: "/preise", en: "/en/preise" } } };
  return {
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
}

export default function PricingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
