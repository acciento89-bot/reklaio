# Reklaio – Google Play und Android-Abo Setup

Technische Zielkonfiguration:

- Android-Paketname: `de.kamilunavo.reklaio`
- App-Version: `0.4.1`
- Google-Play-Abo-ID: `de.kamilunavo.reklaio.pro.monthly`
- Basis-Abo-ID: `monthly`
- Laufzeit: 1 Monat, automatisch verlängernd
- Zielpreis Deutschland: 9,99 € pro Monat
- RevenueCat Entitlement: `pro`
- RevenueCat Offering: `default`
- RevenueCat Package: `$rc_monthly`
- RevenueCat Google-Produkt: `de.kamilunavo.reklaio.pro.monthly:monthly`

## 1. Google-Play-App anlegen

Play Console → Alle Apps → App erstellen

- App-Name: `Reklaio`
- Standardsprache: Deutsch – Deutschland
- App oder Spiel: App
- Kostenlos oder kostenpflichtig: Kostenlos
- Entwicklerprogrammrichtlinien und US-Exportbestimmungen bestätigen

Der Paketname wird beim ersten hochgeladenen App Bundle auf
`de.kamilunavo.reklaio` festgelegt und kann danach nicht mehr geändert werden.

## 2. Ersten Android App Bundle Build erstellen

GitHub → Actions → `Reklaio Android AAB` → Run workflow → `main`

Der Workflow erstellt mit dem EAS-Profil `production` ein signiertes Android App Bundle (`.aab`).
Die EAS-Buildseite enthält anschließend den Download des Bundles.

Der erste AAB-Upload wird manuell in den internen Test-Track geladen:

Play Console → Reklaio → Testen und veröffentlichen → Interner Test
→ Neuen Release erstellen → App Bundle hochladen

Danach Release prüfen und für die interne Testgruppe ausrollen.

## 3. Interne Tester

Im internen Test eine E-Mail-Liste erstellen und mindestens das eigene Google-Konto hinzufügen.
Interne Tests unterstützen bis zu 100 Tester.

Für kostenlose Testkäufe ohne echte Belastung das verwendete Google-Konto zusätzlich als
Lizenztester einrichten:

Play Console → Einstellungen → Lizenztests

## 4. Google-Play-Abo erstellen

Play Console → Mit Google Play monetarisieren → Produkte → Abos

Abo:

- Produkt-ID: `de.kamilunavo.reklaio.pro.monthly`
- Name: `Reklaio Pro Monatlich`
- Vorteile:
  - `KI-gestützte Dokumentanalyse`
  - `Individuelle Schreiben`
  - `Erweiterte Pro-Kontingente`
  - `Pro-Zugang im Webkonto`

Basis-Abo:

- Basis-Abo-ID: `monthly`
- Typ: Automatisch verlängernd
- Abrechnungszeitraum: Monatlich
- Verfügbarkeit zunächst: Deutschland
- Preis Deutschland: 9,99 €
- Grace Period: Standardwert
- Account Hold: automatisch berechneter Standardwert
- Basis-Abo aktivieren

Ein zusätzliches Probeangebot ist für den ersten Release nicht erforderlich.

## 5. RevenueCat Android-App hinzufügen

RevenueCat → Project `Reklaio` → Apps & providers → Add app → Google Play

- App name: `Reklaio Android`
- Package name: `de.kamilunavo.reklaio`

Danach die Google-Play-Service-Credentials gemäß RevenueCat-Dashboard verbinden.
Diese Credentials werden für Produktimport, Kaufprüfung und Statusabgleich benötigt.
Neue Google-Credentials können zeitverzögert gültig werden.

## 6. Google-Produkt in RevenueCat importieren

RevenueCat → Product catalog → Products → New product → Import Products

Produkt auswählen beziehungsweise manuell anlegen:

- Subscription ID: `de.kamilunavo.reklaio.pro.monthly`
- Base Plan ID: `monthly`
- RevenueCat Store Identifier: `de.kamilunavo.reklaio.pro.monthly:monthly`
- Display name: `Reklaio Pro Monatlich Android`

Danach:

1. Das Produkt an Entitlement `pro` anhängen.
2. Offering `default` öffnen.
3. Package `$rc_monthly` öffnen.
4. Das Android-Produkt zusätzlich zum vorhandenen Apple-Produkt anhängen.
5. `default` bleibt das Default Offering.

Damit enthält dasselbe Package die äquivalenten Monatsprodukte für iOS und Android.

## 7. RevenueCat Android SDK Key

RevenueCat → Project Settings → API Keys

