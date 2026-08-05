# Reklaio – Launch-Setup

## 1. Admin-Center

In Portainer muss mindestens eine vorhandene Reklaio-Konto-E-Mail als Bootstrap-Admin eingetragen werden:

```text
ADMIN_EMAILS=DEINE_REKLAIO_LOGIN_EMAIL
```

Mehrere Adressen werden durch Kommas getrennt. Nach dem Update erscheint für diese Konten `/admin` in der Navigation. Im Admin-Center können Nutzer, Pro-Zugänge, Sperren, KI-Limits, Supportanfragen, Widerrufe, Stripe-Webhooks, Backups und Systemstatus verwaltet werden.

## 2. OpenAI und KI-Kontingente

Reklaio sendet die Prompts direkt aus `lib/ai.ts` mit jeder Responses-API-Anfrage. Im OpenAI-Dashboard muss kein zusätzlicher Prompt angelegt oder veröffentlicht werden.

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
PRO_AI_DOCUMENTS_MONTHLY=20
PRO_AI_LETTERS_MONTHLY=40
```

`-1` bedeutet unbegrenzt. Individuelle Nutzerlimits können im Admin-Center gesetzt werden. Fehlgeschlagene technische Vorgänge werden nicht als erfolgreich verbrauchte Nutzung gezählt. Der API-Schlüssel gehört ausschließlich in Portainer.

## 3. Stripe – zuerst Testmodus

1. In Stripe im Testmodus das Produkt `Reklaio Pro` anlegen.
2. Einen wiederkehrenden monatlichen Preis in EUR anlegen.
3. Die Test-Preis-ID `price_...` kopieren.
4. Das Kundenportal aktivieren: Zahlungsmethoden, Rechnungen und Kündigung freigeben.
5. Webhook-Endpoint anlegen:

```text
https://reklaio.de/api/billing/webhook
```

6. Ereignisse abonnieren:

```text
checkout.session.completed
checkout.session.expired
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
```

7. Das Webhook-Signing-Secret `whsec_...` kopieren.
8. In Portainer setzen:

```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
REKLAIO_PRO_PRICE_LABEL=9,99 € pro Monat
REKLAIO_PRO_INTERVAL_LABEL=monatlich, automatisch verlängernd
REKLAIO_TAX_LABEL=Gesamtpreis inklusive aller anwendbaren Steuern
```

Test- und Live-Schlüssel dürfen nicht gemischt werden. Das Admin-Center prüft, ob Schlüssel und Preis im gleichen Modus liegen, der Preis aktiv ist und wiederkehrend abgerechnet wird.

## 4. Testablauf Stripe

Mit einem neuen Free-Testkonto:

1. `/preise` öffnen.
2. `Pro verbindlich bestellen` wählen.
3. Bestellübersicht, AGB, Datenschutz, Widerruf und sofortigen Leistungsbeginn bestätigen.
4. Über Stripe-Testcheckout abschließen.
5. Prüfen, ob im Admin-Center `active` und `Pro` erscheinen.
6. Prüfen, ob die Vertragsbestätigung per E-Mail ankommt.
7. Im Kundenportal die Kündigung zum Periodenende testen.
8. Den Webhook `customer.subscription.updated` prüfen.
9. Mit Stripe-Testwerkzeugen eine fehlgeschlagene Zahlung testen und kontrollieren, ob Pro zurückgestuft und ein Systemhinweis erzeugt wird.
10. Danach erst Live-Produkt, Live-Preis, Live-Secret und Live-Webhook getrennt einrichten.

## 5. Rechtliche Verkaufsseiten

Vorhanden:

```text
/agb
/datenschutz
/widerruf
/impressum
/kontakt
/preise/checkout
```

Der Reklaio-Pre-Checkout protokolliert die bestätigten Versionen und zeigt Preis, Intervall, Verlängerung, Kündigung und Widerruf. Der finale Button lautet `Zahlungspflichtig abonnieren`. Nach erfolgreichem Checkout wird eine Vertragsbestätigung per E-Mail versendet.

Die Texte und der gesamte Checkout-Prozess sind Arbeitsfassungen und müssen vor dem öffentlichen Live-Verkauf juristisch geprüft werden.

## 6. Kontaktformular

```text
CONTACT_RECIPIENT=reklaio@kamilunavo.com
```

Das Formular versendet über die bestehende SMTP-Verbindung und setzt die Absenderadresse als `Reply-To`.

## 7. Automatische Backups

Der Stack enthält den Container `reklaio-backup`. Er sichert PostgreSQL und das Upload-Volume in das neue persistente Volume `reklaio_backups`.

```text
BACKUP_INTERVAL_SECONDS=86400
BACKUP_RETENTION_DAYS=14
BACKUP_POLL_SECONDS=300
```

Im Admin-Center kann zusätzlich ein manueller Lauf angefordert werden. Die Sicherungen liegen nur auf demselben Docker-Host/VPS. Für echten Ausfallschutz sollte später zusätzlich eine verschlüsselte externe Kopie auf einem getrennten Ziel eingerichtet und eine Wiederherstellung getestet werden.

## 8. Nach dem Portainer-Update

Erwartete Zustände:

```text
reklaio-postgres    healthy
reklaio-migrate     exited – code 0
reklaio-upload-init exited – code 0
reklaio              healthy
reklaio-reminder     running
reklaio-backup       running
```

Danach `/admin` öffnen, Systemstatus prüfen und ein manuelles Backup anfordern.
