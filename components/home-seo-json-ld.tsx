const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Reklaio",
    alternateName: "Reklaio by Kamilunavo",
    url: "https://reklaio.de/",
    inLanguage: "de-DE"
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kamilunavo",
    url: "https://reklaio.de/",
    brand: {
      "@type": "Brand",
      name: "Reklaio"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Reklaio",
    url: "https://reklaio.de/",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Webbrowser",
    inLanguage: "de-DE",
    description:
      "Web-App zum Organisieren von Reklamationen, Beschwerden, Rückzahlungen, Kündigungen, Belegen, Fristen und eigenen Schreiben.",
    featureList: [
      "Digitale Fallakte",
      "Dokumentenorganisation",
      "Fristen und Erinnerungen",
      "Chronik und Aufgaben",
      "Vorbereitung eigener Schreiben",
      "Optionale KI-Unterstützung im Pro-Tarif"
    ],
    offers: [
      {
        "@type": "Offer",
        name: "Reklaio Free",
        price: "0",
        priceCurrency: "EUR",
        url: "https://reklaio.de/preise"
      },
      {
        "@type": "Offer",
        name: "Reklaio Pro",
        price: "9.99",
        priceCurrency: "EUR",
        url: "https://reklaio.de/preise"
      }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Kann ich Reklaio kostenlos nutzen?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ja. Fallakten, Belege, Fristen, Aufgaben, Vorlagen, E-Mail-Versand, Fallassistent und PDF-Export gehören zum Free-Tarif. Freiwillige KI-Funktionen sind Reklaio Pro vorbehalten."
        }
      },
      {
        "@type": "Question",
        name: "Erstellt Reklaio ein Reklamationsschreiben?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Reklaio stellt Vorlagen bereit und kann im Pro-Tarif aus bestätigten Falldaten einen individuellen Entwurf vorbereiten. Nutzer prüfen und versenden jedes Schreiben selbst."
        }
      },
      {
        "@type": "Question",
        name: "Ist Reklaio eine Rechtsberatung?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nein. Reklaio organisiert Informationen und unterstützt bei sachlichen Formulierungen, trifft aber keine verbindliche rechtliche Entscheidung."
        }
      },
      {
        "@type": "Question",
        name: "Wo werden meine Dokumente gespeichert?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Fallakten und private Dokumente werden auf der Reklaio-Infrastruktur in Deutschland gespeichert und sind nicht öffentlich erreichbar."
        }
      }
    ]
  }
];

export function HomeSeoJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c")
      }}
    />
  );
}
