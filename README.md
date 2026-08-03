# Reklaio

**Reklaio by Kamilunavo** – Dein Fall. Deine Frist. Dein Überblick.

Dieser Stand ist das erste startfähige Produktgerüst:

- responsive Landingpage
- Demo-Dashboard
- geführter Einstieg für vier Fallarten
- installierbare PWA
- Health-Endpoint
- PostgreSQL-Grundschema
- Dockerfile und Portainer-Stack
- Caddy-Beispiel

## Lokaler Start

```bash
cp .env.example .env
npm install
npm run dev
```

Danach: <http://localhost:3000>

## Datenbank

```bash
npm run db:migrate
```

Die erste SQL-Migration liegt unter `db/001_init.sql`.

## Portainer

Benötigte Stack-Variablen:

- `POSTGRES_PASSWORD`
- `SESSION_SECRET`
- `FRONTEND_NETWORK` (z. B. `kamilunavo-infrastructure_frontend`)
- optional `BASE_URL`, `POSTGRES_USER`, `POSTGRES_DB`

Nach dem Deployment die Migration einmal im App-Container oder über einen temporären Node-Container ausführen.

## Caddy

Den Inhalt aus `Caddyfile.example` in die zentrale Caddy-Konfiguration übernehmen und Caddy validieren/reloaden.

## Noch nicht enthalten

- echte Registrierung und Anmeldung
- Upload-API
- KI-Analyse
- E-Mail-Versand
- Fristerinnerungen
- PDF-Export
- Abrechnung

Diese Punkte folgen schrittweise, damit die Sicherheitsbasis sauber bleibt.
