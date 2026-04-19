import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, TableLayoutType,
  PageBreak, Header as DocxHeader, Footer as DocxFooter, PageNumber,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import {
  PRINT_COLORS, getSeverityLabel, formatDate, truncate,
} from './reportHelpers';
import type { ResultResponse, BreakdownJson, SubScore, CompetitorGapBlock, CompetitorBlock } from './marketplace-audit-types';

const P = PRINT_COLORS;
const W = {
  text: '1A1A1A', text_sec: '6B7280', accent: '7C3AED',
  bg_header: 'F3F4F6', bg_alt: 'F9FAFB', border: 'E5E7EB',
  critical: 'DC2626', high: 'EA580C', medium: 'CA8A04', low: '6B7280',
  success: '059669', info: '2563EB',
};

const SUB_LABELS: Record<keyof BreakdownJson, string> = {
  content: 'Контент',
  search: 'Поиск',
  conversion: 'Конверсия',
  ads: 'Реклама',
};

const platformLabel = (p: string) => (p === 'wb' ? 'Wildberries' : p === 'ozon' ? 'Ozon' : p);

function slugify(s: string): string {
  return (s || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9а-я]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'product';
}

function getCompetitorParts(c: ResultResponse['competitors']): { list: CompetitorBlock[]; gap: CompetitorGapBlock | null } {
  if (!c) return { list: [], gap: null };
  if (Array.isArray(c)) return { list: c, gap: null };
  return { list: c.list ?? [], gap: c.gap ?? null };
}

// ─────────────────────────────────────────────────
// PDF
// ─────────────────────────────────────────────────

async function initPdfDoc(): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } = await import('@/fonts/roboto-base64');
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_BASE64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_BASE64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto', 'normal');
  return doc;
}

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

