import { createAuthEmailToken, deleteAuthEmailToken } from "@/lib/auth-email-tokens";
import { escapeHtml, sendMail } from "@/lib/mail";
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

  const text = `${greeting(recipient.displayName)}\n\nbitte bestätige deine E-Mail-Adresse für Reklaio:\n${url.toString()}\n\nDer Link ist 24 Stunden gültig. Falls du dich nicht registriert hast, kannst du diese Nachricht ignorieren.`;
  const html = `<p>${escapeHtml(greeting(recipient.displayName))}</p><p>Bitte bestätige deine E-Mail-Adresse für Reklaio.</p><p><a href="${escapeHtml(url.toString())}">E-Mail-Adresse bestätigen</a></p><p>Der Link ist 24 Stunden gültig. Falls du dich nicht registriert hast, kannst du diese Nachricht ignorieren.</p>`;

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

  const text = `${greeting(recipient.displayName)}\n\nfür dein Reklaio-Konto wurde ein neues Passwort angefordert:\n${url.toString()}\n\nDer Link ist 60 Minuten gültig. Falls du das nicht warst, kannst du diese Nachricht ignorieren.`;
  const html = `<p>${escapeHtml(greeting(recipient.displayName))}</p><p>Für dein Reklaio-Konto wurde ein neues Passwort angefordert.</p><p><a href="${escapeHtml(url.toString())}">Neues Passwort festlegen</a></p><p>Der Link ist 60 Minuten gültig. Falls du das nicht warst, kannst du diese Nachricht ignorieren.</p>`;

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
