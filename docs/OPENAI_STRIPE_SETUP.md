# Reklaio – OpenAI, Stripe und Kontakt einrichten

## OpenAI

Reklaio sendet seine Prompts direkt aus `lib/ai.ts` mit jeder Responses-API-Anfrage. Im OpenAI-Dashboard muss kein zusätzlicher Prompt angelegt oder veröffentlicht werden.

Erforderlich:

1. In der OpenAI Platform ein API-Projekt auswählen oder anlegen.
2. Einen Projekt-API-Schlüssel erzeugen.
3. API-Abrechnung beziehungsweise Guthaben aktivieren.
4. Optional im Projekt ein Ausgabenlimit festlegen.
5. In Portainer setzen:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

Der Schlüssel gehört ausschließlich in Portainer und niemals in GitHub oder Supportnachrichten.

## Stripe – Reklaio Pro

1. In Stripe ein Produkt `Reklaio Pro` anlegen.
2. Einen wiederkehrenden monatlichen Preis in EUR anlegen.
3. Die Preis-ID `price_...` kopieren.
4. Das Stripe-Kundenportal aktivieren und mindestens Zahlungsmethoden, Rechnungen und Kündigung freigeben.
5. Einen Webhook-Endpoint anlegen:

```text
https://reklaio.de/api/billing/webhook
```

6. Folgende Ereignisse abonnieren:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

7. Das Webhook-Signing-Secret `whsec_...` kopieren.
8. In Portainer setzen:

```text
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
REKLAIO_PRO_PRICE_LABEL=DEIN PREIS / Monat
```

Für Tests zuerst Stripe-Testschlüssel und einen Testpreis verwenden. Test- und Live-Schlüssel dürfen nicht gemischt werden.

## Kontaktformular

Das Kontaktformular sendet über die bereits konfigurierte SMTP-Verbindung. Empfänger:

```text
CONTACT_RECIPIENT=reklaio@kamilunavo.com
```

Die Absenderadresse bleibt `MAIL_FROM`. Antworten auf Kontaktanfragen gehen durch den gesetzten `Reply-To` direkt an die Adresse des Absenders.

## Bestehende Konten

Bei Einführung des Tarifs erhalten bereits vorhandene Konten automatisch `Beta-Pro`. Neue Konten starten mit `Reklaio Free`. Free umfasst die Fallorganisation; KI-Dokumentanalyse und KI-Schreiben erfordern Pro.
