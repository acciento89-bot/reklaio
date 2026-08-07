import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt und Support",
  description:
    "Kontaktiere den Reklaio-Support bei Fragen zur digitalen Fallakte, zu Funktionen, Tarifen oder deinem Konto.",
  alternates: {
    canonical: "/kontakt"
  },
  openGraph: {
    url: "/kontakt",
    title: "Reklaio Kontakt und Support",
    description: "Hilfe und Kontaktmöglichkeiten rund um Reklaio."
  }
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
