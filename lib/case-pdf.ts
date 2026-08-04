import { Buffer } from "node:buffer";

export type CasePdfEntry = {
  label: string;
  value: string;
};

export type CasePdfTimelineEntry = {
  date: string;
  title: string;
  details?: string | null;
};

export type CasePdfDeadline = {
  title: string;
  dueDate: string;
  status: string;
  completedDate?: string | null;
};

export type CasePdfLetter = {
  kind: string;
  subject: string;
  createdAt: string;
  body: string;
};

export type CasePdfDocument = {
  name: string;
  type: string;
  size: string;
  createdAt: string;
};

export type CasePdfData = {
  title: string;
  subtitle: string;
  generatedAt: string;
  owner: string;
  facts: CasePdfEntry[];
  summary: string;
  timeline: CasePdfTimelineEntry[];
  deadlines: CasePdfDeadline[];
  letters: CasePdfLetter[];
  documents: CasePdfDocument[];
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 52;
const TOP_Y = 785;
const BOTTOM_Y = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const WIN_ANSI_REPLACEMENTS: Record<string, string> = {
  "€": "EUR",
  "–": "-",
  "—": "-",
  "…": "...",
  "“": '"',
  "”": '"',
  "„": '"',
  "‘": "'",
  "’": "'",
  "•": "-",
  "→": "->",
  "←": "<-",
  "✓": "OK",
  "✎": ""
};

function normalizeText(value: string) {
  let normalized = value.normalize("NFC");

  for (const [source, replacement] of Object.entries(WIN_ANSI_REPLACEMENTS)) {
    normalized = normalized.split(source).join(replacement);
  }

  return normalized.replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
}

function pdfEscape(value: string) {
  return normalizeText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function approximateTextWidth(value: string, fontSize: number, bold = false) {
  const factor = bold ? 0.56 : 0.51;
  return normalizeText(value).length * fontSize * factor;
}

function wrapText(value: string, maxWidth: number, fontSize: number, bold = false) {
  const paragraphs = normalizeText(value).replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;

      if (approximateTextWidth(candidate, fontSize, bold) <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) {
        lines.push(current);
      }

      if (approximateTextWidth(word, fontSize, bold) <= maxWidth) {
        current = word;
        continue;
      }

      let fragment = "";
      for (const character of word) {
        const next = fragment + character;
        if (approximateTextWidth(next, fontSize, bold) > maxWidth && fragment) {
          lines.push(fragment);
          fragment = character;
        } else {
          fragment = next;
        }
      }
      current = fragment;
    }

    if (current) {
      lines.push(current);
    }
  }

  return lines;
}

class SimplePdfDocument {
  private pages: string[][] = [[]];
  private currentPageIndex = 0;
  private y = TOP_Y;

  private get commands() {
    return this.pages[this.currentPageIndex];
  }

  private addPage() {
    this.pages.push([]);
    this.currentPageIndex += 1;
    this.y = TOP_Y;
  }

  private ensureSpace(requiredHeight: number) {
    if (this.y - requiredHeight < BOTTOM_Y) {
      this.addPage();
    }
  }

  private textCommand(text: string, x: number, y: number, fontSize: number, bold: boolean) {
    const font = bold ? "F2" : "F1";
    this.commands.push(`BT /${font} ${fontSize.toFixed(2)} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(text)}) Tj ET`);
  }

