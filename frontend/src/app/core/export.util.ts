import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html ?? '';
  return tmp.textContent ?? tmp.innerText ?? '';
};

/** Download the given blob with the given filename. */
const download = (blob: Blob, filename: string): void => {
  saveAs(blob, filename);
};

// ---------------- CSV ----------------

/**
 * Convert an array of records to a CSV blob and trigger download.
 * Headers are inferred from the keys of the first record unless provided.
 */
export function exportCsv<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[],
): void {
  const cols =
    headers ??
    (rows.length
      ? Object.keys(rows[0]).map((k) => ({ key: k as keyof T, label: k }))
      : []);
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const headLine = cols.map((c) => escape(c.label)).join(',');
  const bodyLines = rows.map((r) =>
    cols.map((c) => escape(r[c.key])).join(','),
  );
  const csv = [headLine, ...bodyLines].join('\r\n');
  download(
    new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
    filename,
  );
}

// ---------------- DOCX ----------------

export interface DocxSection {
  title: string;
  /** HTML string; tags will be stripped to plain text paragraphs. */
  html: string;
  meta?: { label: string; value: string }[];
}

export async function exportDocx(
  filename: string,
  sections: DocxSection[],
): Promise<void> {
  const children: Paragraph[] = [];
  for (const s of sections) {
    children.push(
      new Paragraph({
        text: s.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT,
      }),
    );
    if (s.meta?.length) {
      for (const m of s.meta) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${m.label}: `, bold: true }),
              new TextRun(m.value),
            ],
          }),
        );
      }
      children.push(new Paragraph(''));
    }
    const text = stripHtml(s.html).trim();
    for (const line of text.split(/\n+/)) {
      children.push(new Paragraph(line));
    }
    children.push(new Paragraph(''));
  }
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [{ children }],
  });
  const blob = await Packer.toBlob(doc);
  download(blob, filename);
}

// ---------------- PDF ----------------

export interface PdfSection {
  title: string;
  html: string;
  meta?: { label: string; value: string }[];
}

export function exportPdf(filename: string, sections: PdfSection[]): void {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 48;
  const marginY = 56;
  let y = marginY;
  const lineHeight = 16;

  const ensureSpace = (needed: number): void => {
    if (y + needed > pageHeight - marginY) {
      pdf.addPage();
      y = marginY;
    }
  };

  const writeText = (
    text: string,
    opts: { size?: number; bold?: boolean } = {},
  ): void => {
    pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    pdf.setFontSize(opts.size ?? 11);
    const lines = pdf.splitTextToSize(text, pageWidth - marginX * 2) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight);
      pdf.text(line, marginX, y);
      y += lineHeight;
    }
  };

  sections.forEach((s, idx) => {
    if (idx > 0) {
      y += 8;
    }
    writeText(s.title, { size: 18, bold: true });
    y += 4;
    if (s.meta?.length) {
      for (const m of s.meta) {
        writeText(`${m.label}: ${m.value}`, { size: 10 });
      }
      y += 6;
    }
    const text = stripHtml(s.html).trim();
    for (const para of text.split(/\n+/)) {
      writeText(para, { size: 11 });
      y += 4;
    }
  });

  pdf.save(filename);
}