export async function generateMarketplacePdf(result: ResultResponse): Promise<void> {
  const doc = await initPdfDoc();
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 15;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  const setFill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const setText = (hex: string) => doc.setTextColor(...hexToRgb(hex));

  const platform = platformLabel(result.platform);
  const product = result.product || ({} as ResultResponse['product']);
  const scores = (result.scores ?? {}) as any;
  const breakdown = (scores.breakdown ?? null) as BreakdownJson | null;
  const issues = result.issues ?? [];
  const recs = (result.recommendations ?? {}) as any;
  const keywords = result.keywords ?? { covered: [], missing: [], coveragePct: 0 };
  const { list: competitorsList, gap } = getCompetitorParts(result.competitors);

  const drawPageHeader = () => {
    setFill(P.bg_header);
    doc.rect(0, 0, PAGE_W, 10, 'F');
    setText(P.accent);
    doc.setFontSize(7);
    doc.setFont('Roboto', 'bold');
    doc.text('OWNDEV', MARGIN, 7);
    setText(P.text_secondary);
    doc.setFont('Roboto', 'normal');
    doc.text(`Marketplace Audit · ${platform}`, MARGIN + 22, 7);
    const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
    doc.text(`стр. ${pageNum}`, PAGE_W - MARGIN, 7, { align: 'right' });
    y = 14;
  };

  const newPage = () => { doc.addPage(); y = MARGIN; drawPageHeader(); };
  const checkBreak = (h: number) => { if (y + h > PAGE_H - 20) newPage(); };

  const sectionTitle = (title: string) => {
    checkBreak(14);
    setFill(P.bg_header);
    doc.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, 'F');
    setText(P.accent);
    doc.setFontSize(10);
    doc.setFont('Roboto', 'bold');
    doc.text(title, MARGIN + 4, y + 6);
    y += 13;
  };

  const paragraph = (text: string, opts?: { bold?: boolean; size?: number; color?: string }) => {
    if (!text) return;
    doc.setFont('Roboto', opts?.bold ? 'bold' : 'normal');
    doc.setFontSize(opts?.size ?? 9);
    setText(opts?.color ?? P.text);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    for (const line of lines) {
      checkBreak(5);
      doc.text(line, MARGIN, y);
      y += 5;
    }
    y += 1;
  };

  // ─── Title page
  setFill(P.accent);
  doc.rect(0, 0, PAGE_W, 2, 'F');

  y = 35;
  setText(P.accent);
  doc.setFontSize(28);
  doc.setFont('Roboto', 'bold');
  doc.text('OWNDEV', MARGIN, y);

  y += 8;
  setText(P.text_secondary);
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text(`Аудит карточки · ${platform}`, MARGIN, y);

  y += 20;
  setText(P.text);
  doc.setFontSize(18);
  doc.setFont('Roboto', 'bold');
  const titleLines = doc.splitTextToSize(product.title || 'Без названия', CONTENT_W);
  titleLines.slice(0, 3).forEach((l: string) => { doc.text(l, MARGIN, y); y += 8; });

  y += 4;
  setText(P.text_secondary);
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  if (product.category) doc.text(`Категория: ${product.category}`, MARGIN, y), y += 6;
  doc.text(`Дата: ${formatDate(new Date())}`, MARGIN, y); y += 6;
  doc.text(`ID аудита: ${result.id}`, MARGIN, y); y += 10;

  // Total score circle area
  const total = Math.round(scores.total ?? 0);
  setFill(P.accent);
  doc.roundedRect(MARGIN, y, CONTENT_W, 30, 4, 4, 'F');
  setText('#FFFFFF');
  doc.setFontSize(11);
  doc.setFont('Roboto', 'normal');
  doc.text('Общий балл', MARGIN + 6, y + 11);
  doc.setFontSize(28);
  doc.setFont('Roboto', 'bold');
  doc.text(`${total}/100`, MARGIN + 6, y + 24);
  y += 36;

  // Sub-scores table
  newPage();
  sectionTitle('Оценка по подразделам');
  autoTable(doc, {
    startY: y,
    head: [['Раздел', 'Вес', 'Балл']],
    body: [
      ['Контент', '30%', `${Math.round(scores.content ?? 0)}/100`],
      ['Поиск', '30%', `${Math.round(scores.search ?? 0)}/100`],
      ['Конверсия', '25%', `${Math.round(scores.conversion ?? 0)}/100`],
      ['Реклама', '15%', `${Math.round(scores.ads ?? 0)}/100`],
    ],
    theme: 'grid',
    styles: { font: 'Roboto', fontSize: 9, textColor: hexToRgb(P.text) },
    headStyles: { fillColor: hexToRgb(P.bg_header), textColor: hexToRgb(P.accent), fontStyle: 'bold' },
    margin: { left: MARGIN, right: MARGIN },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Score breakdown
  if (breakdown) {
    sectionTitle('Детальная разбивка факторов');
    (Object.keys(SUB_LABELS) as (keyof BreakdownJson)[]).forEach((key) => {
      const sub: SubScore | undefined = breakdown[key];
      if (!sub || !sub.factors?.length) return;
      paragraph(`${SUB_LABELS[key]} — ${Math.round(sub.score)}/100`, { bold: true, size: 11, color: P.accent });
      autoTable(doc, {
        startY: y,
        head: [['Фактор', 'Вес', 'Балл', 'Причина']],
        body: sub.factors.map(f => [
          f.name,
          `${Math.round((f.weight ?? 0) * 100)}%`,
          `${Math.round(f.score)}`,
          truncate(f.reason ?? '', 90),
        ]),
        theme: 'striped',
        styles: { font: 'Roboto', fontSize: 8, textColor: hexToRgb(P.text), cellPadding: 2 },
        headStyles: { fillColor: hexToRgb(P.bg_alt), textColor: hexToRgb(P.text), fontStyle: 'bold' },
        margin: { left: MARGIN, right: MARGIN },
        columnStyles: { 0: { cellWidth: 45 }, 1: { cellWidth: 15, halign: 'center' }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 'auto' } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
      if (sub.missingData?.length) {
        paragraph(`Недостаточно данных: ${sub.missingData.join(', ')}`, { size: 8, color: P.text_secondary });
      }
    });
  }

  // AI summary
  if (result.ai_summary) {
    sectionTitle('AI-резюме');
    paragraph(result.ai_summary);
  }

  // Issues
  if (issues.length) {
    sectionTitle('Найденные проблемы');
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...issues].sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0) || (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));
    autoTable(doc, {
      startY: y,
      head: [['Severity', 'Проблема', 'Что найдено', 'Как исправить']],
      body: sorted.map(i => [
        getSeverityLabel(i.severity),
        truncate(i.title ?? '', 60),
        truncate(i.found ?? '', 80),
        truncate(i.how_to_fix ?? '', 100),
      ]),
      theme: 'grid',
      styles: { font: 'Roboto', fontSize: 8, textColor: hexToRgb(P.text), cellPadding: 2 },
      headStyles: { fillColor: hexToRgb(P.bg_header), textColor: hexToRgb(P.accent), fontStyle: 'bold' },
      margin: { left: MARGIN, right: MARGIN },
      columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 45 }, 2: { cellWidth: 50 }, 3: { cellWidth: 'auto' } },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Rewrite suggestions
  if (recs?.newTitle) {
    sectionTitle('Рекомендации по переписыванию');
    paragraph('Новый title:', { bold: true, size: 10, color: P.accent });
    paragraph(recs.newTitle);
    if (recs.newDescription) {
      paragraph('Новое описание:', { bold: true, size: 10, color: P.accent });
      paragraph(recs.newDescription);
    }
    if (recs.bullets?.length) {
      paragraph('Bullets:', { bold: true, size: 10, color: P.accent });
      recs.bullets.forEach((b: string) => paragraph(`• ${b}`));
    }
    if (recs.addKeywords?.length) {
      paragraph(`Добавить ключи: ${recs.addKeywords.join(', ')}`, { size: 9 });
    }
    if (recs.removeWords?.length) {
      paragraph(`Удалить слова: ${recs.removeWords.join(', ')}`, { size: 9 });
    }
  }

  // Keywords
  if (keywords && (keywords.covered?.length || keywords.missing?.length)) {
    sectionTitle(`Покрытие ключевых слов — ${Math.round(keywords.coveragePct ?? 0)}%`);
    if (keywords.covered?.length) paragraph(`Покрыто: ${keywords.covered.join(', ')}`, { color: P.success });
    if (keywords.missing?.length) paragraph(`Отсутствует: ${keywords.missing.join(', ')}`, { color: P.high });
  }

  // Competitor gap
  if (gap) {
    sectionTitle('Отрыв от конкурентов');
    if (gap.weakerThan?.length) {
      paragraph('Где мы слабее:', { bold: true, color: P.high });
      gap.weakerThan.forEach(g => paragraph(`• ${g.aspect} — ${g.evidence}`));
    }
    if (gap.strongerThan?.length) {
      paragraph('Где мы сильнее:', { bold: true, color: P.success });
      gap.strongerThan.forEach(g => paragraph(`• ${g.aspect} — ${g.evidence}`));
    }
    if (gap.priorityAdds?.length) {
      paragraph('Что добавить в первую очередь:', { bold: true, color: P.accent });
      gap.priorityAdds.forEach(a => paragraph(`• ${a}`));
    }
  }
  if (competitorsList?.length) {
    paragraph('Конкуренты:', { bold: true, size: 10 });
    competitorsList.forEach(c => paragraph(`• ${c.title || c.url} (${c.score}/100)`));
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setText(P.text_secondary);
    doc.setFontSize(7);
    doc.setFont('Roboto', 'normal');
    doc.text('Сделано ❤️ в России 🇷🇺 · owndev.ru', PAGE_W / 2, PAGE_H - 6, { align: 'center' });
  }

  const fname = `owndev_marketplace_${result.platform}_${slugify(product.title)}.pdf`;
  doc.save(fname);
}

// ─────────────────────────────────────────────────
// Word
// ─────────────────────────────────────────────────

const wText = (text: string, opts?: { bold?: boolean; color?: string; size?: number }) =>
  new TextRun({ text, bold: opts?.bold, color: opts?.color || W.text, size: opts?.size || 20, font: 'Arial' });

const wPara = (text: string, opts?: { bold?: boolean; color?: string; size?: number; before?: number; after?: number }) =>
  new Paragraph({
    spacing: { before: opts?.before ?? 60, after: opts?.after ?? 60 },
    children: [wText(text, opts)],
  });

const wSection = (text: string) =>
  new Paragraph({
    spacing: { before: 360, after: 180 },
    shading: { type: ShadingType.CLEAR, color: W.bg_header, fill: W.bg_header },
    indent: { left: convertInchesToTwip(0.1) },
    children: [wText(text, { bold: true, color: W.accent, size: 28 })],
  });

const wSub = (text: string) =>
  new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [wText(text, { bold: true, color: W.accent, size: 24 })],
  });

