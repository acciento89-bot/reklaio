import { createAuthEmailToken, deleteAuthEmailToken } from "@/lib/auth-email-tokens";
import { renderReklaioEmail } from "@/lib/email-template";
import { sendMail } from "@/lib/mail";
import { publicUrl } from "@/lib/public-url";

type AccountMailRecipient = {
  userId: string;
  email: string;
  displayName?: string | null;
  locale?: "de" | "en";
};

function greeting(displayName?: string | null, locale: "de" | "en" = "de") {
  if (locale === "en") return displayName?.trim() ? `Hello ${displayName.trim()},` : "Hello,";
  return displayName?.trim() ? `Hallo ${displayName.trim()},` : "Hallo,";
}

export async function sendVerificationEmail(recipient: AccountMailRecipient) {
  const en = recipient.locale === "en";
  const issued = await createAuthEmailToken(recipient.userId, "verify_email", 24 * 60);
  const url = publicUrl("/api/auth/verify-email");
  url.searchParams.set("token", issued.token);
  if (en) url.searchParams.set("locale", "en");

  const text = en ? `${greeting(recipient.displayName, "en")}\n\nPlease confirm your email address for Reklaio:\n${url.toString()}\n\nThe link is valid for 24 hours. If you did not register with Reklaio, you can ignore this message.` : `${greeting(recipient.displayName)}\n\nbitte bestätige deine E-Mail-Adresse für Reklaio:\n${url.toString()}\n\nDer Link ist 24 Stunden gültig. Falls du dich nicht bei Reklaio registriert hast, kannst du diese Nachricht ignorieren.`;

  const html = renderReklaioEmail({
    locale: recipient.locale,
    preheader: en ? "Confirm your email address and activate your Reklaio account." : "Bestätige deine E-Mail-Adresse und aktiviere dein Reklaio-Konto.",
    title: en ? "Confirm your email address" : "E-Mail-Adresse bestätigen",
    greeting: greeting(recipient.displayName, recipient.locale),
    paragraphs: [en ? "Thank you for using Reklaio. Confirm your email address to activate your account fully." : "Schön, dass du Reklaio nutzt. Bitte bestätige jetzt deine E-Mail-Adresse, damit dein Konto vollständig aktiviert wird."],
    action: {
      label: en ? "Confirm email address" : "E-Mail-Adresse bestätigen",
      url: url.toString()
    },
    notice: en ? "The confirmation link is valid for 24 hours. If you did not register with Reklaio, you can ignore this message." : "Der Bestätigungslink ist 24 Stunden gültig. Falls du dich nicht bei Reklaio registriert hast, kannst du diese Nachricht einfach ignorieren.",
    tone: "brand"
  });

  try {
    await sendMail({
      to: recipient.email,
      subject: en ? "Confirm your Reklaio email address" : "E-Mail-Adresse für Reklaio bestätigen",
      text,
      html
    });
  } catch (error) {
    await deleteAuthEmailToken(issued.id).catch(() => undefined);
    throw error;
  }
}

export async function sendPasswordResetEmail(recipient: AccountMailRecipient) {
  const en = recipient.locale === "en";
  const issued = await createAuthEmailToken(recipient.userId, "reset_password", 60);
  const url = publicUrl(en ? "/en/passwort-zuruecksetzen" : "/passwort-zuruecksetzen");
  url.searchParams.set("token", issued.token);

  const text = en ? `${greeting(recipient.displayName, "en")}\n\nA password reset was requested for your Reklaio account.\n\nSet a new password:\n${url.toString()}\n\nThe link is valid for 60 minutes. If this was not you, ignore this message.` : `${greeting(recipient.displayName)}\n\nfür dein Reklaio-Konto wurde das Zurücksetzen des Passworts angefordert.\n\nNeues Passwort festlegen:\n${url.toString()}\n\nDer Link ist 60 Minuten gültig. Falls du das nicht warst, ignoriere diese Nachricht und ändere nichts an deinem Konto.`;
  const html = renderReklaioEmail({
    locale: recipient.locale,
    preheader: en ? "Set a new password for your Reklaio account." : "Lege ein neues Passwort für dein Reklaio-Konto fest.",
    title: en ? "Reset password" : "Passwort zurücksetzen",
    greeting: greeting(recipient.displayName, recipient.locale),
    paragraphs: en ? ["A password reset was requested for your Reklaio account.", "Use the button below to set a new password."] : ["Für dein Reklaio-Konto wurde das Zurücksetzen des Passworts angefordert.", "Über den folgenden Button kannst du ein neues Passwort festlegen."],
    action: {
      label: en ? "Set new password" : "Neues Passwort festlegen",
      url: url.toString()
    },
    notice: en ? "The link is valid for 60 minutes. If this was not you, ignore this message and make no changes to your account." : "Der Link ist 60 Minuten gültig. Falls du das nicht warst, ignoriere diese Nachricht und ändere nichts an deinem Konto.",
    tone: "security"
  });

  try {
    await sendMail({
      to: recipient.email,
      subject: en ? "Reset your Reklaio password" : "Reklaio-Passwort zurücksetzen",
      text,
      html
    });
  } catch (error) {
    await deleteAuthEmailToken(issued.id).catch(() => undefined);
    throw error;
  }
}

