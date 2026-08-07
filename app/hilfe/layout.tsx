import type { Metadata } from "next";

export const metadata: Metadata = {
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

export default function HelpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