const wTable = (headers: string[], rows: string[][], colWidths: number[]): Table => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, color: W.bg_header, fill: W.bg_header },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [wText(h, { bold: true, size: 18 })] })],
    })),
  });
  const dataRows = rows.map((row, idx) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      width: { size: colWidths[ci], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, color: idx % 2 === 0 ? 'FFFFFF' : W.bg_alt, fill: idx % 2 === 0 ? 'FFFFFF' : W.bg_alt },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [wText(cell, { size: 17 })] })],
    })),
  }));
  return new Table({ layout: TableLayoutType.FIXED, width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
};

export async function generateMarketplaceWord(result: ResultResponse): Promise<void> {
  const platform = platformLabel(result.platform);
  const product = result.product || ({} as ResultResponse['product']);
  const scores = (result.scores ?? {}) as any;
  const breakdown = (scores.breakdown ?? null) as BreakdownJson | null;
  const issues = result.issues ?? [];
  const recs = (result.recommendations ?? {}) as any;
  const keywords = result.keywords ?? { covered: [], missing: [], coveragePct: 0 };
  const { list: competitorsList, gap } = getCompetitorParts(result.competitors);

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [wText('OWNDEV', { bold: true, color: W.accent, size: 56 })],
  }));
  children.push(wPara(`Аудит карточки · ${platform}`, { color: W.text_sec, size: 22 }));
  children.push(wPara(formatDate(new Date()), { color: W.text_sec, size: 18 }));
  children.push(new Paragraph({ spacing: { before: 360 }, children: [wText(product.title || 'Без названия', { bold: true, size: 36 })] }));
  if (product.category) children.push(wPara(`Категория: ${product.category}`, { color: W.text_sec }));
  children.push(wPara(`ID: ${result.id}`, { color: W.text_sec, size: 16 }));

  // Total
  children.push(wSection(`Общий балл: ${Math.round(scores.total ?? 0)}/100`));

  // Sub-scores
  children.push(wSection('Оценка по подразделам'));
  children.push(wTable(
    ['Раздел', 'Вес', 'Балл'],
    [
      ['Контент', '30%', `${Math.round(scores.content ?? 0)}/100`],
      ['Поиск', '30%', `${Math.round(scores.search ?? 0)}/100`],
      ['Конверсия', '25%', `${Math.round(scores.conversion ?? 0)}/100`],
      ['Реклама', '15%', `${Math.round(scores.ads ?? 0)}/100`],
    ],
    [50, 25, 25],
  ));

  // Breakdown
  if (breakdown) {
    children.push(wSection('Детальная разбивка факторов'));
    (Object.keys(SUB_LABELS) as (keyof BreakdownJson)[]).forEach((key) => {
      const sub = breakdown[key];
      if (!sub || !sub.factors?.length) return;
      children.push(wSub(`${SUB_LABELS[key]} — ${Math.round(sub.score)}/100`));
      children.push(wTable(
        ['Фактор', 'Вес', 'Балл', 'Причина'],
        sub.factors.map(f => [f.name, `${Math.round((f.weight ?? 0) * 100)}%`, `${Math.round(f.score)}`, truncate(f.reason ?? '', 120)]),
        [30, 10, 10, 50],
      ));
      if (sub.missingData?.length) {
        children.push(wPara(`Недостаточно данных: ${sub.missingData.join(', ')}`, { color: W.text_sec, size: 16 }));
      }
    });
  }

  // AI summary
  if (result.ai_summary) {
    children.push(wSection('AI-резюме'));
    children.push(wPara(result.ai_summary));
  }

  // Issues
  if (issues.length) {
    children.push(wSection('Найденные проблемы'));
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...issues].sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0) || (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));
    children.push(wTable(
      ['Severity', 'Проблема', 'Что найдено', 'Как исправить'],
      sorted.map(i => [
        getSeverityLabel(i.severity),
        truncate(i.title ?? '', 80),
        truncate(i.found ?? '', 100),
        truncate(i.how_to_fix ?? '', 140),
      ]),
      [12, 28, 30, 30],
    ));
  }

  // Rewrite
  if (recs?.newTitle) {
    children.push(wSection('Рекомендации по переписыванию'));
    children.push(wSub('Новый title'));
    children.push(wPara(recs.newTitle));
    if (recs.newDescription) {
      children.push(wSub('Новое описание'));
      children.push(wPara(recs.newDescription));
    }
    if (recs.bullets?.length) {
      children.push(wSub('Bullets'));
      recs.bullets.forEach((b: string) => children.push(wPara(`• ${b}`)));
    }
    if (recs.addKeywords?.length) children.push(wPara(`Добавить ключи: ${recs.addKeywords.join(', ')}`, { bold: true }));
    if (recs.removeWords?.length) children.push(wPara(`Удалить слова: ${recs.removeWords.join(', ')}`, { bold: true }));
  }

  // Keywords
  if (keywords && (keywords.covered?.length || keywords.missing?.length)) {
    children.push(wSection(`Покрытие ключевых слов — ${Math.round(keywords.coveragePct ?? 0)}%`));
    if (keywords.covered?.length) children.push(wPara(`Покрыто: ${keywords.covered.join(', ')}`, { color: W.success }));
    if (keywords.missing?.length) children.push(wPara(`Отсутствует: ${keywords.missing.join(', ')}`, { color: W.high }));
  }

  // Competitor gap
  if (gap) {
    children.push(wSection('Отрыв от конкурентов'));
    if (gap.weakerThan?.length) {
      children.push(wSub('Где мы слабее'));
      gap.weakerThan.forEach(g => children.push(wPara(`• ${g.aspect} — ${g.evidence}`)));
    }
    if (gap.strongerThan?.length) {
      children.push(wSub('Где мы сильнее'));
      gap.strongerThan.forEach(g => children.push(wPara(`• ${g.aspect} — ${g.evidence}`)));
    }
    if (gap.priorityAdds?.length) {
      children.push(wSub('Добавить в первую очередь'));
      gap.priorityAdds.forEach(a => children.push(wPara(`• ${a}`)));
    }
  }
  if (competitorsList?.length) {
    children.push(wSub('Конкуренты'));
    competitorsList.forEach(c => children.push(wPara(`• ${c.title || c.url} (${c.score}/100)`)));
  }

  const docx = new Document({
    sections: [{
      headers: {
        default: new DocxHeader({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [wText(`OWNDEV · Marketplace Audit · ${platform}`, { color: W.text_sec, size: 16 })],
          })],
        }),
      },
      footers: {
        default: new DocxFooter({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              wText('Сделано ❤️ в России 🇷🇺 · owndev.ru · стр. ', { color: W.text_sec, size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], color: W.text_sec, size: 16, font: 'Arial' }),
            ],
          })],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(docx);
  const fname = `owndev_marketplace_${result.platform}_${slugify(product.title)}.docx`;
  saveAs(blob, fname);
}
