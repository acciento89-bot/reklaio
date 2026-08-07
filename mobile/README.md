# Reklaio Mobile

Native iOS- und Android-App auf Basis von Expo und React Native. Die App verwendet dieselben Reklaio-Konten, Fallakten und Dokumente wie die Web-App.

## Aktueller Umfang

- native Anmeldung mit vorhandenem Reklaio-Konto
- verschlüsselte Sitzungsspeicherung über Expo SecureStore
- Fallakten anlegen und vollständig anzeigen
- Status, Fristen und Chronik direkt mobil bearbeiten
- Kamera-, Foto- und PDF-Upload in geschützte Fallakten
- Dokumente geschützt öffnen, teilen und löschen
- lokale Fristerinnerungen am Vortag und am Fälligkeitstag um 09:00 Uhr
- optionale biometrische App-Sperre mit Face ID, Fingerabdruck oder Gerätecode
- EAS-Buildprofile für Entwicklung, interne Vorschau und Produktion

## Expo-Projekt

Die App ist fest mit folgendem EAS-Projekt verbunden:

```text
Owner: Kamilunavo
Slug: reklaio
Project ID: 0ebb2297-f882-4211-8367-638c782aa0de
```

Die Store-Kennungen lauten für iOS und Android:

```text
de.kamilunavo.reklaio
```

## Lokal starten

```bash
cd mobile
cp .env.example .env
npm install
npm run config:check
npm run typecheck
npm run start
```

Die API-Adresse wird über `EXPO_PUBLIC_API_URL` gesetzt. Standard ist `https://reklaio.de`.

Face ID benötigt einen nativen Development- oder Preview-Build. Die Fristerinnerungen werden lokal auf dem Gerät geplant und übertragen keine Fallinhalte an einen externen Push-Dienst.

## Erster installierbarer Testbuild über GitHub

Einmalig im Expo-Konto unter den Access-Token-Einstellungen einen persönlichen Token erzeugen. Den Token niemals in Code, Issues oder Chats einfügen.

Danach im privaten GitHub-Repository unter `Settings → Secrets and variables → Actions` ein Repository Secret anlegen:

```text
Name: EXPO_TOKEN
Value: der erzeugte Expo-Token
```

Anschließend in GitHub:

1. `Actions` öffnen
2. `Reklaio EAS Test Build` auswählen
3. `Run workflow` anklicken
4. zunächst `android` auswählen

Der Workflow prüft Expo-Konfiguration und TypeScript und stößt anschließend den EAS-Preview-Build an. Der Android-Preview-Build wird als direkt installierbare APK erzeugt. Der Installationslink erscheint im EAS-Dashboard und im Build-Log.

Alternativ lokal:

```bash
npm run build:android:test
npm run build:ios:test
```

Der iOS-Testbuild benötigt ein Apple-Developer-Konto und die Einrichtung der Apple-Zugangsdaten beziehungsweise registrierter Testgeräte.

## Noch offen vor Store-Einreichung

1. native Kontolöschung
2. Apple StoreKit und Google Play Billing für Reklaio Pro
3. App-Icon, Splashscreen und Store-Grafiken
4. Store-Metadaten, Datenschutzangaben und Testverteilung
5. vollständiger Geräte- und Barrierefreiheitstest
