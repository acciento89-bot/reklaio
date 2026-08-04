import nodemailer from "nodemailer";

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

type GlobalMail = typeof globalThis & {
  reklaioMailer?: ReturnType<typeof nodemailer.createTransport>;
};

function parseBoolean(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes((value ?? "").toLowerCase());
}

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

function getTransporter() {
  if (!isMailConfigured()) {
    throw new Error("MAIL_NOT_CONFIGURED");
  }

  const globalMail = globalThis as GlobalMail;
  if (globalMail.reklaioMailer) {
    return globalMail.reklaioMailer;
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("INVALID_SMTP_PORT");
  }

  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  globalMail.reklaioMailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: parseBoolean(process.env.SMTP_SECURE),
    auth: user && password ? { user, pass: password } : undefined,
    requireTLS: !parseBoolean(process.env.SMTP_SECURE),
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000
  });

  return globalMail.reklaioMailer;
}

export async function sendMail(message: MailMessage) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: message.to,
    replyTo: message.replyTo,
    subject: message.subject.replace(/[\r\n]+/g, " ").slice(0, 240),
    text: message.text,
    html: message.html
  });
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function textToHtml(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}
