import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PRINT_COLORS, getSeverityColor, getSeverityLabel,
  getCategoryLabel, getScoreStatus,
  calcPotentialGain, formatDate, truncate,
  ReportData,
} from './reportHelpers';

const P = PRINT_COLORS;

async function initDoc(): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } = await import('@/fonts/roboto-base64');
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_BASE64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_BASE64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto', 'normal');
  return doc;
}

export async function generatePdfReport(data: ReportData): Promise<void> {
  const doc = await initDoc();

  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 15;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const setFill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const setTextColor = (hex: string) => doc.setTextColor(...hexToRgb(hex));

  const drawPageHeader = () => {
    setFill(P.bg_header);
    doc.rect(0, 0, PAGE_W, 10, 'F');
    setTextColor(P.accent);
    doc.setFontSize(7);
    doc.setFont('Roboto', 'bold');
    doc.text('OWNDEV', MARGIN, 7);
    setTextColor(P.text_secondary);
    doc.setFont('Roboto', 'normal');
    doc.text(`GEO и AI-ready аудит · ${data.domain}`, MARGIN + 18, 7);
    doc.text(`стр. ${(doc as any).internal.getCurrentPageInfo().pageNumber}`, PAGE_W - MARGIN, 7, { align: 'right' });
    y = 14;
  };

  const newPage = () => {
    doc.addPage();
    y = MARGIN;
    drawPageHeader();
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > PAGE_H - 20) newPage();
  };

  const drawLine = (color = P.border) => {
    doc.setDrawColor(...hexToRgb(color));
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 4;
  };

  const drawSectionTitle = (title: string) => {
    checkPageBreak(14);
    setFill(P.bg_header);
    doc.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, 'F');
    setTextColor(P.accent);
    doc.setFontSize(10);
    doc.setFont('Roboto', 'bold');
    doc.text(title, MARGIN + 4, y + 6);
    y += 13;
  };

  // ─── СТРАНИЦА 1: ТИТУЛЬНЫЙ ЛИСТ ──────────────────
  // White background (default)
  setFill(P.accent);
  doc.rect(0, 0, PAGE_W, 2, 'F');

  y = 35;
  setTextColor(P.accent);
  doc.setFontSize(28);
  doc.setFont('Roboto', 'bold');
  doc.text('OWNDEV', MARGIN, y);

  y += 8;
  setTextColor(P.text_secondary);
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text('GEO и AI-ready аудит сайта', MARGIN, y);

  y += 6;
  setFill(P.accent);
  doc.rect(MARGIN, y, 40, 0.5, 'F');

  y += 16;
  setTextColor(P.text);
  doc.setFontSize(20);
  doc.setFont('Roboto', 'bold');
  doc.text('Отчёт аудита сайта', MARGIN, y);

  y += 10;
  setTextColor(P.accent);
  doc.setFontSize(13);
  doc.text(truncate(data.url, 60), MARGIN, y);

  y += 8;
  setTextColor(P.text_secondary);
  doc.setFontSize(9);
  doc.text(`Тематика: ${data.theme}`, MARGIN, y);
  y += 5;
  doc.text(`Дата аудита: ${formatDate(new Date(data.scanDate))}`, MARGIN, y);

  // Score cards as a simple table
  y += 20;
  const scoreCards = [
    { label: 'Общий', value: data.scores.total },
    { label: 'SEO', value: data.scores.seo },
    { label: 'Директ', value: data.scores.direct },
    { label: 'Schema', value: data.scores.schema },
    { label: 'AI', value: data.scores.ai },
  ];
  const cardW = CONTENT_W / 5;

  scoreCards.forEach((card, i) => {
    const x = MARGIN + i * cardW;
    const status = getScoreStatus(card.value);
    setFill(P.bg_header);
    doc.roundedRect(x + 1, y, cardW - 2, 28, 3, 3, 'F');
    doc.setDrawColor(...hexToRgb(P.border));
    doc.setLineWidth(0.3);
    doc.roundedRect(x + 1, y, cardW - 2, 28, 3, 3, 'S');
    doc.setTextColor(...hexToRgb(status.color));
    doc.setFontSize(20);
    doc.setFont('Roboto', 'bold');
    doc.text(String(card.value), x + cardW / 2, y + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('Roboto', 'normal');
    setTextColor(P.text_secondary);
    doc.text(card.label, x + cardW / 2, y + 18, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(...hexToRgb(status.color));
    doc.text(status.label, x + cardW / 2, y + 24, { align: 'center' });
  });
  y += 36;

  const gain = calcPotentialGain(data.issues);
  const critCount = data.issues.filter((i: any) => i.severity === 'critical').length;

  setFill(P.bg_header);
  doc.roundedRect(MARGIN, y, CONTENT_W, 12, 2, 2, 'F');
  setTextColor(P.text_secondary);
  doc.setFontSize(8);
  doc.setFont('Roboto', 'normal');
  doc.text(
    `Найдено ${data.issues.length} проблем · ${critCount} критических · Устраните критические → оценка вырастет на ~+${gain} баллов`,
    MARGIN + 4, y + 7.5,
  );

  y = PAGE_H - 25;
  drawLine(P.border);
  setTextColor(P.text_secondary);
  doc.setFontSize(7);
  doc.text('Сгенерировано сервисом OWNDEV.ru — первый GEO и AI-ready аудит в Рунете', MARGIN, y);
  y += 4;
  doc.text('Следующий аудит рекомендуется через 30 дней', MARGIN, y);

  // ─── СТРАНИЦА 2: ТЕХНИЧЕСКИЙ ПАСПОРТ ─────────────
  newPage();
  drawSectionTitle('ТЕХНИЧЕСКИЙ ПАСПОРТ САЙТА');

  const seo = data.seoData || {};
  const passportRows: string[][] = [
    ['Title', truncate(seo.title || 'Не найден', 45), seo.title ? (seo.titleLength >= 50 && seo.titleLength <= 65 ? '✓ OK' : '⚠ Не норма') : '✗ Отсутствует', '50–65 симв.'],
    ['Description', truncate(seo.description || 'Не найден', 45), seo.description ? (seo.descriptionLength >= 120 && seo.descriptionLength <= 160 ? '✓ OK' : '⚠ Не норма') : '✗ Отсутствует', '120–160 симв.'],
    ['H1 заголовок', truncate(seo.h1 || 'Не найден', 45), seo.h1 ? '✓ Есть' : '✗ Отсутствует', '1 штука'],
    ['Кол-во H1', String(seo.h1Count || 0), seo.h1Count === 1 ? '✓ OK' : '✗ Ошибка', 'Ровно 1'],
    ['Заголовков H2', String(seo.h2Count || 0), seo.h2Count >= 3 ? '✓ OK' : '⚠ Мало', '3–10'],
    ['Объём контента', seo.wordCount ? `${seo.wordCount} слов` : '—', seo.wordCount >= 500 ? '✓ OK' : '✗ Мало', '500+ слов'],
    ['Canonical', seo.canonical ? truncate(seo.canonical, 40) : 'Отсутствует', seo.canonical ? '✓ Есть' : '⚠ Нет', 'Обязателен'],
    ['og:title', seo.ogTitle ? '✓ Есть' : 'Отсутствует', seo.ogTitle ? '✓ OK' : '⚠ Нет', 'Рекомендован'],
    ['og:image', seo.ogImage ? '✓ Есть' : 'Отсутствует', seo.ogImage ? '✓ OK' : '⚠ Нет', 'Рекомендован'],
    ['Изображений без alt', String(seo.imagesWithoutAlt || 0), seo.imagesWithoutAlt === 0 ? '✓ OK' : '✗ Ошибка', '0'],
    ['Schema.org', seo.hasSchema ? (seo.schemaTypes?.join(', ') || 'Есть') : 'Отсутствует', seo.hasSchema ? '✓ Есть' : '✗ Нет', 'Обязательна'],
    ['FAQ разметка', seo.hasFaq ? 'Есть' : 'Отсутствует', seo.hasFaq ? '✓ Есть' : '⚠ Нет', 'Рекомендована'],
    ['lang атрибут', seo.lang || 'Не задан', seo.lang ? '✓ Есть' : '⚠ Нет', 'ru'],
    ['llms.txt', seo.hasLlmsTxt ? 'Есть' : 'Отсутствует', seo.hasLlmsTxt ? '✓ Есть' : '✗ Нет (−20 LLM)', 'Для AI-выдачи'],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Параметр', 'Значение', 'Статус', 'Норма']],
    body: passportRows,
    margin: { left: MARGIN, right: MARGIN },
    styles: { font: 'Roboto',
      fontSize: 7.5, cellPadding: 2.5,
      fillColor: hexToRgb(P.bg),
      textColor: hexToRgb(P.text),
      lineColor: hexToRgb(P.border), lineWidth: 0.3,
    },
    headStyles: { font: 'Roboto',
      fillColor: hexToRgb(P.bg_header),
      textColor: hexToRgb(P.text),
      fontSize: 8, fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 70 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
    },
    didParseCell: (hookData: any) => {
      if (hookData.column.index === 2 && hookData.section === 'body') {
        const val = String(hookData.cell.raw || '');
        if (val.startsWith('✓')) hookData.cell.styles.textColor = hexToRgb(P.success);
        else if (val.startsWith('✗')) hookData.cell.styles.textColor = hexToRgb(P.critical);
        else if (val.startsWith('⚠')) hookData.cell.styles.textColor = hexToRgb(P.medium);
      }
      if (hookData.section === 'body' && hookData.row.index % 2 === 1) {
        hookData.cell.styles.fillColor = hexToRgb(P.bg_alt);
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ─── ПЛАН ИСПРАВЛЕНИЯ ───────────────────────────
  newPage();
  drawSectionTitle(`ПЛАН ИСПРАВЛЕНИЯ — ${data.issues.length} ПРОБЛЕМ`);

  setTextColor(P.text_secondary);
  doc.setFontSize(8);
  doc.text(`Исправьте ${critCount} критических ошибок → оценка вырастет примерно на +${gain} баллов`, MARGIN, y);
  y += 8;

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedIssues = [...data.issues].sort((a: any, b: any) =>
    (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3),
  );

  sortedIssues.forEach((issue: any, idx: number) => {
    const severityColor = getSeverityColor(issue.severity);
    checkPageBreak(45);

    // Header bar
    setFill(P.bg_header);
    doc.roundedRect(MARGIN, y, CONTENT_W, 6, 1, 1, 'F');
    doc.setFillColor(...hexToRgb(severityColor));
    doc.rect(MARGIN, y, 2, 6, 'F');

    doc.setFontSize(6);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(...hexToRgb(severityColor));
    doc.text(`${idx + 1}. [${getSeverityLabel(issue.severity).toUpperCase()}]`, MARGIN + 4, y + 4);
    setTextColor(P.text_secondary);
    doc.setFont('Roboto', 'normal');
    doc.text(getCategoryLabel(issue.category || issue.module || ''), MARGIN + 32, y + 4);
    doc.setTextColor(...hexToRgb(P.success));
    doc.text(`+${issue.impact_score || 0} балл.`, PAGE_W - MARGIN - 2, y + 4, { align: 'right' });
    y += 8;

    // Title
    setTextColor(P.text);
    doc.setFontSize(9);
    doc.setFont('Roboto', 'bold');
    const titleLines = doc.splitTextToSize(issue.title || 'Ошибка', CONTENT_W);
    doc.text(titleLines, MARGIN, y);
    y += titleLines.length * 4 + 2;

    if (issue.where || issue.location) {
      setTextColor(P.text_secondary);
      doc.setFontSize(7);
      doc.setFont('Roboto', 'normal');
      doc.text(`Где: ${issue.where || issue.location}`, MARGIN, y);
      y += 4;
    }

    if (issue.description) {
      setTextColor(P.text_secondary);
      doc.setFontSize(7.5);
      doc.setFont('Roboto', 'normal');
      const descLines = doc.splitTextToSize(issue.description, CONTENT_W);
      doc.text(descLines, MARGIN, y);
      y += descLines.length * 3.5 + 3;
    }

    if (issue.why_important || issue.why_it_matters) {
      checkPageBreak(20);
      setFill(P.bg_alt);
      doc.roundedRect(MARGIN, y, CONTENT_W, 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('Roboto', 'bold');
      doc.setTextColor(...hexToRgb(P.medium));
      doc.text('ПОЧЕМУ ЭТО ВАЖНО:', MARGIN + 2, y + 3.5);
      y += 7;
      setTextColor(P.text);
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(7.5);
      const whyLines = doc.splitTextToSize(issue.why_important || issue.why_it_matters, CONTENT_W - 4);
      checkPageBreak(whyLines.length * 3.5 + 4);
      doc.text(whyLines, MARGIN + 2, y);
      y += whyLines.length * 3.5 + 4;
    }

    if (issue.how_to_fix) {
      checkPageBreak(20);
      setFill(P.bg_alt);
      doc.roundedRect(MARGIN, y, CONTENT_W, 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('Roboto', 'bold');
      doc.setTextColor(...hexToRgb(P.success));
      doc.text('КАК ИСПРАВИТЬ:', MARGIN + 2, y + 3.5);
      y += 7;
      const steps = (issue.how_to_fix as string).split('\n').filter((s: string) => s.trim());
      steps.forEach((step: string) => {
        const stepLines = doc.splitTextToSize(step.trim(), CONTENT_W - 6);
        checkPageBreak(stepLines.length * 3.5 + 2);
        setTextColor(P.text);
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(7.5);
        doc.text(stepLines, MARGIN + 4, y);
        y += stepLines.length * 3.5 + 1.5;
      });
      y += 2;
    }

    if (issue.example || issue.example_fix) {
      const exampleText = issue.example || issue.example_fix;
      checkPageBreak(20);
      setFill(P.bg_alt);
      const exLines = doc.splitTextToSize(exampleText, CONTENT_W - 8);
      const exHeight = exLines.length * 3.5 + 6;
      checkPageBreak(exHeight + 6);
      doc.roundedRect(MARGIN, y, CONTENT_W, exHeight, 2, 2, 'F');
      doc.setDrawColor(...hexToRgb(P.border));
      doc.setLineWidth(0.3);
      doc.roundedRect(MARGIN, y, CONTENT_W, exHeight, 2, 2, 'S');
      doc.setFontSize(6.5);
      doc.setFont('Roboto', 'normal');
      setTextColor(P.text);
      doc.text(exLines, MARGIN + 4, y + 4);
      y += exHeight + 4;
    }

    y += 5;
  });

  // ─── АНАЛИЗ КОНКУРЕНТОВ ────────────────
  const competitors = data.competitors.filter((c: any) => c._type === 'competitor');
  const comparison = data.comparisonTable;

  if (competitors.length > 0) {
    newPage();
    drawSectionTitle('АНАЛИЗ КОНКУРЕНТОВ');

    if (comparison) {
      const summaryData = [
        ['Ваш контент', `${comparison.your_site?.content_length_words || 0} слов`],
        ['Среднее у конкурентов', `${comparison.avg_top10?.content_length_words || 0} слов`],
        ['Лидер в выдаче', `${comparison.leader?.content_length_words || 0} слов`],
      ];
      summaryData.forEach((item, i) => {
        const x = MARGIN + i * (CONTENT_W / 3);
        setFill(i === 0 ? P.bg_header : P.bg_alt);
        doc.roundedRect(x + 1, y, CONTENT_W / 3 - 2, 14, 2, 2, 'F');
        doc.setDrawColor(...hexToRgb(P.border));
        doc.roundedRect(x + 1, y, CONTENT_W / 3 - 2, 14, 2, 2, 'S');
        setTextColor(P.text_secondary);
        doc.setFontSize(6.5);
        doc.text(item[0], x + 4, y + 5);
        setTextColor(i === 0 ? P.accent : P.text);
        doc.setFontSize(9);
        doc.setFont('Roboto', 'bold');
        doc.text(item[1], x + 4, y + 11);
      });
      y += 18;
    }

    const compRows = competitors.map((c: any) => [
      `#${c.position} ${c.domain}`,
      String(c.content_length_words || 0),
      String(c.h2_count || 0),
      c.has_faq ? '✓' : '✗',
      c.has_price_block ? '✓' : '✗',
      c.has_reviews ? '✓' : '✗',
      c.has_schema ? '✓' : '✗',
      c.has_video ? '✓' : '✗',
      (c.top_phrases || []).slice(0, 2).join(' / ') || '—',
    ]);

    compRows.unshift([
      `★ ${data.domain}`,
      String(comparison?.your_site?.content_length_words || '—'),
      String(data.seoData?.h2Count || '—'),
      data.seoData?.hasFaq ? '✓' : '✗',
      data.seoData?.hasPriceBlock ? '✓' : '✗',
      data.seoData?.hasReviews ? '✓' : '✗',
      data.seoData?.hasSchema ? '✓' : '✗',
      data.seoData?.hasVideo ? '✓' : '✗',
      '← ваш сайт',
    ]);

    if (comparison) {
      compRows.push([
        'СРЕДНЕЕ',
        String(comparison.avg_top10?.content_length_words || 0),
        String(comparison.avg_top10?.h2_count || 0),
        comparison.avg_top10?.has_faq ? '✓' : '—',
        comparison.avg_top10?.has_price_block ? '✓' : '—',
        comparison.avg_top10?.has_reviews ? '✓' : '—',
        comparison.avg_top10?.has_schema ? '✓' : '—',
        comparison.avg_top10?.has_video ? '✓' : '—',
        '← среднее',
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [['Сайт', 'Слов', 'H2', 'FAQ', 'Цены', 'Отзывы', 'Schema', 'Видео', 'Фразы']],
      body: compRows,
      margin: { left: MARGIN, right: MARGIN },
      styles: { font: 'Roboto',
        fontSize: 6.5, cellPadding: 2,
        fillColor: hexToRgb(P.bg),
        textColor: hexToRgb(P.text),
        lineColor: hexToRgb(P.border), lineWidth: 0.2,
        overflow: 'ellipsize' as any,
      },
      headStyles: { font: 'Roboto',
        fillColor: hexToRgb(P.bg_header), fontSize: 7, fontStyle: 'bold',
        textColor: hexToRgb(P.text),
      },
      columnStyles: {
        0: { cellWidth: 38 }, 1: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 10, halign: 'center' }, 3: { cellWidth: 10, halign: 'center' },
        4: { cellWidth: 10, halign: 'center' }, 5: { cellWidth: 14, halign: 'center' },
        6: { cellWidth: 14, halign: 'center' }, 7: { cellWidth: 10, halign: 'center' },
        8: { cellWidth: 50 },
      },
      didParseCell: (hookData: any) => {
        if (hookData.row.index === 0 && hookData.section === 'body') {
          hookData.cell.styles.fillColor = hexToRgb(P.bg_header);
          hookData.cell.styles.fontStyle = 'bold';
        }
        if (hookData.row.index === compRows.length - 1 && hookData.section === 'body') {
          hookData.cell.styles.fillColor = hexToRgb(P.bg_alt);
          hookData.cell.styles.textColor = hexToRgb(P.info);
        }
        const val = String(hookData.cell.raw || '');
        if (val === '✓') hookData.cell.styles.textColor = hexToRgb(P.success);
        else if (val === '✗') hookData.cell.styles.textColor = hexToRgb(P.critical);
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    if (comparison?.insights?.length) {
      checkPageBreak(30);
      drawSectionTitle('ЧТО ВЗЯТЬ У КОНКУРЕНТОВ');
      comparison.insights.forEach((insight: string) => {
        checkPageBreak(12);
        setFill(P.bg_alt);
        const insightLines = doc.splitTextToSize(insight, CONTENT_W - 6);
        const h = insightLines.length * 4 + 4;
        doc.roundedRect(MARGIN, y, CONTENT_W, h, 2, 2, 'F');
        doc.setFontSize(7.5);
        setTextColor(P.text);
        doc.setFont('Roboto', 'normal');
        doc.text(insightLines, MARGIN + 3, y + 4.5);
        y += h + 3;
      });
    }
  }

  // ─── СЕМАНТИЧЕСКОЕ ЯДРО ────────────────
  if (data.keywords.length > 0) {
    newPage();
    drawSectionTitle(`СЕМАНТИЧЕСКОЕ ЯДРО — ${data.keywords.length} ЗАПРОСОВ`);

    const commercialKeys = data.keywords.filter((k: any) => k.intent === 'commercial' || k.intent === 'transactional');
    const infoKeys = data.keywords.filter((k: any) => k.intent === 'informational');
    const landingKeys = data.keywords.filter((k: any) => k.landing_needed === true);

    setTextColor(P.text_secondary);
    doc.setFontSize(8);
    doc.text(
      `Коммерческих: ${commercialKeys.length}  ·  Информационных: ${infoKeys.length}  ·  Требуют лендинга: ${landingKeys.length}`,
      MARGIN, y,
    );
    y += 8;

    const sortedKw = [...data.keywords]
      .sort((a: any, b: any) => (b.frequency || b.volume || 0) - (a.frequency || a.volume || 0))
      .slice(0, 100);

    const kwRows = sortedKw.map((k: any) => [
      k.phrase || k.keyword || '',
      k.cluster || '',
      k.intent === 'commercial' ? 'Коммер.' : k.intent === 'transactional' ? 'Трансак.' : k.intent === 'informational' ? 'Инфо.' : 'Навигац.',
      (k.frequency || k.volume) ? (k.frequency || k.volume).toLocaleString('ru-RU') : '—',
      k.landing_needed ? 'Да' : 'Нет',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Запрос', 'Кластер', 'Интент', 'Частота', 'Лендинг']],
      body: kwRows,
      margin: { left: MARGIN, right: MARGIN },
      styles: { font: 'Roboto',
        fontSize: 7, cellPadding: 2,
        fillColor: hexToRgb(P.bg),
        textColor: hexToRgb(P.text),
        lineColor: hexToRgb(P.border), lineWidth: 0.2,
      },
      headStyles: { font: 'Roboto', fillColor: hexToRgb(P.bg_header), fontSize: 7.5, fontStyle: 'bold', textColor: hexToRgb(P.text) },
      columnStyles: {
        0: { cellWidth: 75 }, 1: { cellWidth: 45 },
        2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 18, halign: 'center' },
      },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.row.index % 2 === 1) {
          hookData.cell.styles.fillColor = hexToRgb(P.bg_alt);
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    if (data.keywords.length > 100) {
      setTextColor(P.text_secondary);
      doc.setFontSize(7);
      doc.text(`* Показаны топ-100 из ${data.keywords.length} запросов. Полный список — в CSV.`, MARGIN, y);
    }
  }

  // ─── МИНУС-СЛОВА ────────────────────────
  if (data.minusWords.length > 0) {
    newPage();
    drawSectionTitle(`МИНУС-СЛОВА ДЛЯ ЯНДЕКС.ДИРЕКТ — ${data.minusWords.length}`);

    setTextColor(P.text_secondary);
    doc.setFontSize(8);
    doc.text('Добавьте эти слова на уровне аккаунта в Яндекс.Директ.', MARGIN, y);
    y += 8;

    const minusGroups: Record<string, any[]> = {};
    data.minusWords.forEach((w: any) => {
      const cat = w.category || w.type || 'other';
      if (!minusGroups[cat]) minusGroups[cat] = [];
      minusGroups[cat].push(w);
    });

    const catNames: Record<string, string> = {
      informational: 'Информационные запросы',
      irrelevant: 'Нерелевантные слова',
      competitor: 'Конкуренты',
      geo: 'Нецелевые регионы',
      other: 'Прочие',
      general: 'Общие',
    };

    Object.entries(minusGroups).forEach(([cat, words]) => {
      checkPageBreak(20);
      setFill(P.bg_header);
      doc.roundedRect(MARGIN, y, CONTENT_W, 7, 1, 1, 'F');
      setTextColor(P.accent);
      doc.setFontSize(8);
      doc.setFont('Roboto', 'bold');
      doc.text(`${catNames[cat] || cat} (${words.length})`, MARGIN + 3, y + 5);
      y += 10;
      const wordsText = words.map((w: any) => `-${w.word}`).join('  ');
      setTextColor(P.text);
      doc.setFontSize(7.5);
      doc.setFont('Roboto', 'normal');
      const wordLines = doc.splitTextToSize(wordsText, CONTENT_W);
      checkPageBreak(wordLines.length * 3.5 + 4);
      doc.text(wordLines, MARGIN, y);
      y += wordLines.length * 3.5 + 6;
    });
  }

  // ─── ПРИОРИТЕТНЫЙ ПЛАН ДЕЙСТВИЙ ────
  newPage();
  drawSectionTitle('ПРИОРИТЕТНЫЙ ПЛАН ДЕЙСТВИЙ');

  setTextColor(P.text_secondary);
  doc.setFontSize(8);
  doc.text('Выполните эти шаги последовательно — и сайт выйдет в топ.', MARGIN, y);
  y += 8;

  const topIssues = [...sortedIssues]
    .sort((a: any, b: any) => (b.impact_score || 0) - (a.impact_score || 0))
    .slice(0, 10);

  topIssues.forEach((issue: any, idx: number) => {
    checkPageBreak(16);
    const sevColor = getSeverityColor(issue.severity);
    setFill(P.bg_alt);
    doc.roundedRect(MARGIN, y, CONTENT_W, 12, 2, 2, 'F');
    doc.setDrawColor(...hexToRgb(P.border));
    doc.roundedRect(MARGIN, y, CONTENT_W, 12, 2, 2, 'S');
    doc.setFillColor(...hexToRgb(sevColor));
    doc.rect(MARGIN, y, 2, 12, 'F');
    setTextColor(P.text_secondary);
    doc.setFontSize(8);
    doc.setFont('Roboto', 'bold');
    doc.text(`${idx + 1}.`, MARGIN + 4, y + 8);
    setTextColor(P.text);
    const titleText = doc.splitTextToSize(issue.title || '', CONTENT_W - 40);
    doc.text(titleText, MARGIN + 12, y + 5);
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(P.success));
    doc.text(`+${issue.impact_score || 0} б.`, PAGE_W - MARGIN - 2, y + 5, { align: 'right' });
    doc.setTextColor(...hexToRgb(sevColor));
    doc.text(getSeverityLabel(issue.severity), PAGE_W - MARGIN - 2, y + 10, { align: 'right' });
    y += 14;
  });

  y += 4;
  checkPageBreak(30);
  setFill(P.accent);
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, 'F');
  setTextColor('#ffffff');
  doc.setFontSize(9);
  doc.setFont('Roboto', 'bold');
  doc.text('Следующий шаг:', MARGIN + 6, y + 8);
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8);
  doc.text('Запустите повторный аудит через 30 дней на OWNDEV.ru', MARGIN + 6, y + 14);
  doc.setFontSize(7);
  doc.text('OWNDEV.ru — первый GEO и AI-ready аудит сайта в Рунете', MARGIN + 6, y + 20);

  y += 28;
  drawLine(P.border);
  setTextColor(P.text_secondary);
  doc.setFontSize(7);
  doc.text(`Сгенерировано: OWNDEV.ru  ·  ${formatDate()}  ·  Аудит: ${data.domain}`, MARGIN, y);

  // ============= CRO SECTION (опционально) =============
  if (data.cro) {
    newPage();
    drawSectionTitle('CRO-АУДИТ: ПОЧЕМУ САЙТ НЕ ПРОДАЁТ');
    y += 4;

    const cro = data.cro;
    const scoreStatus = getScoreStatus(cro.conversion_score);

    // Score card
    checkPageBreak(36);
    setFill(P.bg_alt);
    doc.roundedRect(MARGIN, y, CONTENT_W, 30, 3, 3, 'F');
    doc.setDrawColor(...hexToRgb(scoreStatus.color));
    doc.setLineWidth(0.6);
    doc.roundedRect(MARGIN, y, CONTENT_W, 30, 3, 3, 'S');
    setTextColor(scoreStatus.color);
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(28);
    doc.text(String(cro.conversion_score), MARGIN + 10, y + 20);
    doc.setFontSize(9);
    doc.text('/ 100', MARGIN + 10 + doc.getTextWidth(String(cro.conversion_score)) + 2, y + 20);
    setTextColor(P.text);
    doc.setFontSize(11);
    doc.text('Конверсионный потенциал', MARGIN + 50, y + 13);
    setTextColor(scoreStatus.color);
    doc.setFontSize(9);
    doc.text(scoreStatus.label, MARGIN + 50, y + 21);
    y += 34;

    // Money lost / budget waste
    checkPageBreak(30);
    const halfW = (CONTENT_W - 4) / 2;
    setFill('#fef2f2');
    doc.roundedRect(MARGIN, y, halfW, 24, 2, 2, 'F');
    doc.setDrawColor(...hexToRgb(P.critical));
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, y, halfW, 24, 2, 2, 'S');
    setTextColor(P.critical);
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8);
    doc.text('НЕДОПОЛУЧЕННЫЙ ДОХОД', MARGIN + 4, y + 7);
    setTextColor(P.text);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    const mlText = doc.splitTextToSize(cro.money_lost_estimate || '—', halfW - 8);
    doc.text(mlText.slice(0, 2), MARGIN + 4, y + 14);

    setFill('#fff7ed');
    doc.roundedRect(MARGIN + halfW + 4, y, halfW, 24, 2, 2, 'F');
    doc.setDrawColor(...hexToRgb(P.high));
    doc.roundedRect(MARGIN + halfW + 4, y, halfW, 24, 2, 2, 'S');
    setTextColor(P.high);
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(8);
    doc.text('ПОТЕРИ БЮДЖЕТА ДИРЕКТА', MARGIN + halfW + 8, y + 7);
    setTextColor(P.text);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    const dwText = doc.splitTextToSize(cro.direct_budget_waste || '—', halfW - 8);
    doc.text(dwText.slice(0, 2), MARGIN + halfW + 8, y + 14);
    y += 30;

    // Barriers
    if (cro.barriers && cro.barriers.length > 0) {
      checkPageBreak(12);
      setTextColor(P.text);
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(11);
      doc.text(`Конверсионные барьеры (${cro.barriers.length})`, MARGIN, y);
      y += 6;

      cro.barriers.forEach((b) => {
        const sevColor = getSeverityColor(b.severity);
        const descLines = doc.splitTextToSize(b.description || '', CONTENT_W - 12);
        const fixLines = doc.splitTextToSize(`Решение: ${b.fix || ''}`, CONTENT_W - 12);
        const blockH = 12 + descLines.length * 4 + fixLines.length * 4 + (b.impact ? 5 : 0) + 4;
        checkPageBreak(blockH);

        setFill(P.bg_alt);
        doc.roundedRect(MARGIN, y, CONTENT_W, blockH, 2, 2, 'F');
        doc.setDrawColor(...hexToRgb(P.border));
        doc.setLineWidth(0.3);
        doc.roundedRect(MARGIN, y, CONTENT_W, blockH, 2, 2, 'S');
        doc.setFillColor(...hexToRgb(sevColor));
        doc.rect(MARGIN, y, 2, blockH, 'F');

        setTextColor(P.text_secondary);
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(7);
        doc.text((b.category || '').toUpperCase(), MARGIN + 6, y + 5);
        doc.setTextColor(...hexToRgb(sevColor));
        doc.text(getSeverityLabel(b.severity), PAGE_W - MARGIN - 2, y + 5, { align: 'right' });

        setTextColor(P.text);
        doc.setFontSize(9);
        doc.text(b.title || '', MARGIN + 6, y + 10);

        setTextColor(P.text_secondary);
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(8);
        doc.text(descLines, MARGIN + 6, y + 15);
        let cy = y + 15 + descLines.length * 4;
        setTextColor(P.text);
        doc.text(fixLines, MARGIN + 6, cy);
        cy += fixLines.length * 4;
        if (b.impact) {
          setTextColor(P.success);
          doc.text(`Эффект: ${b.impact}`, MARGIN + 6, cy);
        }
        y += blockH + 2;
      });
      y += 2;
    }

    // Quick wins
    if (cro.quick_wins && cro.quick_wins.length > 0) {
      checkPageBreak(14);
      setTextColor(P.text);
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(11);
      doc.text('Быстрые победы', MARGIN, y);
      y += 6;
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(9);
      cro.quick_wins.forEach((w, i) => {
        const lines = doc.splitTextToSize(`${i + 1}. ${w}`, CONTENT_W - 6);
        checkPageBreak(lines.length * 5 + 2);
        setTextColor(P.text);
        doc.text(lines, MARGIN + 2, y + 4);
        y += lines.length * 5 + 2;
      });
      y += 4;
    }

    // Fix cost
    if (cro.fix_cost_estimate) {
      checkPageBreak(34);
      setFill(P.bg_alt);
      doc.roundedRect(MARGIN, y, CONTENT_W, 28, 3, 3, 'F');
      doc.setDrawColor(...hexToRgb(P.accent));
      doc.setLineWidth(0.4);
      doc.roundedRect(MARGIN, y, CONTENT_W, 28, 3, 3, 'S');
      setTextColor(P.text);
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(10);
      doc.text('Стоимость исправления', MARGIN + 4, y + 7);
      setTextColor(P.accent);
      doc.setFontSize(14);
      const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
      doc.text(`${fmt(cro.fix_cost_estimate.min)} — ${fmt(cro.fix_cost_estimate.max)}`, MARGIN + 4, y + 16);
      if (cro.fix_cost_estimate.roi_months > 0) {
        setTextColor(P.success);
        doc.setFontSize(9);
        doc.text(`Окупается за ${cro.fix_cost_estimate.roi_months} мес.`, MARGIN + 4, y + 23);
      }
      y += 32;

      if (cro.fix_cost_estimate.breakdown?.length > 0) {
        setTextColor(P.text);
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(9);
        doc.text('Состав работ:', MARGIN, y);
        y += 5;
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(8);
        cro.fix_cost_estimate.breakdown.forEach((b) => {
          const lines = doc.splitTextToSize(`• ${b}`, CONTENT_W - 4);
          checkPageBreak(lines.length * 4 + 1);
          setTextColor(P.text_secondary);
          doc.text(lines, MARGIN + 2, y + 3);
          y += lines.length * 4 + 1;
        });
        y += 4;
      }
    }

    // CTA banner
    if (cro.cta_recommendation) {
      const ctaLines = doc.splitTextToSize(cro.cta_recommendation, CONTENT_W - 12);
      const ctaH = Math.max(22, ctaLines.length * 5 + 12);
      checkPageBreak(ctaH + 4);
      setFill(P.accent);
      doc.roundedRect(MARGIN, y, CONTENT_W, ctaH, 3, 3, 'F');
      setTextColor('#ffffff');
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(9);
      doc.text('Рекомендация:', MARGIN + 6, y + 7);
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(8);
      doc.text(ctaLines, MARGIN + 6, y + 13);
      y += ctaH + 4;
    }
  }

  const fileName = data.cro
    ? `owndev_full_audit_${data.domain}_${new Date().toISOString().split('T')[0]}.pdf`
    : `owndev_audit_${data.domain}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
