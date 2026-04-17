import { jsPDF } from 'jspdf';
import { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } from '@/fonts/roboto-base64';
import { PRINT_COLORS } from '@/lib/reportHelpers';
import type { FullReportPayload } from '@/lib/api/siteFormula';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

const CLASS_LABELS: Record<string, string> = {
  start: 'Start',
  growth: 'Growth',
  scale: 'Scale',
};

function setupFonts(doc: jsPDF) {
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_BASE64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_BASE64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto', 'normal');
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function formatFieldName(key: string): string {
  return key.replace(/_/g, ' ');
}

function renderValue(doc: jsPDF, value: any, x: number, y: number, maxWidth: number): number {
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(PRINT_COLORS.text);

  if (typeof value === 'string') {
    const lines = doc.splitTextToSize(value, maxWidth);
    y = ensureSpace(doc, y, lines.length * 5);
    doc.text(lines, x, y);
    return y + lines.length * 5 + 2;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = typeof item === 'object' ? JSON.stringify(item) : String(item);
      const lines = doc.splitTextToSize(`• ${text}`, maxWidth - 4);
      y = ensureSpace(doc, y, lines.length * 5);
      doc.text(lines, x + 2, y);
      y += lines.length * 5 + 1;
    }
    return y + 1;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      y = ensureSpace(doc, y, 5);
      doc.setFont('Roboto', 'bold');
      doc.text(`${k}:`, x, y);
      doc.setFont('Roboto', 'normal');
      const valStr = String(v);
      const lines = doc.splitTextToSize(valStr, maxWidth - 30);
      doc.text(lines, x + 30, y);
      y += Math.max(5, lines.length * 5) + 1;
    }
    return y + 1;
  }
  y = ensureSpace(doc, y, 5);
  doc.text(String(value), x, y);
  return y + 5;
}

export async function generateSiteFormulaPdf(report: FullReportPayload): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  setupFonts(doc);

  // Cover header
  doc.setFillColor(PRINT_COLORS.accent);
  doc.rect(0, 0, PAGE_W, 30, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(20);
  doc.setTextColor('#ffffff');
  doc.text('OwnDev Site Formula', MARGIN, 18);
  doc.setFontSize(11);
  doc.setFont('Roboto', 'normal');
  doc.text('Архитектурный Blueprint', MARGIN, 25);

  let y = 42;

  // Project class badge
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(PRINT_COLORS.text);
  doc.text(`Класс проекта: ${CLASS_LABELS[report.project_class] || report.project_class}`, MARGIN, y);
  y += 8;

  // Metadata
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(PRINT_COLORS.text_secondary);
  const dt = new Date(report.metadata.generated_at).toLocaleDateString('ru-RU');
  doc.text(
    `Сгенерировано: ${dt}  •  Rules v${report.metadata.rules_version}  •  Template v${report.metadata.template_version}`,
    MARGIN,
    y
  );
  y += 8;

  // Sections
  for (const section of report.sections) {
    y = ensureSpace(doc, y, 14);
    doc.setFillColor(PRINT_COLORS.bg_header);
    doc.rect(MARGIN, y - 5, CONTENT_W, 9, 'F');
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(PRINT_COLORS.text);
    doc.text(section.title, MARGIN + 2, y + 1);
    y += 9;

    for (const [key, value] of Object.entries(section.content)) {
      y = ensureSpace(doc, y, 8);
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(PRINT_COLORS.text_secondary);
      doc.text(formatFieldName(key).toUpperCase(), MARGIN, y);
      y += 4;
      y = renderValue(doc, value, MARGIN, y, CONTENT_W);
      y += 1;
    }
    y += 4;
  }

  // Decision trace
  if (report.decision_trace_summary?.length) {
    y = ensureSpace(doc, y, 14);
    doc.setFillColor(PRINT_COLORS.bg_alt);
    doc.rect(MARGIN, y - 5, CONTENT_W, 9, 'F');
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(PRINT_COLORS.text);
    doc.text('Обоснование решений', MARGIN + 2, y + 1);
    y += 10;

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(PRINT_COLORS.text_secondary);
    for (const item of report.decision_trace_summary) {
      const lines = doc.splitTextToSize(item, CONTENT_W);
      y = ensureSpace(doc, y, lines.length * 4);
      doc.text(lines, MARGIN, y);
      y += lines.length * 4 + 1;
    }
  }

  // Footer on last page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(PRINT_COLORS.text_secondary);
    doc.text(`OwnDev.ru  •  Site Formula  •  ${i} / ${totalPages}`, MARGIN, PAGE_H - 6);
  }

  return doc.output('blob');
}
