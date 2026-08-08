# Reklaio – Apple In-App Subscription Setup

Technische Zielkonfiguration für Version 0.4.0:

- Bundle-ID: `de.kamilunavo.reklaio`
- Subscription Group: `Reklaio Pro`
- Apple Product ID: `de.kamilunavo.reklaio.pro.monthly`
- RevenueCat Entitlement: `pro`
- RevenueCat Offering: `default`
- RevenueCat Package: `$rc_monthly`
- Preis: 9,99 € pro Monat beziehungsweise der entsprechende App-Store-Preispunkt

## 1. App Store Connect – Verträge

Unter **Business** müssen vor dem Testen kostenpflichtiger In-App-Käufe erledigt sein:

- Paid Applications Agreement akzeptiert
- Steuerformulare vollständig
- Bankverbindung hinterlegt und von Apple freigegeben

## 2. Apple-Abonnement anlegen

App Store Connect → Apps → Reklaio → Monetarisierung → Abonnements

1. Neue Abonnementgruppe erstellen:
   - Referenzname: `Reklaio Pro`
   - Deutscher Anzeigename: `Reklaio Pro`
2. Neues automatisch verlängerndes Abonnement erstellen:
   - Referenzname: `Reklaio Pro Monatlich`
   - Product ID: `de.kamilunavo.reklaio.pro.monthly`
   - Dauer: `1 Monat`
   - Preis: `9,99 €` beziehungsweise Apples passender Preispunkt
3. Verfügbarkeit für die gewünschten Länder aktivieren.
4. Deutsche Lokalisierung:
   - Anzeigename: `Reklaio Pro Monatlich`
   - Beschreibung: `Erweiterte KI-Funktionen und Pro-Kontingente für deine Reklaio-Fallakten.`
5. Review-Screenshot und Review-Hinweis ergänzen.
6. Das Abonnement noch nicht separat veröffentlichen: Das erste automatisch verlängernde Abonnement wird zusammen mit der neuen App-Version zur Prüfung eingereicht.

## 3. RevenueCat-Projekt verbinden

1. RevenueCat-Projekt `Reklaio` erstellen oder öffnen.
2. Apple-App hinzufügen:
   - Bundle-ID: `de.kamilunavo.reklaio`
3. App-Store-Connect-Zugang gemäß RevenueCat-Dashboard verbinden.
4. Apple-Produkt importieren:
   - `de.kamilunavo.reklaio.pro.monthly`
5. Entitlement erstellen:
   - Identifier: `pro`
   - Produkt an dieses Entitlement anhängen.
6. Offering erstellen:
   - Identifier: `default`
   - Als Default Offering markieren.
7. Monthly Package hinzufügen:
   - Package: `$rc_monthly`
   - Apple-Produkt anhängen.

## 4. RevenueCat-Schlüssel

RevenueCat → Project Settings → API Keys

- Den öffentlichen Apple SDK Key als EAS-Umgebungsvariable setzen:
  - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...`
- Einen Secret API Key für den Server erstellen:
  - `REVENUECAT_SECRET_API_KEY=sk_...`

Der Secret API Key darf niemals in die App, GitHub oder einen Screenshot gelangen.

## 5. RevenueCat-Webhook

RevenueCat → Integrations → Webhooks → Add new configuration

- URL: `https://reklaio.de/api/billing/revenuecat`
- Umgebung während TestFlight: Sandbox und Production
- Authorization Header: ein langer zufälliger Wert, empfohlen im Format
  `Bearer <mindestens-32-Zeichen-Zufallswert>`
- Derselbe vollständige Headerwert kommt auf dem Reklaio-Server in:
  - `REVENUECAT_WEBHOOK_AUTH`

Alle Subscription-Lifecycle-Events aktivieren, insbesondere:

- Initial Purchase
- Renewal
- Product Change
- Cancellation
- Uncancellation
- Billing Issue
- Expiration
- Transfer

## 6. Server deployen

Vor dem ersten Kauf müssen im Portainer-Stack gesetzt sein:

- `REVENUECAT_SECRET_API_KEY`
- `REVENUECAT_WEBHOOK_AUTH`

Danach den aktuellen `main`-Stand neu deployen. Migration `008_store_subscriptions.sql` wird dabei ausgeführt.

## 7. EAS / TestFlight Build

Der Build muss mit dem öffentlichen Apple SDK Key erstellt werden. Danach:

1. GitHub → Actions → Reklaio iOS TestFlight
2. Workflow auf `main` starten
3. Apple-Verarbeitung abwarten
4. Version 0.4.0 in TestFlight installieren

Ein bereits gebauter Build erhält nachträglich keine neue `EXPO_PUBLIC_...`-Variable. Nach dem Setzen des Keys ist daher ein neuer Build erforderlich.

## 8. Sandbox-Test

Mit einem App-Store-Connect-Sandbox-Tester beziehungsweise über TestFlight prüfen:

1. Free-Konto anmelden.
2. Konto → Reklaio Pro öffnen.
3. Preis wird aus dem App Store geladen.
4. Monatsabo abschließen.
5. Pro-Badge erscheint in der App.
6. Webkonto zeigt ebenfalls Pro.
7. App neu starten und auf einem zweiten Gerät anmelden.
8. `Käufe wiederherstellen` testen.
9. Apple-Abonnementverwaltung öffnen.
10. Kündigung und Ablauf über RevenueCat-Sandbox prüfen.

## 9. App Review

Bei der ersten Einreichung müssen App-Version und erstes Abonnement gemeinsam zur Prüfung:

- Build 0.4.0 auswählen
- Abonnement `de.kamilunavo.reklaio.pro.monthly` zur Submission hinzufügen
- Review-Testkonto mit Free-Zugang bereitstellen
- Review-Hinweis: Konto → Reklaio Pro → Kauf/Wiederherstellung
- Backend, RevenueCat und Webhook müssen während der Prüfung erreichbar bleiben
