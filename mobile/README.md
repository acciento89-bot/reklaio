# Reklaio Mobile

Native iOS- und Android-App auf Basis von Expo und React Native. Die App verwendet dieselben Reklaio-Konten und dieselbe Datenbank wie die Web-App.

## Aktueller Umfang

- native Anmeldung mit vorhandenem Reklaio-Konto
- verschlüsselte Sitzungsspeicherung über Expo SecureStore
- native Übersicht der Fallakten
- native Übersicht aller Fristen
- Kontoansicht und sichere Abmeldung
- EAS-Buildprofile für Entwicklung, interne Vorschau und Produktion

## Lokal starten

```bash
cd mobile
cp .env.example .env
npm install
npm run start
```

Die API-Adresse wird über `EXPO_PUBLIC_API_URL` gesetzt. Standard ist `https://reklaio.de`.

## Kennungen

Die vorläufigen Store-Kennungen lauten für iOS und Android:

```text
de.kamilunavo.reklaio
```

Vor der ersten Store-Registrierung müssen diese Kennungen endgültig bestätigt werden, da sie später nicht beliebig geändert werden können.

## Nächste Bauabschnitte

1. native Falldetails und Fallanlage
2. Dokumentauswahl, Kamera und Upload
3. native Fristenverwaltung und Push-Erinnerungen
4. biometrische App-Sperre
5. native Kontolöschung
6. Apple StoreKit und Google Play Billing für Reklaio Pro
7. Store-Metadaten, Screenshots, Datenschutzangaben und Testverteilung
