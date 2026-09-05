import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  if (await getLocale() === "en") return { title: "Contact and support", description: "Contact Reklaio support with questions about your case file, features, plan or account.", alternates: { canonical: "/en/kontakt", languages: { de: "/kontakt", en: "/en/kontakt" } } };
  return {
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
}

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
