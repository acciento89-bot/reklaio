import type { Metadata } from "next";
import Link from "next/link";
import { seoGuides } from "@/lib/seo-guides";

export const metadata: Metadata = {
  title: "Ratgeber zu Reklamationen, Mängeln und Rückzahlungen",
  description:
    "Praktische Checklisten und Formulierungshilfen für Reklamationen, defekte Ware, Nacherfüllung und Rückzahlungen – sachlich erklärt und ohne Rechtsberatung.",
  alternates: {
    canonical: "/ratgeber"
  },
  openGraph: {
    url: "/ratgeber",
    title: "Reklaio Ratgeber – Verbraucherfälle klar dokumentieren",
    description:
      "Schritt-für-Schritt-Hilfen für Reklamationen, defekte Ware und Rückzahlungen."
  }
};

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Reklaio Ratgeber",
  itemListElement: seoGuides.map((guide, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: guide.title,
    url: `https://reklaio.de/${guide.slug}`
  }))
};

export default function GuideIndexPage() {
  return (
    <main className="guide-index">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c")
        }}
      />

      <header className="guide-topbar container">
        <Link className="brand" href="/" aria-label="Reklaio Startseite">
          <span className="brand-mark">R</span>
          <span className="brand-copy"><strong>Reklaio</strong><small>by Kamilunavo</small></span>
        </Link>
        <nav className="header-actions" aria-label="Ratgeber-Navigation">
          <Link className="text-link" href="/">Startseite</Link>
          <Link className="text-link" href="/preise">Preise</Link>
          <Link className="button button-primary" href="/registrieren">Kostenlos starten</Link>
        </nav>
      </header>

      <section className="guide-index-hero container">
        <span className="eyebrow">Reklaio Ratgeber</span>
        <h1>Reklamationen und Verbraucherfälle nachvollziehbar vorbereiten.</h1>
        <p>
          Verständliche Schritt-für-Schritt-Hilfen, Checklisten und neutrale Formulierungsvorschläge. Die Inhalte helfen bei der Organisation, ersetzen aber keine individuelle Rechtsberatung.
        </p>
      </section>

      <section className="guide-index-grid container" aria-label="Alle Ratgeber">
        {seoGuides.map((guide) => (
          <Link className="guide-card-link" href={`/${guide.slug}`} key={guide.slug}>
            <span>{guide.eyebrow}</span>
            <strong>{guide.title}</strong>
            <p>{guide.metaDescription}</p>
            <small>Ratgeber öffnen →</small>
          </Link>
        ))}
      </section>

      <footer className="container footer guide-footer">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span className="brand-copy"><strong>Reklaio</strong><small>by Kamilunavo</small></span>
        </Link>
        <p>Digitale Organisation von Verbraucherfällen · Keine Rechtsberatung.</p>
      </footer>
    </main>
  );
}