export async function sendWelcomeEmail(recipient: AccountMailRecipient) {
  const en = recipient.locale === "en";
  const dashboardUrl = publicUrl(en ? "/en/dashboard" : "/dashboard").toString();
  const text = en ? `${greeting(recipient.displayName, "en")}\n\nYour email address is confirmed – welcome to Reklaio. Your account is ready.\n\nOpen Reklaio:\n${dashboardUrl}\n\nUse Reklaio to organise complaints, deadlines, documents and your case timeline in one place.` : `${greeting(recipient.displayName)}\n\ndeine E-Mail-Adresse ist bestätigt – willkommen bei Reklaio. Dein Konto ist jetzt startklar.\n\nReklaio öffnen:\n${dashboardUrl}\n\nMit Reklaio kannst du Reklamationen, Fristen, Dokumente und den Verlauf deiner Fälle an einem Ort organisieren.`;
  const html = renderReklaioEmail({
    locale: recipient.locale,
    preheader: en ? "Your Reklaio account is confirmed and ready." : "Dein Reklaio-Konto ist bestätigt und startklar.",
    title: en ? "Welcome to Reklaio" : "Willkommen bei Reklaio",
    greeting: greeting(recipient.displayName, recipient.locale),
    paragraphs: en ? ["Your email address is confirmed and your account is ready.", "Use Reklaio to organise complaints, deadlines, documents and your case timeline in one place."] : ["Deine E-Mail-Adresse ist bestätigt und dein Konto ist jetzt startklar.", "Mit Reklaio kannst du Reklamationen, Fristen, Dokumente und den Verlauf deiner Fälle an einem Ort organisieren."],
    action: {
      label: en ? "Open Reklaio" : "Reklaio öffnen",
      url: dashboardUrl
    },
    notice: en ? "Tip: Create your first case and enter important deadlines so Reklaio can remind you in time." : "Tipp: Lege deinen ersten Fall an und trage wichtige Fristen direkt ein, damit Reklaio dich rechtzeitig erinnern kann.",
    tone: "success"
  });

  await sendMail({
    to: recipient.email,
    subject: en ? "Welcome to Reklaio" : "Willkommen bei Reklaio",
    text,
    html
  });
}

export async function sendPasswordChangedEmail(recipient: AccountMailRecipient) {
  const en = recipient.locale === "en";
  const settingsUrl = publicUrl(en ? "/en/einstellungen" : "/einstellungen").toString();
  const resetUrl = publicUrl(en ? "/en/passwort-vergessen" : "/passwort-vergessen").toString();
  const text = en ? `${greeting(recipient.displayName, "en")}\n\nThe password for your Reklaio account was changed.\n\nIf this was you, no further action is needed. Otherwise, secure your account immediately and request a new password at ${resetUrl}.\n\nAccount settings:\n${settingsUrl}` : `${greeting(recipient.displayName)}\n\ndas Passwort deines Reklaio-Kontos wurde geändert.\n\nWenn du das warst, musst du nichts weiter tun. Wenn du diese Änderung nicht vorgenommen hast, sichere dein Konto sofort und fordere unter ${resetUrl} ein neues Passwort an.\n\nKontoeinstellungen:\n${settingsUrl}`;
  const html = renderReklaioEmail({
    locale: recipient.locale,
    preheader: en ? "Your Reklaio account password was changed." : "Das Passwort deines Reklaio-Kontos wurde geändert.",
    title: en ? "Password changed" : "Passwort wurde geändert",
    greeting: greeting(recipient.displayName, recipient.locale),
    paragraphs: en ? ["Your Reklaio account password was changed successfully.", "If you made this change, no further action is needed."] : ["Das Passwort deines Reklaio-Kontos wurde erfolgreich geändert.", "Wenn du diese Änderung selbst vorgenommen hast, musst du nichts weiter tun."],
    action: {
      label: en ? "Open account settings" : "Kontoeinstellungen öffnen",
      url: settingsUrl
    },
    notice: en ? `If this was not you, secure your account immediately and request a new password at ${resetUrl}.` : `Wenn du das nicht warst, sichere dein Konto sofort und fordere unter ${resetUrl} ein neues Passwort an.`,
    tone: "security"
  });

  await sendMail({
    to: recipient.email,
    subject: en ? "Security notice: Reklaio password changed" : "Sicherheitshinweis: Reklaio-Passwort geändert",
    text,
    html
  });
}
