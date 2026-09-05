import Link from "next/link";
import { getLocale, localizedPath } from "@/lib/i18n";

export async function LegalLayout({
  eyebrow,
  title,
  updated,
  children
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const en = locale === "en";
  return (
    <main className="legal-page">
      <header className="legal-header container">
        <Link className="brand" href={localizedPath("/", locale)}><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href={localizedPath("/", locale)}>← {en ? "Home" : "Zur Startseite"}</Link>
      </header>

      <section className="legal-hero container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{en ? "Last updated" : "Stand"}: {updated}</p>
      </section>

      <article className="legal-content container">{children}</article>

      <footer className="legal-footer container">
        <Link href={localizedPath("/kontakt", locale)}>{en ? "Contact" : "Kontakt"}</Link>
        <Link href={localizedPath("/preise", locale)}>{en ? "Pricing" : "Preise"}</Link>
        <Link href={localizedPath("/impressum", locale)}>{en ? "Legal notice" : "Impressum"}</Link>
        <Link href={localizedPath("/datenschutz", locale)}>{en ? "Privacy" : "Datenschutz"}</Link>
        <Link href={localizedPath("/agb", locale)}>{en ? "Terms" : "AGB"}</Link>
        <Link href={localizedPath("/widerruf", locale)}>{en ? "Withdrawal" : "Widerruf"}</Link>
        <Link href={localizedPath("/hilfe", locale)}>{en ? "Help" : "Hilfe"}</Link>
      </footer>
    </main>
  );
}