Den öffentlichen Android SDK Key kopieren. Er beginnt üblicherweise mit `goog_`.

Expo → Reklaio → Project settings → Environment variables

- Name: `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- Wert: öffentlicher Android SDK Key
- Environment: Production
- Visibility: Plain text

Der öffentliche SDK Key darf in der App eingebettet werden. Secret API Keys gehören niemals in die App.

## 8. RevenueCat Webhook erweitern

RevenueCat → Integrations → Webhooks → `Reklaio Backend`

Bei Apps zusätzlich `Reklaio Android` aktivieren. URL und Authorization Header bleiben unverändert:

- URL: `https://reklaio.de/api/billing/revenuecat`
- Environment: Sandbox und Production

Der vorhandene Reklaio-Server verarbeitet sowohl App-Store- als auch Google-Play-Abos über dasselbe Entitlement `pro`.

## 9. Automatischen Google-Play-Upload einrichten

Nach dem ersten manuellen AAB-Upload ein Google-Play-Servicekonto für EAS Submit einrichten und in EAS als Android-Submit-Credential hinterlegen.

Danach kann dieser Workflow verwendet werden:

GitHub → Actions → `Reklaio Android Play Internal` → Run workflow → `main`

Der Workflow erstellt ein neues Produktions-AAB und übermittelt es automatisch an den internen Google-Play-Track.

EAS Submit ist in `mobile/eas.json` auf Track `internal` konfiguriert.

## 10. Android-Abo testen

Mit einem internen Tester- und Lizenztesterkonto:

1. Reklaio aus dem internen Google-Play-Test installieren.
2. Mit einem Free-Reklaio-Konto anmelden.
3. Konto → Reklaio Pro öffnen.
4. Prüfen, ob 9,99 € pro Monat aus Google Play geladen werden.
5. Testabo abschließen.
6. Prüfen, ob `Reklaio Pro ist aktiv` erscheint.
7. Prüfen, ob das Webkonto ebenfalls Pro zeigt.
8. `Käufe wiederherstellen` testen.
9. `Google-Play-Abonnements verwalten` öffnen.
10. Kündigung, Grace Period und Ablauf über den Testzyklus prüfen.

## 11. Store-Eintrag

- App-Name: `Reklaio`
- Kurze Beschreibung: `Reklamationen, Belege und Fristen übersichtlich in einer Fallakte verwalten.`
- Kategorie: Produktivität
- Kontakt-E-Mail: `contact@kamilunavo.com`
- Website: `https://reklaio.de`
- Datenschutz: `https://reklaio.de/datenschutz`
- Kontolöschung: `https://reklaio.de/konto-loeschen`

Die vollständige deutsche Beschreibung befindet sich in `docs/STORE_RELEASE_DE.md`.

## 12. App-Inhalte und Datensicherheit

Vor Produktion vollständig ausfüllen:

- Datenschutzrichtlinie
- App-Zugriff mit dauerhaftem Testkonto
- Werbung: Nein
- Inhaltsfreigabe
- Zielgruppe und Inhalte
- Datensicherheit
- Kontolöschung in der App und öffentliche Web-URL
- Finanzfunktionen: Nein
- Gesundheit: Nein
- Nachrichten-App: Nein

Datensicherheit – Arbeitsgrundlage:

- Verschlüsselte Übertragung: Ja, HTTPS
- Kontoerstellung: Ja
- Kontolöschung: Ja, in der App und über die öffentliche Webadresse
- E-Mail-Adresse: App-Funktionalität, mit Nutzer verknüpft
- Name: optional, App-Funktionalität, mit Nutzer verknüpft
- Fotos und Dokumente: freiwillig hochgeladen, App-Funktionalität, mit Nutzer verknüpft
- Sonstige Nutzerinhalte: Fallakten, Fristen, Chronologie und Schreiben
- Nutzer-ID: interne Reklaio-UUID
- Käufe: Produkt-, Abo- und Berechtigungsstatus
- Vollständige Karten- oder Bankdaten: werden nicht von Reklaio gespeichert
- Werbung oder Tracking: Nein

## 13. Produktion

Nach erfolgreichem internen Test:

- Store-Eintrag und App-Inhalte vollständig abschließen
- Produktionszugang beziehungsweise erforderliche Testphase des jeweiligen Entwicklerkontos erfüllen
- Produktionsrelease mit dem geprüften AAB vorbereiten
- Verwaltete Veröffentlichung aktivieren, wenn die Freigabe nicht automatisch live gehen soll
- Release zur Google-Prüfung senden
