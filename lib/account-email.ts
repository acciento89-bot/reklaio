import { createAuthEmailToken, deleteAuthEmailToken } from "@/lib/auth-email-tokens";
import { renderReklaioEmail } from "@/lib/email-template";
import { sendMail } from "@/lib/mail";
import { publicUrl } from "@/lib/public-url";

type AccountMailRecipient = {
  userId: string;
  email: string;
  displayName?: string | null;
};

function greeting(displayName?: string | null) {
  return displayName?.trim() ? `Hallo ${displayName.trim()},` : "Hallo,";
}

export async function sendVerificationEmail(recipient: AccountMailRecipient) {
  const issued = await createAuthEmailToken(recipient.userId, "verify_email", 24 * 60);
  const url = publicUrl("/api/auth/verify-email");
  url.searchParams.set("token", issued.token);

  const text = `${greeting(recipient.displayName)}\n\nbitte bestätige deine E-Mail-Adresse für Reklaio:\n${url.toString()}\n\nDer Link ist 24 Stunden gültig. Falls du dich nicht bei Reklaio registriert hast, kannst du diese Nachricht ignorieren.`;

  const html = renderReklaioEmail({
    preheader: "Bestätige deine E-Mail-Adresse und aktiviere dein Reklaio-Konto.",
    title: "E-Mail-Adresse bestätigen",
    greeting: greeting(recipient.displayName),
    paragraphs: [
      "Schön, dass du Reklaio nutzt. Bitte bestätige jetzt deine E-Mail-Adresse, damit dein Konto vollständig aktiviert wird."
    ],
    action: {
      label: "E-Mail-Adresse bestätigen",
      url: url.toString()
    },
    notice: "Der Bestätigungslink ist 24 Stunden gültig. Falls du dich nicht bei Reklaio registriert hast, kannst du diese Nachricht einfach ignorieren.",
    tone: "brand"
  });

  try {
    await sendMail({
      to: recipient.email,
      subject: "E-Mail-Adresse für Reklaio bestätigen",
      text,
      html
    });
  } catch (error) {
    await deleteAuthEmailToken(issued.id).catch(() => undefined);
    throw error;
  }
}

export async function sendPasswordResetEmail(recipient: AccountMailRecipient) {
  const issued = await createAuthEmailToken(recipient.userId, "reset_password", 60);
  const url = publicUrl("/passwort-zuruecksetzen");
  url.searchParams.set("token", issued.token);

  const text = `${greeting(recipient.displayName)}\n\nfür dein Reklaio-Konto wurde das Zurücksetzen des Passworts angefordert.\n\nNeues Passwort festlegen:\n${url.toString()}\n\nDer Link ist 60 Minuten gültig. Falls du das nicht warst, ignoriere diese Nachricht und ändere nichts an deinem Konto.`;
  const html = renderReklaioEmail({
    preheader: "Lege ein neues Passwort für dein Reklaio-Konto fest.",
    title: "Passwort zurücksetzen",
    greeting: greeting(recipient.displayName),
    paragraphs: [
      "Für dein Reklaio-Konto wurde das Zurücksetzen des Passworts angefordert.",
      "Über den folgenden Button kannst du ein neues Passwort festlegen."
    ],
    action: {
      label: "Neues Passwort festlegen",
      url: url.toString()
    },
    notice: "Der Link ist 60 Minuten gültig. Falls du das nicht warst, ignoriere diese Nachricht und ändere nichts an deinem Konto.",
    tone: "security"
  });

  try {
    await sendMail({
      to: recipient.email,
      subject: "Reklaio-Passwort zurücksetzen",
      text,
      html
    });
  } catch (error) {
    await deleteAuthEmailToken(issued.id).catch(() => undefined);
    throw error;
  }
}

export async function sendWelcomeEmail(recipient: AccountMailRecipient) {
  const dashboardUrl = publicUrl("/dashboard").toString();
  const text = `${greeting(recipient.displayName)}\n\ndeine E-Mail-Adresse ist bestätigt – willkommen bei Reklaio. Dein Konto ist jetzt startklar.\n\nReklaio öffnen:\n${dashboardUrl}\n\nMit Reklaio kannst du Reklamationen, Fristen, Dokumente und den Verlauf deiner Fälle an einem Ort organisieren.`;
  const html = renderReklaioEmail({
    preheader: "Dein Reklaio-Konto ist bestätigt und startklar.",
    title: "Willkommen bei Reklaio",
    greeting: greeting(recipient.displayName),
    paragraphs: [
      "Deine E-Mail-Adresse ist bestätigt und dein Konto ist jetzt startklar.",
      "Mit Reklaio kannst du Reklamationen, Fristen, Dokumente und den Verlauf deiner Fälle an einem Ort organisieren."
    ],
    action: {
      label: "Reklaio öffnen",
      url: dashboardUrl
    },
    notice: "Tipp: Lege deinen ersten Fall an und trage wichtige Fristen direkt ein, damit Reklaio dich rechtzeitig erinnern kann.",
    tone: "success"
  });

  await sendMail({
    to: recipient.email,
    subject: "Willkommen bei Reklaio",
    text,
    html
  });
}

export async function sendPasswordChangedEmail(recipient: AccountMailRecipient) {
  const settingsUrl = publicUrl("/einstellungen").toString();
  const resetUrl = publicUrl("/passwort-vergessen").toString();
  const text = `${greeting(recipient.displayName)}\n\ndas Passwort deines Reklaio-Kontos wurde geändert.\n\nWenn du das warst, musst du nichts weiter tun. Wenn du diese Änderung nicht vorgenommen hast, sichere dein Konto sofort und fordere unter ${resetUrl} ein neues Passwort an.\n\nKontoeinstellungen:\n${settingsUrl}`;
  const html = renderReklaioEmail({
    preheader: "Das Passwort deines Reklaio-Kontos wurde geändert.",
    title: "Passwort wurde geändert",
    greeting: greeting(recipient.displayName),
    paragraphs: [
      "Das Passwort deines Reklaio-Kontos wurde erfolgreich geändert.",
      "Wenn du diese Änderung selbst vorgenommen hast, musst du nichts weiter tun."
    ],
    action: {
      label: "Kontoeinstellungen öffnen",
      url: settingsUrl
    },
    notice: `Wenn du das nicht warst, sichere dein Konto sofort und fordere unter ${resetUrl} ein neues Passwort an.`,
    tone: "security"
  });

  await sendMail({
    to: recipient.email,
    subject: "Sicherheitshinweis: Reklaio-Passwort geändert",
    text,
    html
  });
}
