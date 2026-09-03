import Link from "next/link";
import type { SeoGuide } from "@/lib/seo-guides";
import { getSeoGuide } from "@/lib/seo-guides";

type SeoGuidePageProps = {
  guide: SeoGuide;
};

function GuideJsonLd({ guide }: SeoGuidePageProps) {
  const canonicalUrl = `https://reklaio.de/${guide.slug}`;
  const isNewGuide = [
    "paket-nicht-angekommen",
    "retoure-rueckzahlung-fehlt",
    "falsche-lieferung-reklamieren",
    "kuendigung-wird-ignoriert"
  ].includes(guide.slug);
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.metaDescription,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      inLanguage: "de-DE",
      datePublished: isNewGuide ? "2026-09-03" : "2026-08-07",
      dateModified: "2026-09-03",
      author: {
        "@type": "Organization",
        name: "Kamilunavo",
        url: "https://reklaio.de/"
      },
      publisher: {
        "@type": "Organization",
        name: "Kamilunavo",
        brand: {
          "@type": "Brand",
          name: "Reklaio"
        }
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Startseite",
          item: "https://reklaio.de/"
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Ratgeber",
          item: "https://reklaio.de/ratgeber"
        },
        {
          "@type": "ListItem",
          position: 3,
          name: guide.title,
          item: canonicalUrl
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: entry.answer
        }
      }))
    }
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c")
      }}
    />
  );
}

export function SeoGuidePage({ guide }: SeoGuidePageProps) {
  return (
    <main className="guide-page">
      <GuideJsonLd guide={guide} />

      <header className="guide-topbar container">
        <Link className="brand" href="/" aria-label="Reklaio Startseite">
          <span className="brand-mark">R</span>
          <span className="brand-copy"><strong>Reklaio</strong><small>by Kamilunavo</small></span>
        </Link>
        <nav className="header-actions" aria-label="Ratgeber-Navigation">
          <Link className="text-link" href="/ratgeber">Ratgeber</Link>
          <Link className="text-link" href="/preise">Preise</Link>
          <Link className="button button-primary" href="/registrieren">Kostenlos starten</Link>
        </nav>
      </header>

      <article className="guide-article container">
        <nav className="guide-breadcrumb" aria-label="Brotkrümelnavigation">
          <Link href="/">Startseite</Link>
          <span aria-hidden="true">›</span>
          <Link href="/ratgeber">Ratgeber</Link>
          <span aria-hidden="true">›</span>
          <span>{guide.title}</span>
        </nav>

        <section className="guide-hero">
          <div>
            <span className="eyebrow">{guide.eyebrow}</span>
            <h1>{guide.title}</h1>
            <p>{guide.lead}</p>
            <div className="guide-hero-actions">
              <Link className="button button-primary" href="/registrieren">Fall kostenlos dokumentieren</Link>
              <Link className="button button-secondary" href="/ratgeber">Alle Ratgeber</Link>
            </div>
          </div>
          <aside className="guide-summary-card" aria-label="Das Wichtigste in Kürze">
            <span>Das Wichtigste in Kürze</span>
            <ul>
              {guide.keyPoints.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </aside>
        </section>

        <div className="guide-layout">
          <div className="guide-main">
            <section className="guide-section">
              <span className="guide-kicker">Kurz erklärt</span>
              <h2>Worum es bei diesem Schritt geht</h2>
              <p>{guide.overview}</p>
            </section>

            <section className="guide-section">
              <span className="guide-kicker">Vorgehen</span>
              <h2>Schritt für Schritt</h2>
              <ol className="guide-steps">
                {guide.steps.map((step, index) => (
                  <li key={step.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="guide-section guide-checklist-section">
              <span className="guide-kicker">Unterlagen</span>
              <h2>Diese Angaben solltest du bereithalten</h2>
              <div className="guide-checklist">
                {guide.checklist.map((item) => <div key={item}>{item}</div>)}
              </div>
            </section>

            <section className="guide-section">
              <span className="guide-kicker">Textvorlage</span>
              <h2>{guide.templateTitle}</h2>
              <p>{guide.templateIntro}</p>
              <div className="guide-template" aria-label="Formulierungshilfe">
                {guide.template.map((line) => <p key={line}>{line}</p>)}
              </div>
            </section>

            <section className="guide-section">
              <span className="guide-kicker">Häufige Fragen</span>
              <h2>Antworten zum Thema</h2>
              <div className="guide-faq">
                {guide.faq.map((entry) => (
                  <details key={entry.question}>
                    <summary>{entry.question}</summary>
                    <p>{entry.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="guide-section guide-sources">
              <span className="guide-kicker">Quellen</span>
              <h2>Gesetze und weiterführende Informationen</h2>
              <ul>
                {guide.sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} target="_blank" rel="noreferrer">{source.label} <span aria-hidden="true">↗</span></a>
                  </li>
                ))}
              </ul>
              <p className="guide-source-note">
                Stand: <time dateTime="2026-09-03">3. September 2026</time>. Die Inhalte dienen der allgemeinen Information und ersetzen keine individuelle Rechtsberatung.
              </p>
            </section>
          </div>

          <aside className="guide-sidebar">
            <div className="guide-sidebar-card">
              <span className="eyebrow">Mit Reklaio</span>
              <h2>Aus einzelnen Nachweisen wird eine klare Fallakte.</h2>
              <p>Speichere Belege, Nachrichten, Fristen und den bisherigen Verlauf an einem Ort. Reklaio organisiert deine Angaben, trifft aber keine rechtliche Entscheidung für dich.</p>
              <Link className="button button-primary" href="/registrieren">Kostenlos beginnen</Link>
            </div>
            <div className="guide-legal-note">
              <strong>Wichtig</strong>
              <p>Ob ein Anspruch tatsächlich besteht, hängt immer vom konkreten Vertrag, Mangel und bisherigen Verlauf ab.</p>
            </div>
          </aside>
        </div>

        <section className="guide-related">
          <div>
            <span className="guide-kicker">Weiterlesen</span>
            <h2>Passende Ratgeber</h2>
          </div>
          <div className="guide-related-grid">
            {guide.related.map((slug) => {
              const relatedGuide = getSeoGuide(slug);
              return (
                <Link href={`/${relatedGuide.slug}`} key={slug}>
                  <span>{relatedGuide.eyebrow}</span>
                  <strong>{relatedGuide.title}</strong>
                  <small>Ratgeber öffnen →</small>
                </Link>
              );
            })}
          </div>
        </section>
      </article>

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
