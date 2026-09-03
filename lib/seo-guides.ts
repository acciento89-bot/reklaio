export type SeoGuideSlug =
  | "reklamation-schreiben"
  | "defekte-ware-reklamieren"
  | "rueckzahlung-fordern"
  | "paket-nicht-angekommen"
  | "retoure-rueckzahlung-fehlt"
  | "falsche-lieferung-reklamieren"
  | "kuendigung-wird-ignoriert";

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
    related: ["reklamation-schreiben", "retoure-rueckzahlung-fehlt"]
  },
  {
    slug: "paket-nicht-angekommen",
    title: "Paket nicht angekommen: Händler richtig kontaktieren",
    metaTitle: "Paket nicht angekommen? Händler anschreiben",
    metaDescription:
      "Dein Paket ist verspätet oder laut Tracking zugestellt? So sicherst du Nachweise, kontaktierst den Händler und setzt einen nachvollziehbaren Termin.",
    eyebrow: "Lieferung fehlt",
    lead:
      "Wenn eine Online-Bestellung nicht ankommt, solltest du Tracking, Lieferanschrift und alle Zustellinformationen sichern und den Verkäufer schriftlich informieren.",
    overview:
      "Bei einem Verbrauchsgüterkauf trägt der Verkäufer das Versandrisiko grundsätzlich bis zur Übergabe. Eine Ausnahme kann bestehen, wenn du selbst einen nicht vom Händler benannten Transportdienst beauftragt hast. Ist kein Liefertermin vereinbart, muss die Ware grundsätzlich spätestens 30 Tage nach Vertragsschluss übergeben werden.",
    keyPoints: [
      "Trackingverlauf und angekündigten Liefertermin sichern",
      "Ablageort, Nachbarn und Lieferanschrift prüfen",
      "Den Händler schriftlich statt nur den Paketdienst kontaktieren",
      "Antwort, Nachforschung und Erstattung dokumentieren"
    ],
    steps: [
      { title: "Zustellstatus prüfen", text: "Speichere den vollständigen Trackingverlauf und prüfe Ablageort, Hausgemeinschaft, Paketshop und die beim Kauf verwendete Lieferanschrift." },
      { title: "Nachweise sammeln", text: "Halte Bestellnummer, Kaufpreis, zugesagten Liefertermin und alle Benachrichtigungen fest. Fotografiere einen ungeeigneten Ablageort, falls das für den Fall relevant ist." },
      { title: "Verkäufer informieren", text: "Melde die fehlende Lieferung schriftlich beim Händler. Bitte um Prüfung und eine klare Aussage, bis wann geliefert oder eine andere Lösung angeboten wird." },
      { title: "Konkreten Termin nennen", text: "Setze keinen beliebigen Standardzeitraum, sondern ein nachvollziehbares Kalenderdatum, das zur bisherigen Verzögerung und zur Ware passt." },
      { title: "Ergebnis nachhalten", text: "Dokumentiere Nachforschungsnummer, Antworten, Ersatzlieferung oder Rückzahlung. Bestätige telefonische Zusagen anschließend kurz schriftlich." }
    ],
    checklist: ["Bestellbestätigung", "Bestell- und Sendungsnummer", "Lieferanschrift", "Angekündigter Liefertermin", "Vollständiger Trackingverlauf", "Zustellbenachrichtigungen", "Kontakt mit Händler und Paketdienst", "Zahlungsnachweis"],
    templateTitle: "Nachricht bei fehlender Lieferung",
    templateIntro: "Passe den Text an den tatsächlichen Tracking- und Kommunikationsverlauf an.",
    template: [
      "Betreff: Bestellung [Bestellnummer] bislang nicht erhalten",
      "Die für den [Datum] angekündigte Bestellung ist bei mir bislang nicht eingegangen. Im Tracking wird seit [Datum] der Status [Status] angezeigt.",
      "Bitte prüfen Sie den Versand und teilen Sie mir bis zum [Datum] mit, wann die Lieferung erfolgt beziehungsweise wie Sie den Fall lösen.",
      "Bestellbestätigung und Trackingverlauf habe ich als Nachweis beigefügt. Bitte bestätigen Sie den Eingang dieser Nachricht."
    ],
    faq: [
      { question: "Muss ich mich an den Paketdienst wenden?", answer: "Dein Vertrag besteht normalerweise mit dem Händler. Du kannst den Paketdienst zusätzlich kontaktieren, solltest den Verkäufer aber ebenfalls schriftlich informieren und den Verlauf sichern." },
      { question: "Was gilt, wenn das Tracking zugestellt anzeigt?", answer: "Bitte den Händler um Zustellnachweis und prüfe Ablageort sowie mögliche Empfangspersonen. Ein Trackingstatus allein klärt nicht in jedem Fall, ob die Ware wirksam übergeben wurde." },
      { question: "Kann ich sofort eine Ersatzlieferung verlangen?", answer: "Welche Lösung besteht, hängt vom Vertrag und vom konkreten Versandverlauf ab. Dokumentiere den Sachverhalt und fordere den Händler zunächst zu einer klaren Klärung innerhalb eines nachvollziehbaren Zeitraums auf." }
    ],
    sources: [
      { label: "§ 475 BGB – Lieferung und Versandrisiko", href: "https://www.gesetze-im-internet.de/bgb/__475.html" },
      { label: "Verbraucherzentrale – Online-Bestellung kommt nicht an", href: "https://www.verbraucherzentrale.de/wissen/digitale-welt/onlinehandel/was-tun-wenn-meine-onlinebestellung-nach-dem-versand-nicht-ankommt-28083" }
    ],
    related: ["retoure-rueckzahlung-fehlt", "reklamation-schreiben"]
  },
  {
    slug: "retoure-rueckzahlung-fehlt",
    title: "Retoure zurückgeschickt, aber Rückzahlung fehlt",
    metaTitle: "Retoure: Rückzahlung fehlt – was jetzt?",
    metaDescription:
      "Die Retoure wurde zugestellt, aber dein Geld fehlt? So dokumentierst du Widerruf, Rücksendung und Zahlung und formulierst eine sachliche Nachfrage.",
    eyebrow: "Erstattung nach Retoure",
    lead:
      "Fehlt die Rückzahlung nach einer Retoure, sind Widerruf, Einlieferungsbeleg, Zustellung und die ursprüngliche Zahlung die wichtigsten Nachweise.",
    overview:
      "Nach einem wirksamen Widerruf sind empfangene Leistungen grundsätzlich spätestens nach 14 Tagen zurückzugewähren. Bei Waren darf der Händler die Rückzahlung jedoch zurückhalten, bis die Ware eingegangen ist oder du die Absendung nachgewiesen hast. Für die Rückzahlung ist grundsätzlich dasselbe Zahlungsmittel zu verwenden.",
    keyPoints: ["Widerruf und Datum eindeutig belegen", "Einlieferungs- und Zustellnachweis sichern", "Zahlungsweg und Betrag kontrollieren", "Händler mit vollständigen Daten anschreiben"],
    steps: [
      { title: "Widerruf zuordnen", text: "Notiere, wann und auf welchem Weg du den Widerruf erklärt hast. Sichere Bestätigung, Bestellnummer und die verwendete E-Mail-Adresse." },
      { title: "Rücksendung belegen", text: "Bewahre Einlieferungsbeleg, Sendungsnummer, Paketgewicht und Zustellstatus auf. Dokumentiere bei wertvoller Ware möglichst auch Inhalt und Verpackung." },
      { title: "Zahlung prüfen", text: "Kontrolliere das ursprünglich verwendete Zahlungsmittel. Erfasse Kaufpreis, Versandkosten, Teilrückzahlungen, Gutscheine und das erwartete Erstattungsdatum getrennt." },
      { title: "Sachlich nachfragen", text: "Sende dem Händler alle Zuordnungsdaten in einer Nachricht und bitte um Prüfung sowie Rückzahlung bis zu einem konkreten Datum." },
      { title: "Antworten dokumentieren", text: "Speichere Eingangsbestätigungen und Begründungen. Halte fest, ob der Händler den Wareneingang, eine unvollständige Retoure oder eine bereits veranlasste Zahlung behauptet." }
    ],
    checklist: ["Bestellnummer", "Widerrufserklärung", "Retourenlabel", "Einlieferungsbeleg", "Sendungsnummer und Zustellung", "Kaufpreis und Zahlungsart", "Erwarteter Erstattungsbetrag", "Bisheriger Schriftverkehr"],
    templateTitle: "Nachfrage zur ausstehenden Erstattung",
    templateIntro: "Füge Kopien der Nachweise bei und bewahre die Originale auf.",
    template: [
      "Betreff: Ausstehende Rückzahlung zu Bestellung [Bestellnummer]",
      "Den Vertrag habe ich am [Datum] widerrufen und die Ware am [Datum] unter der Sendungsnummer [Nummer] zurückgesandt. Laut Versandnachweis wurde die Retoure am [Datum] zugestellt.",
      "Eine Rückzahlung in Höhe von [Betrag] Euro ist auf dem ursprünglich verwendeten Zahlungsmittel bislang nicht eingegangen.",
      "Bitte prüfen Sie den Vorgang und veranlassen Sie die Rückzahlung bis zum [Datum]. Die Versandnachweise sind beigefügt."
    ],
    faq: [
      { question: "Ab wann laufen die 14 Tage?", answer: "Die Frist knüpft grundsätzlich an den Widerruf an. Bei Waren darf der Händler die Erstattung aber zurückhalten, bis er die Ware erhalten hat oder du ihre Absendung nachweist." },
      { question: "Darf der Händler nur einen Gutschein erstatten?", answer: "Grundsätzlich ist dasselbe Zahlungsmittel zu verwenden. Etwas anderes kann ausdrücklich vereinbart werden, sofern dir dadurch keine Kosten entstehen." },
      { question: "Was tun, wenn die Retoure angeblich unvollständig war?", answer: "Bitte um eine konkrete Aufstellung und sichere deine Nachweise zu Inhalt, Gewicht, Verpackung und Versand. Antworte nur mit Tatsachen, die du belegen kannst." }
    ],
    sources: [
      { label: "§ 357 BGB – Rückzahlung nach Widerruf", href: "https://www.gesetze-im-internet.de/bgb/__357.html" },
      { label: "Verbraucherzentrale – Retoure richtig zurückschicken", href: "https://www.verbraucherzentrale.de/wissen/digitale-welt/onlinehandel/retoure-angeblich-unvollstaendig-so-schicken-sie-ware-richtig-zurueck-60722" }
    ],
    related: ["paket-nicht-angekommen", "rueckzahlung-fordern"]
  },
  {
    slug: "falsche-lieferung-reklamieren",
    title: "Falsche Lieferung reklamieren und Nachweise sichern",
    metaTitle: "Falsche Lieferung reklamieren: Muster und Ablauf",
    metaDescription:
      "Falsches Produkt oder unvollständige Bestellung erhalten? So dokumentierst du die Abweichung und forderst beim Verkäufer eine passende Lösung an.",
    eyebrow: "Ware falsch oder unvollständig",
    lead:
      "Weicht die Lieferung von deiner Bestellung ab, solltest du Verpackung, Etikett, Inhalt und Bestellbestätigung gemeinsam dokumentieren.",
    overview:
      "Eine andere als die vereinbarte Ware oder ein fehlender Bestandteil kann einen Sachmangel darstellen. Gewährleistungsansprüche richten sich grundsätzlich gegen den Verkäufer. Im Rahmen der Nacherfüllung kommen je nach Fall die Lieferung der bestellten Ware oder die Vervollständigung der Lieferung in Betracht.",
    keyPoints: ["Paketetikett und gesamten Inhalt fotografieren", "Bestellung und gelieferte Variante vergleichen", "Verkäufer schriftlich informieren", "Rücksendung erst nach abgestimmter Abwicklung"],
    steps: [
      { title: "Lieferung vollständig aufnehmen", text: "Fotografiere Versandkarton, Etikett, Artikel, Seriennummern und sämtliches Zubehör. Entsorge Verpackung und Lieferschein vor der Klärung nicht." },
      { title: "Abweichung genau benennen", text: "Vergleiche Produktname, Modell, Farbe, Größe, Menge und Lieferumfang mit der Bestellbestätigung. Liste die Unterschiede sachlich auf." },
      { title: "Verkäufer anschreiben", text: "Teile Bestellnummer, Lieferdatum und Abweichung mit. Formuliere eindeutig, welche vertragsgemäße Lösung du erwartest." },
      { title: "Rückgabe abstimmen", text: "Bitte um ein Rücksendeetikett oder eine Abholung. Versende die falsch gelieferte Ware nicht unfrei und nicht ohne nachvollziehbaren Nachweis." },
      { title: "Austausch kontrollieren", text: "Prüfe die Ersatzlieferung sofort und dokumentiere Erstattung, Nachlieferung sowie die Rücksendung des falschen Artikels in einem Verlauf." }
    ],
    checklist: ["Bestellbestätigung", "Lieferschein", "Versandetikett", "Fotos von Karton und Inhalt", "Artikel- und Seriennummer", "Bestellte und gelieferte Variante", "Lieferdatum", "Kommunikation mit dem Verkäufer"],
    templateTitle: "Reklamation einer Falschlieferung",
    templateIntro: "Beschreibe nur die konkrete Abweichung und füge aussagekräftige Fotos bei.",
    template: [
      "Betreff: Falsche Lieferung zu Bestellung [Bestellnummer]",
      "Am [Datum] erhielt ich statt des bestellten Artikels [Bestellung] den Artikel [gelieferte Ware]. Die Abweichung ist auf den beigefügten Fotos und der Bestellbestätigung erkennbar.",
      "Ich bitte um Lieferung der bestellten Ware und um Mitteilung, wie die Falschlieferung kostenfrei zurückgegeben werden soll.",
      "Bitte bestätigen Sie den weiteren Ablauf bis zum [Datum]."
    ],
    faq: [
      { question: "Muss ich die falsche Ware bezahlen?", answer: "Wenn du etwas anderes bestellt hast, sollte der Vorgang zuerst eindeutig dem Vertrag zugeordnet werden. Nutze oder entsorge die Ware nicht und kläre die Rückgabe schriftlich mit dem Verkäufer." },
      { question: "Wer trägt die Rücksendekosten?", answer: "Die für eine berechtigte Nacherfüllung erforderlichen Transportkosten trägt grundsätzlich der Verkäufer. Stimme den Versandweg vorher ab." },
      { question: "Was gilt bei fehlendem Zubehör?", answer: "Vergleiche den vereinbarten Lieferumfang mit der tatsächlichen Lieferung und liste jedes fehlende Teil auf. Bitte um Vervollständigung oder eine andere passende Nacherfüllung." }
    ],
    sources: [
      { label: "§ 434 BGB – Sachmangel", href: "https://www.gesetze-im-internet.de/bgb/__434.html" },
      { label: "§ 439 BGB – Nacherfüllung und Kosten", href: "https://www.gesetze-im-internet.de/bgb/__439.html" }
    ],
    related: ["defekte-ware-reklamieren", "reklamation-schreiben"]
  },
  {
    slug: "kuendigung-wird-ignoriert",
    title: "Kündigung wird ignoriert: Zugang und Verlauf belegen",
    metaTitle: "Kündigung wird ignoriert? So dokumentierst du sie",
    metaDescription:
      "Keine Kündigungsbestätigung oder weitere Abbuchungen? So sicherst du Zugangsnachweis, Vertragsdaten und Antworten und forderst Klärung.",
    eyebrow: "Vertragsende ungeklärt",
    lead:
      "Bleibt eine Kündigungsbestätigung aus, kommt es vor allem darauf an, den Inhalt der Erklärung, den Zugang beim Anbieter und das richtige Vertragsende nachvollziehbar zu belegen.",
    overview:
      "Eine empfangsbedürftige Willenserklärung wird grundsätzlich mit ihrem Zugang wirksam. Eine Bestätigung ist daher nicht immer Voraussetzung für die Wirksamkeit, kann aber als Nachweis hilfreich sein. Ob Form, Frist und Vertragsende stimmen, hängt vom konkreten Vertrag und den gesetzlichen Vorgaben ab.",
    keyPoints: ["Vertrag und Kündigungsfrist prüfen", "Wortlaut der Kündigung sichern", "Zugang beim richtigen Empfänger belegen", "Weitere Rechnungen und Abbuchungen getrennt dokumentieren"],
    steps: [
      { title: "Vertragsdaten prüfen", text: "Notiere Vertragspartner, Kunden- oder Vertragsnummer, Laufzeit, Kündigungsfrist und den gewünschten Beendigungszeitpunkt." },
      { title: "Erklärung und Zugang sichern", text: "Bewahre die vollständige Kündigung sowie E-Mail-Header, Einschreibebeleg, Faxbericht, Portalbestätigung oder andere Zugangsnachweise auf." },
      { title: "Bestätigung anfordern", text: "Bitte den Anbieter schriftlich um Bestätigung von Eingang und Vertragsende. Sende die Kündigung erneut als Kopie, ohne den ursprünglichen Zugang aufzugeben." },
      { title: "Abweichungen widersprechen", text: "Wenn ein anderes Vertragsende genannt oder weiter abgebucht wird, widersprich konkret und verweise auf Kündigung, Zugang und deine Vertragsunterlagen." },
      { title: "Fallchronik führen", text: "Halte jede Rechnung, Abbuchung, Rücklastschrift, Antwort und telefonische Zusage mit Datum fest. So bleibt der weitere Verlauf prüfbar." }
    ],
    checklist: ["Vertrag und AGB", "Kunden- oder Vertragsnummer", "Kündigungsschreiben", "Versand- oder Zugangsnachweis", "Gewünschtes Vertragsende", "Antworten des Anbieters", "Rechnungen nach der Kündigung", "Kontoauszüge zu weiteren Abbuchungen"],
    templateTitle: "Nachfrage zum Vertragsende",
    templateIntro: "Prüfe vor dem Versand Vertragspartner, Kündigungsfrist und das von dir genannte Datum.",
    template: [
      "Betreff: Bestätigung meiner Kündigung – Vertragsnummer [Nummer]",
      "Meine Kündigung vom [Datum] ist Ihnen am [Datum] über [Versandweg] zugegangen. Den Nachweis füge ich erneut bei.",
      "Bitte bestätigen Sie mir den Eingang sowie die Beendigung des Vertrags zum [Datum], hilfsweise zum nächstmöglichen Zeitpunkt.",
      "Sollten Sie von einem anderen Vertragsende ausgehen, bitte ich bis zum [Datum] um eine nachvollziehbare Begründung unter Angabe der zugrunde gelegten Vertragsregelung."
    ],
    faq: [
      { question: "Ist eine Kündigung ohne Bestätigung unwirksam?", answer: "Nicht zwingend. Entscheidend ist regelmäßig, ob die Erklärung form- und fristgerecht beim richtigen Empfänger zugegangen ist. Die Bestätigung erleichtert allerdings den Nachweis." },
      { question: "Wie beweise ich den Zugang?", answer: "Geeignet können je nach Versandweg etwa Portalbestätigungen, E-Mail-Header, Faxberichte oder Zustellnachweise sein. Ein Beleg über den Versand beweist nicht in jedem Fall auch den Inhalt." },
      { question: "Was mache ich bei weiteren Abbuchungen?", answer: "Dokumentiere Betrag, Datum und Verwendungszweck, widersprich dem Anbieter schriftlich und prüfe die konkrete Forderung. Bankmaßnahmen und Rückbuchungsfristen solltest du gesondert mit deiner Bank klären." }
    ],
    sources: [
      { label: "§ 130 BGB – Wirksamwerden einer Willenserklärung", href: "https://www.gesetze-im-internet.de/bgb/__130.html" },
      { label: "§ 312k BGB – Kündigung von Verbraucherverträgen im elektronischen Geschäftsverkehr", href: "https://www.gesetze-im-internet.de/bgb/__312k.html" }
    ],
    related: ["reklamation-schreiben", "retoure-rueckzahlung-fehlt"]
  }
];

export function getSeoGuide(slug: SeoGuideSlug): SeoGuide {
  const guide = seoGuides.find((entry) => entry.slug === slug);

  if (!guide) {
    throw new Error(`Unknown SEO guide: ${slug}`);
  }

  return guide;
}
