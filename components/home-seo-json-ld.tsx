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
    "@type": "MobileApplication",
    name: "Reklaio",
    url: "https://apps.apple.com/de/app/reklaio/id6799375798",
    installUrl: "https://apps.apple.com/de/app/reklaio/id6799375798",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS",
    inLanguage: "de-DE",
    description: "Reklaio für iPhone – Verbraucherfälle, Dokumente, Chronik und Fristen auch unterwegs organisieren."
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
