import Link from "next/link";

export function LegalLayout({
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
  return (
    <main className="legal-page">
      <header className="legal-header container">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>Reklaio</span></Link>
        <Link className="text-link" href="/">← Zur Startseite</Link>
      </header>

      <section className="legal-hero container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>Stand: {updated}</p>
      </section>

      <article className="legal-content container">{children}</article>

      <footer className="legal-footer container">
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/nutzungsbedingungen">Nutzungsbedingungen</Link>
        <Link href="/hilfe">Hilfe</Link>
      </footer>
    </main>
  );
}
