export type SeoGuideSlug =
  | "reklamation-schreiben"
  | "defekte-ware-reklamieren"
  | "rueckzahlung-fordern";

export type SeoGuide = {
  slug: SeoGuideSlug;
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  lead: string;
  overview: string;
  keyPoints: string[];
  steps: Array<{
    title: string;
    text: string;
  }>;
  checklist: string[];
  templateTitle: string;
  templateIntro: string;
  template: string[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
  sources: Array<{
    label: string;
    href: string;
  }>;
  related: SeoGuideSlug[];
};

export const seoGuides: SeoGuide[] = [
  {
    slug: "reklamation-schreiben",
    title: "Reklamation schreiben: Aufbau, Inhalt und Checkliste",
    metaTitle: "Reklamation schreiben: Aufbau, Inhalt und Checkliste",
    metaDescription:
      "So formulierst du eine sachliche Reklamation: Mangel beschreiben, Belege sichern, Reparatur oder Ersatz verlangen und eine nachvollziehbare Frist setzen.",
    eyebrow: "Reklamation vorbereiten",
    lead:
      "Eine gute Reklamation ist kurz, konkret und vollständig. Sie nennt den Kauf, beschreibt den Mangel nachvollziehbar und hält fest, welche Lösung du vom Verkäufer erwartest.",
    overview:
      "Bei einem Mangel richten sich gesetzliche Gewährleistungsansprüche grundsätzlich gegen den Verkäufer. Zunächst geht es regelmäßig um Nacherfüllung: Du kannst je nach Fall Reparatur oder die Lieferung einer mangelfreien Sache verlangen. Eine schriftliche Dokumentation hilft dabei, Verlauf, Fristen und Zusagen später nachvollziehen zu können.",
    keyPoints: [
      "Verkäufer und Kauf eindeutig zuordnen",
      "Mangel sachlich und konkret beschreiben",
      "Reparatur oder Ersatz als gewünschte Lösung nennen",
      "Belege, Versand und Antworten dokumentieren"
    ],
    steps: [
      {
        title: "Kauf und Ansprechpartner festhalten",
        text:
          "Notiere Verkäufer, Kaufdatum, Produkt, Bestell- oder Rechnungsnummer und den verwendeten Kundenaccount. Gewährleistung ist nicht dasselbe wie eine freiwillige Herstellergarantie."
      },
      {
        title: "Mangel genau beschreiben",
        text:
          "Schreibe, was nicht funktioniert, seit wann der Fehler auftritt und unter welchen Umständen er sichtbar wird. Vermeide Vermutungen, Übertreibungen und unnötige Nebenthemen."
      },
      {
        title: "Belege sichern",
        text:
          "Speichere Rechnung, Bestellbestätigung, Fotos, Videos, Fehlermeldungen und den bisherigen Schriftverkehr. Originale sollten möglichst bei dir bleiben."
      },
      {
        title: "Gewünschte Nacherfüllung nennen",
        text:
          "Formuliere klar, ob du eine Reparatur oder Ersatzlieferung möchtest. Der Verkäufer kann die gewählte Variante unter bestimmten Voraussetzungen ablehnen, etwa wenn sie unverhältnismäßige Kosten verursacht."
      },
      {
        title: "Antworttermin und Versandnachweis festhalten",
        text:
          "Bitte um Rückmeldung bis zu einem konkreten Datum. Welche Frist angemessen ist, hängt vom Produkt, Mangel und Einzelfall ab. Nutze einen Kommunikationsweg, dessen Zugang du später belegen kannst."
      }
    ],
    checklist: [
      "Name und Kontaktdaten",
      "Verkäufer oder Händler",
      "Produktbezeichnung",
      "Kaufdatum und Bestellnummer",
      "Konkrete Beschreibung des Mangels",
      "Zeitpunkt, an dem der Mangel aufgefallen ist",
      "Gewünschte Lösung: Reparatur oder Ersatz",
      "Fotos, Rechnung und bisheriger Schriftverkehr"
    ],
    templateTitle: "Neutrale Formulierungshilfe",
    templateIntro:
      "Passe den Text an deinen Fall an und sende keine Angaben, die du nicht belegen kannst.",
    template: [
      "Betreff: Reklamation zu [Produkt], Bestellnummer [Nummer]",
      "Am [Datum] habe ich bei Ihnen [Produkt] gekauft. Seit [Datum] zeigt sich folgender Mangel: [konkrete Beschreibung].",
      "Ich bitte um Nacherfüllung in Form von [Reparatur/Ersatzlieferung] und um Mitteilung des weiteren Ablaufs bis zum [Datum].",
      "Als Nachweis füge ich [Rechnung/Fotos/Video/Fehlermeldung] bei. Bitte bestätigen Sie den Eingang dieser Nachricht."
    ],
    faq: [
      {
        question: "Ist Gewährleistung dasselbe wie Garantie?",
        answer:
          "Nein. Die Gewährleistung ist gesetzlich geregelt und richtet sich beim Kauf grundsätzlich gegen den Verkäufer. Eine Garantie ist eine zusätzliche freiwillige Zusage des Herstellers oder Händlers mit eigenen Bedingungen."
      },
      {
        question: "Kann ich eine Reklamation per E-Mail senden?",
        answer:
          "Eine E-Mail ist häufig praktisch. Entscheidend ist, dass du Inhalt, Versand und Antworten sicherst. Bei wichtigen Fristen kann ein zusätzlich nachweisbarer Versandweg sinnvoll sein."
      },
      {
        question: "Wie lang sollte die Frist sein?",
        answer:
          "Es gibt keine einheitliche Zahl von Tagen für jeden Mangel. Die Frist muss zum Produkt, zur Art des Fehlers und zur notwendigen Bearbeitung passen. Ein konkretes Kalenderdatum ist meist nachvollziehbarer als eine offene Formulierung."
      }
    ],
    sources: [
      {
        label: "§ 437 BGB – Rechte des Käufers bei Mängeln",
        href: "https://www.gesetze-im-internet.de/bgb/__437.html"
      },
      {
        label: "§ 439 BGB – Nacherfüllung",
        href: "https://www.gesetze-im-internet.de/bgb/__439.html"
      },
      {
        label: "Verbraucherzentrale – Rechte bei der Reklamation",
        href: "https://www.verbraucherzentrale.de/digi-tools/deine-rechte-bei-der-reklamation-38189"
      }
    ],
    related: ["defekte-ware-reklamieren", "rueckzahlung-fordern"]
  },
  {
    slug: "defekte-ware-reklamieren",
    title: "Defekte Ware reklamieren: Schritt für Schritt vorgehen",
    metaTitle: "Defekte Ware reklamieren: Schritt für Schritt",
    metaDescription:
      "Defekte Ware erhalten oder später einen Mangel entdeckt? So sicherst du Belege, kontaktierst den Verkäufer und dokumentierst Reparatur oder Ersatzlieferung.",
    eyebrow: "Mangel an gekaufter Ware",
    lead:
      "Ist eine Ware defekt oder entspricht sie nicht der vereinbarten Beschaffenheit, solltest du den Mangel frühzeitig dokumentieren und dich an den Verkäufer wenden.",
    overview:
      "Bei neuen Waren verjähren Mängelansprüche im Regelfall zwei Jahre nach Ablieferung. Bei gebrauchten Waren kann gegenüber Verbrauchern unter gesetzlichen Voraussetzungen ausdrücklich eine kürzere Frist vereinbart werden. Für die Nacherfüllung trägt der Verkäufer grundsätzlich die erforderlichen Transport-, Arbeits- und Materialkosten.",
    keyPoints: [
      "Mangel sofort fotografieren oder filmen",
      "Verkäufer statt nur den Hersteller anschreiben",
      "Reparatur oder Ersatz nachvollziehbar verlangen",
      "Jeden Reparaturversuch und Versand dokumentieren"
    ],
    steps: [
      {
        title: "Prüfen, was vereinbart war",
        text:
          "Vergleiche die Ware mit Produktbeschreibung, Bestellung, zugesicherten Eigenschaften und Lieferumfang. Normale Abnutzung oder selbst verursachte Schäden sind von einem Sachmangel zu unterscheiden."
      },
      {
        title: "Zustand beweissicher dokumentieren",
        text:
          "Fertige Fotos oder Videos an, notiere Seriennummern und bewahre Verpackung, Zubehör sowie Kaufbeleg auf. Beschreibe auch, wann und wie der Fehler erstmals auftrat."
      },
      {
        title: "Verkäufer informieren",
        text:
          "Melde den Mangel schriftlich beim Händler. Eine Weiterleitung an den Hersteller ersetzt nicht automatisch die gesetzlichen Pflichten des Verkäufers."
      },
      {
        title: "Nacherfüllung durchführen lassen",
        text:
          "Stimme Versand, Abholung oder Prüfung ab. Notiere Eingangsbestätigungen, Sendungsnummern, Werkstattberichte und das Ergebnis jedes Versuchs."
      },
      {
        title: "Ergebnis kontrollieren",
        text:
          "Prüfe die reparierte oder ersetzte Ware zeitnah. Besteht der Mangel fort, dokumentiere dies erneut und entscheide anhand des Verlaufs über den nächsten Schritt."
      }
    ],
    checklist: [
      "Rechnung oder Bestellbestätigung",
      "Produkt- und Seriennummer",
      "Fotos oder Videos des Mangels",
      "Produktbeschreibung oder zugesicherte Eigenschaften",
      "Datum der ersten Mängelanzeige",
      "Versand- und Abholnachweise",
      "Reparaturberichte und Austauschbelege",
      "Alle Antworten des Verkäufers"
    ],
    templateTitle: "Mängelanzeige an den Verkäufer",
    templateIntro:
      "Die Formulierung beschreibt zunächst den Mangel und die gewünschte Nacherfüllung.",
    template: [
      "Betreff: Mängelanzeige zu [Produkt], Kauf vom [Datum]",
      "Bei dem Produkt ist am [Datum] folgender Mangel aufgetreten: [Beschreibung]. Die Ware wurde entsprechend der vorgesehenen Nutzung verwendet.",
      "Ich bitte um [Reparatur/Ersatzlieferung] und um Informationen zur kostenfreien Abwicklung, insbesondere zu Versand oder Abholung.",
      "Bitte teilen Sie mir den weiteren Ablauf bis zum [Datum] mit. Kaufbeleg und Nachweise sind beigefügt."
    ],
    faq: [
      {
        question: "Darf der Händler mich einfach an den Hersteller verweisen?",
        answer:
          "Gesetzliche Gewährleistungsrechte bestehen grundsätzlich gegenüber dem Verkäufer. Eine Herstellergarantie kann zusätzlich genutzt werden, ersetzt diese Rechte aber nicht automatisch."
      },
      {
        question: "Wer trägt Versand- und Reparaturkosten?",
        answer:
          "Die für eine berechtigte Nacherfüllung erforderlichen Transport-, Wege-, Arbeits- und Materialkosten trägt grundsätzlich der Verkäufer. Stimme die Abwicklung vorher ab und bewahre Nachweise auf."
      },
      {
        question: "Wie viele Reparaturversuche muss ich akzeptieren?",
        answer:
          "Nach § 440 BGB gilt eine Nachbesserung grundsätzlich nach dem erfolglosen zweiten Versuch als fehlgeschlagen, sofern sich aus Art der Ware, des Mangels oder den Umständen nichts anderes ergibt. Der konkrete Verlauf bleibt deshalb wichtig."
      }
    ],
    sources: [
      {
        label: "§ 438 BGB – Verjährung der Mängelansprüche",
        href: "https://www.gesetze-im-internet.de/bgb/__438.html"
      },
      {
        label: "§ 439 BGB – Kosten und Ablauf der Nacherfüllung",
        href: "https://www.gesetze-im-internet.de/bgb/__439.html"
      },
      {
        label: "§ 440 BGB – Fehlgeschlagene Nacherfüllung",
        href: "https://www.gesetze-im-internet.de/bgb/__440.html"
      },
      {
        label: "Verbraucherzentrale – Gewährleistung und Schadenersatz",
        href: "https://www.verbraucherzentrale.de/wissen/vertraege-reklamation/kundenrechte/alles-zu-gewaehrleistung-und-schadenersatz-5057"
      }
    ],
    related: ["reklamation-schreiben", "rueckzahlung-fordern"]
  },
  {
    slug: "rueckzahlung-fordern",
    title: "Rückzahlung fordern: Voraussetzungen und Dokumentation",
    metaTitle: "Rückzahlung fordern: Voraussetzungen und Schreiben",
    metaDescription:
      "Wann kommt bei mangelhafter Ware eine Rückzahlung in Betracht? Verlauf der Nacherfüllung prüfen, Rücktritt dokumentieren und Rücksendung nachvollziehbar festhalten.",
    eyebrow: "Kaufpreis zurückverlangen",
    lead:
      "Bei mangelhafter Ware besteht nicht in jedem Fall sofort ein Anspruch auf Rückzahlung. Häufig muss der Verkäufer zunächst Gelegenheit zur Reparatur oder Ersatzlieferung erhalten.",
    overview:
      "Ein Rücktritt vom Kaufvertrag kann insbesondere in Betracht kommen, wenn der Verkäufer innerhalb angemessener Zeit nicht nacherfüllt, sich trotz eines Versuchs weiterhin ein Mangel zeigt, die Nacherfüllung verweigert wird oder der Mangel besonders schwerwiegend ist. Bei nur unerheblichen Mängeln kann ein Rücktritt ausgeschlossen sein; eine Minderung kann dennoch zu prüfen sein.",
    keyPoints: [
      "Nicht vorschnell eine sofortige Erstattung behaupten",
      "Mängelanzeige und Nacherfüllung vollständig dokumentieren",
      "Grund für die Rückabwicklung konkret benennen",
      "Rücksendung und Zahlungseingang nachverfolgen"
    ],
    steps: [
      {
        title: "Bisherigen Verlauf zusammentragen",
        text:
          "Ordne Kaufbeleg, erste Mängelanzeige, Antwort des Verkäufers, Fristen, Reparatur- oder Austauschversuche und den aktuellen Zustand der Ware chronologisch."
      },
      {
        title: "Voraussetzungen prüfen",
        text:
          "Prüfe, ob eine angemessene Zeit ohne ordnungsgemäße Nacherfüllung verstrichen ist, der Mangel nach einem Versuch fortbesteht, die Nacherfüllung verweigert wurde oder ein anderer gesetzlich vorgesehener Ausnahmefall vorliegt."
      },
      {
        title: "Rückabwicklung eindeutig erklären",
        text:
          "Formuliere schriftlich, auf welchen Kauf und welchen dokumentierten Mangel du dich beziehst. Nenne den bisherigen Verlauf und erkläre nur dann den Rücktritt, wenn du die Voraussetzungen für deinen Fall geprüft hast."
      },
      {
        title: "Rückgabe abstimmen",
        text:
          "Bitte um Rücksendeetikett, Abholung oder eine andere klare Rückgabeanweisung. Sende wertvolle Ware nicht ohne nachvollziehbare Abstimmung und Versandnachweis zurück."
      },
      {
        title: "Erstattung kontrollieren",
        text:
          "Notiere Rücksendedatum, Zustellung, vereinbarten Erstattungsweg und Zahlungseingang. Reagiere sachlich, wenn nur ein Teilbetrag oder keine Zahlung eingeht."
      }
    ],
    checklist: [
      "Kaufbeleg und gezahlter Betrag",
      "Erste Mängelanzeige",
      "Gewünschte Nacherfüllung",
      "Gesetzte oder abgelaufene Termine",
      "Reparatur- und Austauschverlauf",
      "Begründung für die verlangte Rückabwicklung",
      "Rückgabe- oder Versandnachweis",
      "Kontrolle des Zahlungseingangs"
    ],
    templateTitle: "Formulierung nach gescheiterter Nacherfüllung",
    templateIntro:
      "Verwende diese Formulierung nur, nachdem du den konkreten Verlauf und die Voraussetzungen geprüft hast.",
    template: [
      "Betreff: Rückabwicklung des Kaufs von [Produkt], Bestellnummer [Nummer]",
      "Den Mangel habe ich Ihnen am [Datum] mitgeteilt und um [Reparatur/Ersatzlieferung] gebeten. Die Nacherfüllung ist aus meiner Sicht gescheitert, weil [Verlauf konkret beschreiben].",
      "Auf Grundlage dieses dokumentierten Verlaufs erkläre ich den Rücktritt vom Kaufvertrag und bitte um Erstattung des Kaufpreises von [Betrag] Euro.",
      "Bitte teilen Sie mir bis zum [Datum] mit, wie die Ware zurückgegeben wird und wann die Erstattung erfolgt."
    ],
    faq: [
      {
        question: "Kann ich bei einem Defekt sofort mein Geld zurückverlangen?",
        answer:
          "Regelmäßig steht zunächst die Nacherfüllung durch Reparatur oder Ersatz im Vordergrund. Ein sofortiger Rücktritt kann aber in gesetzlich geregelten Ausnahmefällen möglich sein, etwa bei einem besonders schwerwiegenden Mangel oder klarer Verweigerung der Nacherfüllung."
      },
      {
        question: "Ist Rücktritt dasselbe wie Widerruf?",
        answer:
          "Nein. Der Widerruf betrifft insbesondere bestimmte Fernabsatzverträge und ist grundsätzlich innerhalb einer Frist ohne Mangelbegründung möglich. Der Rücktritt wegen eines Mangels knüpft dagegen an Gewährleistungsrechte und den konkreten Verlauf an."
      },
      {
        question: "Was ist bei einem kleinen Mangel?",
        answer:
          "Bei einem nur unerheblichen Mangel kann der Rücktritt ausgeschlossen sein. Eine angemessene Minderung des Kaufpreises kann je nach Fall trotzdem in Betracht kommen."
      }
    ],
    sources: [
      {
        label: "§ 437 BGB – Rücktritt oder Minderung bei Mängeln",
        href: "https://www.gesetze-im-internet.de/bgb/__437.html"
      },
      {
        label: "§ 475d BGB – Rücktritt beim Verbrauchsgüterkauf",
        href: "https://www.gesetze-im-internet.de/bgb/__475d.html"
      },
      {
        label: "Verbraucherzentrale – Wann ist ein Rücktritt möglich?",
        href: "https://www.verbraucherzentrale.de/digi-tools/deine-rechte-bei-der-reklamation-38189"
      },
      {
        label: "Your Europe – Gewährleistungen für Waren",
        href: "https://europa.eu/youreurope/citizens/consumers/shopping/guarantees/index_de.htm"
      }
    ],
    related: ["reklamation-schreiben", "defekte-ware-reklamieren"]
  }
];

export function getSeoGuide(slug: SeoGuideSlug): SeoGuide {
  const guide = seoGuides.find((entry) => entry.slug === slug);

  if (!guide) {
    throw new Error(`Unknown SEO guide: ${slug}`);
  }

  return guide;
}
