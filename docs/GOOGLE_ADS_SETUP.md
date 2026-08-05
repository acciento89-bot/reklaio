# Reklaio – Google Ads und Conversion-Tracking

Reklaio lädt das Google-Tag ausschließlich nach einer ausdrücklichen Zustimmung im Datenschutz-Banner. Ohne Zustimmung werden keine Google-Tags geladen und keine Daten an Google übertragen.

## 1. Conversion-Aktionen in Google Ads anlegen

Im Google-Ads-Konto unter `Ziele > Conversions > Zusammenfassung` zwei Website-Conversions erstellen:

1. `Reklaio – Registrierung`
   - Kategorie: Registrierung
   - Wert: keinen festen Umsatzwert verwenden
   - Zählmethode: eine Conversion

2. `Reklaio – Pro-Abo`
   - Kategorie: Kauf oder Abo
   - Wert: 9,99 EUR beziehungsweise der aktuelle Monatspreis
   - Zählmethode: eine Conversion

Bei der manuellen Einrichtung zeigt Google jeweils eine Kennung im Format:

```text
AW-123456789/AbCdEfGhIjKlMnOp
```

Der Teil vor dem Schrägstrich ist die Google-Tag-ID. Der vollständige Wert inklusive Conversion-Label wird für die jeweilige Conversion benötigt.

## 2. Variablen in Portainer setzen

```text
GOOGLE_TAG_ID=AW-123456789
GOOGLE_ADS_SIGNUP_CONVERSION=AW-123456789/REGISTRATION_LABEL
GOOGLE_ADS_PRO_CONVERSION=AW-123456789/PRO_LABEL
GOOGLE_ADS_PRO_VALUE=9.99
GOOGLE_ADS_CURRENCY=EUR
```

Danach den Reklaio-Stack neu deployen.

## 3. Technische Prüfung

1. Reklaio in einem privaten Browserfenster öffnen.
2. Vor einer Zustimmung im Netzwerk-Tab prüfen, dass keine Anfrage an `googletagmanager.com` oder `googleadservices.com` erfolgt.
3. `Alle akzeptieren` wählen.
4. Mit Google Tag Assistant prüfen, ob das Google-Tag geladen wird.
5. Ein neues Testkonto registrieren und kontrollieren, ob die Registrierungs-Conversion ausgelöst wird.
6. Einen Stripe-Testcheckout abschließen und kontrollieren, ob die Pro-Conversion mit der Checkout-Session als Transaktionskennung ausgelöst wird.
7. Unter `Cookie-Einstellungen` auf `Nur notwendige` wechseln und kontrollieren, dass der Einwilligungsstatus widerrufen wird.

Google Ads kann nach einer neuen oder korrigierten Tag-Installation etwas Zeit benötigen, bis der Status als aktiv angezeigt wird.

## 4. Empfohlene erste Suchkampagne

- Kampagnentyp: Suche
- Standort: Deutschland
- Sprache: Deutsch
- Startbudget: 10 bis 15 EUR pro Tag
- Gebotsstrategie zum Start: Klicks maximieren mit vorsichtiger CPC-Grenze; nach belastbaren Conversion-Daten auf Conversions maximieren wechseln
- Primäre Conversion: Pro-Abo
- Sekundäre Conversion: Registrierung
- Keine Display-Erweiterung und kein Suchnetzwerk-Partnernetz zum Start

Die erste Anzeigengruppe sollte nur Suchbegriffe mit konkretem Verbraucherproblem enthalten, beispielsweise Reklamation organisieren, Frist Reklamation, Beschwerde schreiben, Rückzahlung fordern oder Kündigung dokumentieren. Allgemeine Begriffe wie KI, Anwalt oder Verbraucherrecht sollten zunächst ausgeschlossen werden, da Reklaio keine Rechtsberatung und keine Kanzlei ist.
