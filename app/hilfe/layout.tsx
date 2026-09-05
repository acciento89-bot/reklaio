import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  if (await getLocale() === "en") return { title: "Help for your digital case file", description: "Learn how to create cases, organise evidence, track deadlines and prepare letters with Reklaio.", alternates: { canonical: "/en/hilfe", languages: { de: "/hilfe", en: "/en/hilfe" } } };
  return {
  title: "Hilfe zur digitalen Fallakte",
  description:
    "Antworten zur Nutzung von Reklaio: Fälle anlegen, Belege organisieren, Fristen verfolgen und eigene Schreiben vorbereiten.",
  alternates: {
    canonical: "/hilfe"
  },
  openGraph: {
    url: "/hilfe",
    title: "Reklaio Hilfe – Fälle, Belege und Fristen organisieren",
    description:
      "So nutzt du Reklaio für eine übersichtliche Dokumentation deiner Verbraucherfälle."
  }
  };
}

export default function HelpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
