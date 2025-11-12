import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import type { ChecklistItem } from "./types/database";

interface FusedChecklistData {
  title: string;
  version: string;
  date: string;
  fusedItems: Array<{
    item: ChecklistItem;
    sourceIds: string[];
    isFused: boolean;
  }>;
  metadata?: {
    checklist1Name: string;
    checklist2Name: string;
    auditInfo?: {
      dateLieu: string;
      auditeur: string;
      entreprise: string;
      clientNumber: string;
      personnesAudittees: string;
      typeAudit: string;
    };
  };
}

// --- CONSTANTS ---
const PAGE_MARGIN = 50;
const FONT_SIZE = 10;
const LINE_HEIGHT = 12;
const COLOR_TEXT = rgb(0, 0, 0);
const COLOR_HEADER = rgb(0, 0.2, 0.4);
const COLOR_BORDER = rgb(0.7, 0.7, 0.7);
const COLOR_FUSED = rgb(0, 0.5, 0);
const COLS = { pa: 25, box: 18, text: 330, notes: 160 };

// --- UTILITIES ---
function wrapText(text: string, font: any, size: number, width: number): string[] {
  if (!text) return [""];
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line ? line + " " + word : word;
    const tw = font.widthOfTextAtSize(test, size);
    if (tw > width && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(
  page: any,
  x: number,
  y: number,
  text: string,
  font: any,
  size: number,
  width: number
): number {
  const lines = wrapText(text, font, size, width);
  let yy = y;
  for (const line of lines) {
    page.drawText(line, { x, y: yy, size, font, color: COLOR_TEXT });
    yy -= LINE_HEIGHT;
  }
  return lines.length * LINE_HEIGHT;
}

function drawChecklistRow(
  page: any,
  y: number,
  item: ChecklistItem,
  font: any
): number {
  const leftText = item.text || "";
  const rightText = item.references?.join(" ") || "";
  const textLines = wrapText(leftText, font, FONT_SIZE, COLS.text - 6);
  const noteLines = wrapText(rightText, font, FONT_SIZE, COLS.notes - 6);
  const lines = Math.max(textLines.length, noteLines.length);
  const rowHeight = lines * LINE_HEIGHT + 6;
  const totalW = COLS.pa + COLS.box + COLS.text + COLS.notes;

  // outer rectangle
  page.drawRectangle({
    x: PAGE_MARGIN,
    y: y - rowHeight,
    width: totalW,
    height: rowHeight,
    borderColor: COLOR_BORDER,
    borderWidth: 0.5,
  });

  // vertical dividers
  const x1 = PAGE_MARGIN + COLS.pa;
  const x2 = x1 + COLS.box;
  const x3 = x2 + COLS.text;
  [x1, x2, x3].forEach((x) =>
    page.drawLine({
      start: { x, y },
      end: { x, y: y - rowHeight },
      color: COLOR_BORDER,
      thickness: 0.5,
    })
  );

  // checkbox square
  page.drawRectangle({
    x: PAGE_MARGIN + COLS.pa + 5,
    y: y - 10,
    width: 8,
    height: 8,
    borderColor: COLOR_TEXT,
    borderWidth: 0.6,
  });

  // wrapped texts
  drawWrappedText(page, x2 + 4, y - 10, leftText, font, FONT_SIZE, COLS.text - 8);
  drawWrappedText(page, x3 + 4, y - 10, rightText, font, FONT_SIZE, COLS.notes - 8);

  return rowHeight;
}

export async function exportFusedChecklistAsPdf(
  data: FusedChecklistData
): Promise<Uint8Array> {
  // ✅ FIX 1: Use dynamic require for fontkit (CJS-compatible)
  const fontkit = require("fontkit");

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // ✅ FIX 2: Embed Unicode font (supports é, à, œ, etc.)
  const fontPath = path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf");
  const fontBytes = fs.readFileSync(fontPath);
  const fontReg = await pdfDoc.embedFont(fontBytes, { subset: true });
  const fontBold = fontReg;

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const contentWidth = pageWidth - 2 * PAGE_MARGIN;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - PAGE_MARGIN;

  const addPage = (needed: number) => {
    if (y - needed < 80) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - PAGE_MARGIN;
    }
  };

  // HEADER
  page.drawText("ProCert", {
    x: PAGE_MARGIN,
    y,
    size: 18,
    font: fontBold,
    color: COLOR_TEXT,
  });
  page.drawText("Checklist d’audit supplémentaire", {
    x: PAGE_MARGIN + 90,
    y,
    size: 14,
    font: fontBold,
    color: COLOR_TEXT,
  });
  page.drawText("Directives Bio Suisse", {
    x: PAGE_MARGIN + 90,
    y: y - 16,
    size: 12,
    font: fontBold,
    color: COLOR_TEXT,
  });
  y -= 40;

  // AUDIT INFO TABLE
  const info = data.metadata?.auditInfo;
  const infoRows = [
    ["Date, lieu :", info?.dateLieu || "", "Auditeur(rice) :", info?.auditeur || ""],
    ["Entreprise :", info?.entreprise || "", "n° client :", info?.clientNumber || ""],
    ["Personne(s) auditée(s), avec fonction :", info?.personnesAudittees || "", "", ""],
    ["Type d’audit :", info?.typeAudit || "", "", ""],
  ];
  const half = contentWidth / 2;
  const rowH = LINE_HEIGHT + 6;
  for (const row of infoRows) {
    addPage(rowH + 6);
    page.drawRectangle({
      x: PAGE_MARGIN,
      y: y - rowH,
      width: half,
      height: rowH,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });
    page.drawRectangle({
      x: PAGE_MARGIN + half,
      y: y - rowH,
      width: half,
      height: rowH,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });
    page.drawText(`${row[0]} ${row[1]}`, {
      x: PAGE_MARGIN + 4,
      y: y - 10,
      size: FONT_SIZE,
      font: fontReg,
      color: COLOR_TEXT,
    });
    if (row[2])
      page.drawText(`${row[2]} ${row[3]}`, {
        x: PAGE_MARGIN + half + 4,
        y: y - 10,
        size: FONT_SIZE,
        font: fontReg,
        color: COLOR_TEXT,
      });
    y -= rowH;
  }

  y -= 15;

  // GROUP ITEMS BY SECTION
  const grouped: Record<string, typeof data.fusedItems> = {};
  data.fusedItems.forEach((it) => {
    const sec = it.item.section || "Général";
    grouped[sec] = grouped[sec] || [];
    grouped[sec].push(it);
  });

  // RENDER SECTIONS
  for (const [section, items] of Object.entries(grouped)) {
    addPage(40);
    page.drawText(section, {
      x: PAGE_MARGIN,
      y,
      size: 12,
      font: fontBold,
      color: COLOR_HEADER,
    });
    y -= 18;

    // header row (pa | box | text | notes)
    const headH = LINE_HEIGHT + 4;
    const totalW = COLS.pa + COLS.box + COLS.text + COLS.notes;
    page.drawRectangle({
      x: PAGE_MARGIN,
      y: y - headH,
      width: totalW,
      height: headH,
      borderColor: COLOR_TEXT,
      borderWidth: 0.6,
    });
    const x1 = PAGE_MARGIN + COLS.pa;
    const x2 = x1 + COLS.box;
    const x3 = x2 + COLS.text;
    [x1, x2, x3].forEach((x) =>
      page.drawLine({
        start: { x, y },
        end: { x, y: y - headH },
        color: COLOR_TEXT,
        thickness: 0.6,
      })
    );
    page.drawText("pa", { x: PAGE_MARGIN + 6, y: y - 9, size: FONT_SIZE, font: fontBold });
    page.drawText("R N E / Notes", {
      x: x3 + 4,
      y: y - 9,
      size: FONT_SIZE,
      font: fontBold,
    });
    y -= headH;

    // rows
    for (const { item, isFused } of items) {
      const rh = drawChecklistRow(page, y, item, fontReg);
      y -= rh;
      if (isFused) {
        page.drawText("[Item fusionné]", {
          x: PAGE_MARGIN + COLS.pa + COLS.box + 4,
          y: y - 8,
          size: 8,
          font: fontReg,
          color: COLOR_FUSED,
        });
        y -= 10;
      }
      addPage(rh + 10);
    }
    y -= 12;
  }

  // FOOTER
  pdfDoc.getPages().forEach((pg, idx) => {
    const size = 8;
    const color = rgb(0.4, 0.4, 0.4);
    const footerY = 30;
    const ref = `Ref. checklist d'audit suppl. Bio Suisse V2025_f.docx  Version: ${data.version} ${data.date}`;
    const refW = fontReg.widthOfTextAtSize(ref, size);

    pg.drawText(
      `Original: ProCert [ ] Des explications sont obligatoires Distributeur: copie sur demande Page ${idx + 1} / ${pdfDoc.getPageCount()}`,
      { x: PAGE_MARGIN, y: footerY + 18, size, font: fontReg, color }
    );
    pg.drawText(
      `ProCert Marktgasse 65 3011 Bern  Tel. 031/560 67 67  produkte@procert.ch`,
      { x: PAGE_MARGIN, y: footerY + 8, size, font: fontReg, color }
    );
    pg.drawText(ref, {
      x: pageWidth - PAGE_MARGIN - refW,
      y: footerY + 8,
      size,
      font: fontReg,
      color,
    });
  });

  return pdfDoc.save();
}
