import { escapeHtml } from "@/lib/mail";
import { publicUrl } from "@/lib/public-url";

export type ReklaioEmailTone = "brand" | "success" | "warning" | "security";

type EmailAction = {
  label: string;
  url: string;
};

type EmailDetail = {
  label: string;
  value: string;
};

type ReklaioEmailOptions = {
  preheader: string;
  title: string;
  greeting?: string;
  paragraphs?: string[];
  action?: EmailAction;
  details?: EmailDetail[];
  notice?: string;
  tone?: ReklaioEmailTone;
};

const toneColors: Record<ReklaioEmailTone, { accent: string; soft: string; text: string }> = {
  brand: { accent: "#817dff", soft: "#f0efff", text: "#514db7" },
  success: { accent: "#19aeb9", soft: "#e9fbfb", text: "#087b84" },
  warning: { accent: "#d98a17", soft: "#fff6e8", text: "#9a5d08" },
  security: { accent: "#b45468", soft: "#fff0f3", text: "#8e3448" }
};

function paragraphHtml(paragraphs: string[] | undefined) {
  if (!paragraphs?.length) return "";
  return paragraphs
    .map(
      paragraph =>
        `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#334155;">${escapeHtml(paragraph)}</p>`
    )
    .join("");
}

function detailsHtml(details: EmailDetail[] | undefined) {
  if (!details?.length) return "";

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:6px 0 22px;border-collapse:separate;border-spacing:0;background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;">
    ${details
      .map(
        detail => `<tr>
          <td style="padding:13px 16px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;color:#64748b;width:34%;">${escapeHtml(detail.label)}</td>
          <td style="padding:13px 16px;border-bottom:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;color:#0f172a;font-weight:700;">${escapeHtml(detail.value)}</td>
        </tr>`
      )
      .join("")}
  </table>`;
}

function actionHtml(action: EmailAction | undefined, accent: string) {
  if (!action) return "";

  const url = escapeHtml(action.url);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 24px;">
    <tr>
      <td bgcolor="${accent}" style="border-radius:12px;background:${accent};">
        <a href="${url}" style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;border-radius:12px;">${escapeHtml(action.label)}</a>
      </td>
    </tr>
  </table>
  <p style="margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#94a3b8;word-break:break-all;">Falls der Button nicht funktioniert, öffne diesen Link:<br><a href="${url}" style="color:#5b5bd6;text-decoration:underline;">${url}</a></p>`;
}

export function renderReklaioEmail(options: ReklaioEmailOptions) {
  const tone = options.tone ?? "brand";
  const colors = toneColors[tone];
  const iconUrl = escapeHtml(publicUrl("/icon-192.png").toString());
  const homeUrl = escapeHtml(publicUrl("/").toString());
  const contactUrl = escapeHtml(publicUrl("/kontakt").toString());
  const privacyUrl = escapeHtml(publicUrl("/datenschutz").toString());
  const imprintUrl = escapeHtml(publicUrl("/impressum").toString());

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(options.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#eef2f7;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;border-collapse:separate;border-spacing:0;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 10px 35px rgba(15,23,42,.08);">
          <tr>
            <td style="padding:24px 30px;background:#0b1537;border-bottom:4px solid ${colors.accent};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" style="width:48px;">
                    <img src="${iconUrl}" width="42" height="42" alt="Reklaio" style="display:block;border:0;border-radius:10px;width:42px;height:42px;">
                  </td>
                  <td valign="middle" style="padding-left:12px;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
                    <div style="font-size:20px;line-height:1.1;font-weight:800;letter-spacing:.2px;">Reklaio</div>
                    <div style="margin-top:4px;font-size:11px;line-height:1.2;color:#b8c2e0;letter-spacing:.9px;text-transform:uppercase;">Reklamationen im Griff</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 34px 20px;">
              ${options.greeting ? `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#64748b;">${escapeHtml(options.greeting)}</p>` : ""}
              <h1 style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:27px;line-height:1.25;color:#0f172a;font-weight:800;">${escapeHtml(options.title)}</h1>
              ${paragraphHtml(options.paragraphs)}
              ${detailsHtml(options.details)}
              ${actionHtml(options.action, colors.accent)}
              ${options.notice ? `<div style="margin:4px 0 18px;padding:14px 16px;border-radius:12px;background:${colors.soft};border-left:4px solid ${colors.accent};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:${colors.text};">${escapeHtml(options.notice)}</div>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 34px 28px;border-top:1px solid #e5e7eb;background:#fbfcfe;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 10px;font-size:12px;line-height:1.55;color:#94a3b8;">Diese Nachricht wurde automatisch von Reklaio gesendet.</p>
              <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;">
                <a href="${homeUrl}" style="color:#5b5bd6;text-decoration:none;">reklaio.de</a>
                &nbsp;&middot;&nbsp;
                <a href="${contactUrl}" style="color:#5b5bd6;text-decoration:none;">Kontakt</a>
                &nbsp;&middot;&nbsp;
                <a href="${privacyUrl}" style="color:#5b5bd6;text-decoration:none;">Datenschutz</a>
                &nbsp;&middot;&nbsp;
                <a href="${imprintUrl}" style="color:#5b5bd6;text-decoration:none;">Impressum</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