  private lineCommand(x1: number, y1: number, x2: number, y2: number, width = 0.7) {
    this.commands.push(`${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  private fillRectCommand(x: number, y: number, width: number, height: number, gray: number) {
    this.commands.push(`${gray.toFixed(3)} g ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f 0 g`);
  }

  addDocumentHeader(title: string, subtitle: string, generatedAt: string, owner: string) {
    this.fillRectCommand(0, PAGE_HEIGHT - 118, PAGE_WIDTH, 118, 0.955);
    this.textCommand("REKLAIO", MARGIN_X, PAGE_HEIGHT - 49, 11, true);
    this.textCommand("Fallakte", MARGIN_X, PAGE_HEIGHT - 79, 25, true);
    this.textCommand(title, MARGIN_X, PAGE_HEIGHT - 101, 11, false);
    this.textCommand(subtitle, PAGE_WIDTH - MARGIN_X - approximateTextWidth(subtitle, 9), PAGE_HEIGHT - 52, 9, false);
    this.y = PAGE_HEIGHT - 145;
    this.addKeyValue("Erstellt", generatedAt);
    this.addKeyValue("Kontoinhaber", owner);
    this.addSpacing(8);
  }

  addSectionHeading(title: string) {
    this.ensureSpace(34);
    this.addSpacing(9);
    this.textCommand(title, MARGIN_X, this.y, 15, true);
    this.y -= 9;
    this.lineCommand(MARGIN_X, this.y, PAGE_WIDTH - MARGIN_X, this.y, 0.8);
    this.y -= 18;
  }

  addKeyValue(label: string, value: string) {
    const valueLines = wrapText(value || "-", CONTENT_WIDTH - 145, 10);
    const height = Math.max(17, valueLines.length * 13 + 4);
    this.ensureSpace(height);
    this.textCommand(label, MARGIN_X, this.y, 9, true);

    let valueY = this.y;
    for (const line of valueLines) {
      this.textCommand(line || " ", MARGIN_X + 145, valueY, 10, false);
      valueY -= 13;
    }

    this.y -= height;
  }

  addParagraph(value: string, options: { fontSize?: number; bold?: boolean; indent?: number; spacingAfter?: number } = {}) {
    const fontSize = options.fontSize ?? 10;
    const bold = options.bold ?? false;
    const indent = options.indent ?? 0;
    const spacingAfter = options.spacingAfter ?? 8;
    const lineHeight = fontSize * 1.35;
    const lines = wrapText(value || "-", CONTENT_WIDTH - indent, fontSize, bold);

    for (const line of lines) {
      this.ensureSpace(lineHeight + 2);
      if (line) {
        this.textCommand(line, MARGIN_X + indent, this.y, fontSize, bold);
      }
      this.y -= lineHeight;
    }

    this.y -= spacingAfter;
  }

  addRecord(title: string, meta: string, details?: string | null) {
    const titleLines = wrapText(title || "-", CONTENT_WIDTH, 10.5, true);
    const metaLines = wrapText(meta || "-", CONTENT_WIDTH, 8.5);
    const detailsLines = details ? wrapText(details, CONTENT_WIDTH - 12, 9.5) : [];
    const height = titleLines.length * 14 + metaLines.length * 11 + detailsLines.length * 13 + 18;
    this.ensureSpace(Math.min(height, PAGE_HEIGHT - TOP_Y - BOTTOM_Y));

    for (const line of titleLines) {
      this.ensureSpace(16);
      this.textCommand(line, MARGIN_X, this.y, 10.5, true);
      this.y -= 14;
    }

    for (const line of metaLines) {
      this.ensureSpace(13);
      this.textCommand(line, MARGIN_X, this.y, 8.5, false);
      this.y -= 11;
    }

    if (detailsLines.length > 0) {
      this.y -= 3;
      for (const line of detailsLines) {
        this.ensureSpace(15);
        this.textCommand(line, MARGIN_X + 12, this.y, 9.5, false);
        this.y -= 13;
      }
    }

    this.y -= 8;
  }

  addLetter(letter: CasePdfLetter) {
    this.ensureSpace(80);
    this.textCommand(letter.subject || "Schreiben ohne Betreff", MARGIN_X, this.y, 11, true);
    this.y -= 15;
    this.textCommand(`${letter.kind} | ${letter.createdAt}`, MARGIN_X, this.y, 8.5, false);
    this.y -= 17;
    this.addParagraph(letter.body, { fontSize: 9.5, indent: 10, spacingAfter: 15 });
  }

  addSpacing(points: number) {
    this.y -= points;
  }

  build(metadata: { title: string; author: string }) {
    const pageCount = this.pages.length;

    this.pages.forEach((commands, index) => {
      commands.push(`0.75 w ${MARGIN_X.toFixed(2)} 37.00 m ${(PAGE_WIDTH - MARGIN_X).toFixed(2)} 37.00 l S`);
      commands.push(`BT /F1 8 Tf 1 0 0 1 ${MARGIN_X.toFixed(2)} 22.00 Tm (Reklaio - Keine Rechtsberatung) Tj ET`);
      const pageLabel = `Seite ${index + 1} von ${pageCount}`;
      const pageX = PAGE_WIDTH - MARGIN_X - approximateTextWidth(pageLabel, 8);
      commands.push(`BT /F1 8 Tf 1 0 0 1 ${pageX.toFixed(2)} 22.00 Tm (${pdfEscape(pageLabel)}) Tj ET`);
    });

    const objects: Buffer[] = [];
    const pageObjectNumbers: number[] = [];
    const contentObjectNumbers: number[] = [];

    for (let index = 0; index < pageCount; index += 1) {
      pageObjectNumbers.push(5 + index * 2);
      contentObjectNumbers.push(6 + index * 2);
    }

    const infoObjectNumber = 5 + pageCount * 2;

    objects[1] = Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1");
    objects[2] = Buffer.from(`<< /Type /Pages /Count ${pageCount} /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] >>`, "latin1");
    objects[3] = Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "latin1");
    objects[4] = Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "latin1");

    this.pages.forEach((commands, index) => {
      const pageObjectNumber = pageObjectNumbers[index];
      const contentObjectNumber = contentObjectNumbers[index];
      const stream = Buffer.from(commands.join("\n"), "latin1");

      objects[pageObjectNumber] = Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
        "latin1"
      );
      objects[contentObjectNumber] = Buffer.concat([
        Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, "latin1"),
        stream,
        Buffer.from("\nendstream", "latin1")
      ]);
    });

    const creationDate = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    objects[infoObjectNumber] = Buffer.from(
      `<< /Title (${pdfEscape(metadata.title)}) /Author (${pdfEscape(metadata.author)}) /Creator (Reklaio) /CreationDate (D:${creationDate}) >>`,
      "latin1"
    );

    const header = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1");
    const chunks: Buffer[] = [header];
    const offsets: number[] = [0];
    let byteOffset = header.length;

    for (let objectNumber = 1; objectNumber <= infoObjectNumber; objectNumber += 1) {
      const objectBody = objects[objectNumber];
      if (!objectBody) {
        throw new Error(`PDF object ${objectNumber} is missing`);
      }

      offsets[objectNumber] = byteOffset;
      const objectChunk = Buffer.concat([
        Buffer.from(`${objectNumber} 0 obj\n`, "latin1"),
        objectBody,
        Buffer.from("\nendobj\n", "latin1")
      ]);
      chunks.push(objectChunk);
      byteOffset += objectChunk.length;
    }

    const xrefOffset = byteOffset;
    const xrefLines = ["xref", `0 ${infoObjectNumber + 1}`, "0000000000 65535 f "];

    for (let objectNumber = 1; objectNumber <= infoObjectNumber; objectNumber += 1) {
      xrefLines.push(`${String(offsets[objectNumber]).padStart(10, "0")} 00000 n `);
    }

    const trailer = [
      ...xrefLines,
      "trailer",
      `<< /Size ${infoObjectNumber + 1} /Root 1 0 R /Info ${infoObjectNumber} 0 R >>`,
      "startxref",
      String(xrefOffset),
      "%%EOF",
      ""
    ].join("\n");

    chunks.push(Buffer.from(trailer, "latin1"));
    return Buffer.concat(chunks);
  }
}

export function createCasePdf(data: CasePdfData) {
  const pdf = new SimplePdfDocument();
  pdf.addDocumentHeader(data.title, data.subtitle, data.generatedAt, data.owner);

  pdf.addSectionHeading("Falldaten");
  for (const fact of data.facts) {
    pdf.addKeyValue(fact.label, fact.value);
  }

  pdf.addSectionHeading("Zusammenfassung");
  pdf.addParagraph(data.summary || "Noch keine Zusammenfassung erfasst.");

  pdf.addSectionHeading(`Chronik (${data.timeline.length})`);
  if (data.timeline.length === 0) {
    pdf.addParagraph("Noch keine Chronikeinträge vorhanden.");
  } else {
    for (const event of data.timeline) {
      pdf.addRecord(event.title, event.date, event.details);
    }
  }

  pdf.addSectionHeading(`Fristen (${data.deadlines.length})`);
  if (data.deadlines.length === 0) {
    pdf.addParagraph("Noch keine Fristen erfasst.");
  } else {
    for (const deadline of data.deadlines) {
      const completed = deadline.completedDate ? ` | erledigt: ${deadline.completedDate}` : "";
      pdf.addRecord(deadline.title, `Fällig: ${deadline.dueDate} | ${deadline.status}${completed}`);
    }
  }

  pdf.addSectionHeading(`Schreiben (${data.letters.length})`);
  if (data.letters.length === 0) {
    pdf.addParagraph("Noch keine Schreiben gespeichert.");
  } else {
    for (const letter of data.letters) {
      pdf.addLetter(letter);
    }
  }

  pdf.addSectionHeading(`Dokumentenliste (${data.documents.length})`);
  if (data.documents.length === 0) {
    pdf.addParagraph("Noch keine Dokumente hochgeladen.");
  } else {
    for (const document of data.documents) {
      pdf.addRecord(document.name, `${document.type} | ${document.size} | ${document.createdAt}`);
    }
  }

  return pdf.build({
    title: `Reklaio Fallakte - ${data.title}`,
    author: data.owner
  });
}
