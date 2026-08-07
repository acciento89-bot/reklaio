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

Face ID und Remote-Push-Nachrichten benötigen einen nativen Development- oder Preview-Build. Die in Reklaio verwendeten Fristerinnerungen werden lokal auf dem Gerät geplant und übertragen keine Fallinhalte an einen externen Push-Dienst.

## Kennungen

Die vorläufigen Store-Kennungen lauten für iOS und Android:

```text
de.kamilunavo.reklaio
```

Vor der ersten Store-Registrierung müssen diese Kennungen endgültig bestätigt werden, da sie später nicht beliebig geändert werden können.

## Erster installierbarer Testbuild

Zuerst einmalig bei Expo anmelden und das Projekt verknüpfen:

```bash
cd mobile
npx eas-cli login
npx eas-cli init
```

Danach kann ein direkt installierbares Android-APK erzeugt werden:

```bash
npm run build:android:test
```

Für einen internen iPhone-Testbuild:

```bash
npm run build:ios:test
```

Der Android-Preview-Build wird als APK erzeugt. Der iOS-Testbuild benötigt ein Apple-Developer-Konto und registrierte Testgeräte beziehungsweise TestFlight-Konfiguration.

## Noch offen vor Store-Einreichung

1. native Kontolöschung
2. Apple StoreKit und Google Play Billing für Reklaio Pro
3. App-Icon, Splashscreen und Store-Grafiken
4. Store-Metadaten, Datenschutzangaben und Testverteilung
5. vollständiger Geräte- und Barrierefreiheitstest
