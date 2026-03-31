import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  COLORS, getSeverityColor, getSeverityLabel,
  getCategoryLabel, getScoreStatus,
  calcPotentialGain, formatDate, truncate,
  ReportData,
} from './reportHelpers';

export async function generatePdfReport(data: ReportData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

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
    setFill(COLORS.bg_dark);
    doc.rect(0, 0, PAGE_W, 10, 'F');
    setTextColor(COLORS.purple);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('OWNDEV', MARGIN, 7);
    setTextColor(COLORS.text_gray);
    doc.setFont('helvetica', 'normal');
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

  const drawLine = (color = COLORS.purple) => {
    doc.setDrawColor(...hexToRgb(color));
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 4;
  };

  const drawSectionTitle = (title: string) => {
    checkPageBreak(14);
    setFill(COLORS.bg_card2);
    doc.roundedRect(MARGIN, y, CONTENT_W, 9, 2, 2, 'F');
    setTextColor(COLORS.purple_light);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, MARGIN + 4, y + 6);
    y += 13;
  };

  // ─── СТРАНИЦА 1: ТИТУЛЬНЫЙ ЛИСТ ──────────────────
  setFill(COLORS.bg_dark);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  setFill(COLORS.purple);
  doc.rect(0, 0, PAGE_W, 2, 'F');

  y = 35;
  setTextColor(COLORS.purple);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('OWNDEV', MARGIN, y);

  y += 8;
  setTextColor(COLORS.text_gray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('GEO и AI-ready аудит сайта', MARGIN, y);

  y += 6;
  setFill(COLORS.purple);
  doc.rect(MARGIN, y, 40, 0.5, 'F');

  y += 16;
  setTextColor(COLORS.text_white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Отчёт аудита сайта', MARGIN, y);

  y += 10;
  setTextColor(COLORS.purple_light);
  doc.setFontSize(13);
  doc.text(truncate(data.url, 60), MARGIN, y);

  y += 8;
  setTextColor(COLORS.text_gray);
  doc.setFontSize(9);
  doc.text(`Тематика: ${data.theme}`, MARGIN, y);
  y += 5;
  doc.text(`Дата аудита: ${formatDate(new Date(data.scanDate))}`, MARGIN, y);

  // Score cards
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
    setFill(COLORS.bg_card);
    doc.roundedRect(x + 1, y, cardW - 2, 28, 3, 3, 'F');
    doc.setFillColor(...hexToRgb(status.color));
    doc.roundedRect(x + 1, y, cardW - 2, 1.5, 1, 1, 'F');
    doc.setTextColor(...hexToRgb(status.color));
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(String(card.value), x + cardW / 2, y + 12, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setTextColor(COLORS.text_gray);
    doc.text(card.label, x + cardW / 2, y + 18, { align: 'center' });
    doc.setFontSize(6);
    doc.setTextColor(...hexToRgb(status.color));
    doc.text(status.label, x + cardW / 2, y + 24, { align: 'center' });
  });
  y += 36;

  const gain = calcPotentialGain(data.issues);
  const critCount = data.issues.filter((i: any) => i.severity === 'critical').length;

  setFill(COLORS.bg_card2);
  doc.roundedRect(MARGIN, y, CONTENT_W, 12, 2, 2, 'F');
  setTextColor(COLORS.text_gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Найдено ${data.issues.length} проблем · ${critCount} критических · Устраните критические → оценка вырастет на ~+${gain} баллов`,
    MARGIN + 4, y + 7.5,
  );

  y = PAGE_H - 25;
  drawLine(COLORS.purple_dark);
  setTextColor(COLORS.text_gray);
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
    styles: {
      fontSize: 7.5, cellPadding: 2.5,
      fillColor: hexToRgb(COLORS.bg_card),
      textColor: hexToRgb(COLORS.text_white),
      lineColor: hexToRgb(COLORS.bg_card2), lineWidth: 0.3,
    },
    headStyles: {
      fillColor: hexToRgb(COLORS.purple_dark),
      textColor: hexToRgb(COLORS.text_white),
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
        if (val.startsWith('✓')) hookData.cell.styles.textColor = hexToRgb(COLORS.success);
        else if (val.startsWith('✗')) hookData.cell.styles.textColor = hexToRgb(COLORS.critical);
        else if (val.startsWith('⚠')) hookData.cell.styles.textColor = hexToRgb(COLORS.medium);
      }
      if (hookData.section === 'body' && hookData.row.index % 2 === 1) {
        hookData.cell.styles.fillColor = hexToRgb(COLORS.bg_card2);
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ─── ПЛАН ИСПРАВЛЕНИЯ ───────────────────────────
  newPage();
  drawSectionTitle(`ПЛАН ИСПРАВЛЕНИЯ — ${data.issues.length} ПРОБЛЕМ`);

  setTextColor(COLORS.text_gray);
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
    setFill(COLORS.bg_card);
    doc.roundedRect(MARGIN, y, CONTENT_W, 6, 1, 1, 'F');
    doc.setFillColor(...hexToRgb(severityColor));
    doc.rect(MARGIN, y, 2, 6, 'F');

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(severityColor));
    doc.text(`${idx + 1}. [${getSeverityLabel(issue.severity).toUpperCase()}]`, MARGIN + 4, y + 4);
    setTextColor(COLORS.text_gray);
    doc.setFont('helvetica', 'normal');
    doc.text(getCategoryLabel(issue.category || issue.module || ''), MARGIN + 32, y + 4);
    setTextColor(COLORS.success);
    doc.text(`+${issue.impact_score || 0} балл.`, PAGE_W - MARGIN - 2, y + 4, { align: 'right' });
    y += 8;

    // Title
    setTextColor(COLORS.text_white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(issue.title || 'Ошибка', CONTENT_W);
    doc.text(titleLines, MARGIN, y);
    y += titleLines.length * 4 + 2;

    if (issue.where || issue.location) {
      setTextColor(COLORS.text_dark);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text(`Где: ${issue.where || issue.location}`, MARGIN, y);
      y += 4;
    }

    if (issue.description) {
      setTextColor(COLORS.text_gray);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(issue.description, CONTENT_W);
      doc.text(descLines, MARGIN, y);
      y += descLines.length * 3.5 + 3;
    }

    if (issue.why_important || issue.why_it_matters) {
      checkPageBreak(20);
      setFill(COLORS.bg_card2);
      doc.roundedRect(MARGIN, y, CONTENT_W, 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(COLORS.medium));
      doc.text('ПОЧЕМУ ЭТО ВАЖНО:', MARGIN + 2, y + 3.5);
      y += 7;
      setTextColor(COLORS.text_gray);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const whyLines = doc.splitTextToSize(issue.why_important || issue.why_it_matters, CONTENT_W - 4);
      checkPageBreak(whyLines.length * 3.5 + 4);
      doc.text(whyLines, MARGIN + 2, y);
      y += whyLines.length * 3.5 + 4;
    }

    if (issue.how_to_fix) {
      checkPageBreak(20);
      setFill(COLORS.bg_card2);
      doc.roundedRect(MARGIN, y, CONTENT_W, 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(COLORS.success));
      doc.text('КАК ИСПРАВИТЬ:', MARGIN + 2, y + 3.5);
      y += 7;
      const steps = (issue.how_to_fix as string).split('\n').filter((s: string) => s.trim());
      steps.forEach((step: string) => {
        const stepLines = doc.splitTextToSize(step.trim(), CONTENT_W - 6);
        checkPageBreak(stepLines.length * 3.5 + 2);
        setTextColor(COLORS.text_white);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(stepLines, MARGIN + 4, y);
        y += stepLines.length * 3.5 + 1.5;
      });
      y += 2;
    }

    if (issue.example || issue.example_fix) {
      const exampleText = issue.example || issue.example_fix;
      checkPageBreak(20);
      setFill('#0d1117');
      const exLines = doc.splitTextToSize(exampleText, CONTENT_W - 8);
      const exHeight = exLines.length * 3.5 + 6;
      checkPageBreak(exHeight + 6);
      doc.roundedRect(MARGIN, y, CONTENT_W, exHeight, 2, 2, 'F');
      doc.setDrawColor(...hexToRgb(COLORS.purple_dark));
      doc.setLineWidth(0.3);
      doc.roundedRect(MARGIN, y, CONTENT_W, exHeight, 2, 2, 'S');
      doc.setFontSize(6.5);
      doc.setFont('courier', 'normal');
      doc.setTextColor(...hexToRgb(COLORS.success));
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
        setFill(i === 0 ? COLORS.bg_card2 : COLORS.bg_card);
        doc.roundedRect(x + 1, y, CONTENT_W / 3 - 2, 14, 2, 2, 'F');
        setTextColor(COLORS.text_gray);
        doc.setFontSize(6.5);
        doc.text(item[0], x + 4, y + 5);
        setTextColor(i === 0 ? COLORS.purple_light : COLORS.text_white);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
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
      styles: {
        fontSize: 6.5, cellPadding: 2,
        fillColor: hexToRgb(COLORS.bg_card),
        textColor: hexToRgb(COLORS.text_white),
        lineColor: hexToRgb(COLORS.bg_card2), lineWidth: 0.2,
        overflow: 'ellipsize' as any,
      },
      headStyles: {
        fillColor: hexToRgb(COLORS.purple_dark), fontSize: 7, fontStyle: 'bold',
        textColor: hexToRgb(COLORS.text_white),
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
          hookData.cell.styles.fillColor = [45, 25, 80];
          hookData.cell.styles.fontStyle = 'bold';
        }
        if (hookData.row.index === compRows.length - 1 && hookData.section === 'body') {
          hookData.cell.styles.fillColor = hexToRgb(COLORS.bg_card2);
          hookData.cell.styles.textColor = hexToRgb(COLORS.info);
        }
        const val = String(hookData.cell.raw || '');
        if (val === '✓') hookData.cell.styles.textColor = hexToRgb(COLORS.success);
        else if (val === '✗') hookData.cell.styles.textColor = hexToRgb(COLORS.critical);
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    if (comparison?.insights?.length) {
      checkPageBreak(30);
      drawSectionTitle('ЧТО ВЗЯТЬ У КОНКУРЕНТОВ');
      comparison.insights.forEach((insight: string) => {
        checkPageBreak(12);
        setFill(COLORS.bg_card2);
        const insightLines = doc.splitTextToSize(insight, CONTENT_W - 6);
        const h = insightLines.length * 4 + 4;
        doc.roundedRect(MARGIN, y, CONTENT_W, h, 2, 2, 'F');
        doc.setFontSize(7.5);
        setTextColor(COLORS.text_white);
        doc.setFont('helvetica', 'normal');
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

    setTextColor(COLORS.text_gray);
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
      styles: {
        fontSize: 7, cellPadding: 2,
        fillColor: hexToRgb(COLORS.bg_card),
        textColor: hexToRgb(COLORS.text_white),
        lineColor: hexToRgb(COLORS.bg_card2), lineWidth: 0.2,
      },
      headStyles: { fillColor: hexToRgb(COLORS.purple_dark), fontSize: 7.5, fontStyle: 'bold', textColor: hexToRgb(COLORS.text_white) },
      columnStyles: {
        0: { cellWidth: 75 }, 1: { cellWidth: 45 },
        2: { cellWidth: 20, halign: 'center' }, 3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 18, halign: 'center' },
      },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body') {
          if (hookData.column.index === 2) {
            const val = String(hookData.cell.raw || '');
            if (val.includes('Коммер') || val.includes('Трансак')) hookData.cell.styles.textColor = hexToRgb(COLORS.success);
            else hookData.cell.styles.textColor = hexToRgb(COLORS.info);
          }
          if (hookData.row.index % 2 === 1) hookData.cell.styles.fillColor = hexToRgb(COLORS.bg_card2);
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 4;

    if (data.keywords.length > 100) {
      setTextColor(COLORS.text_gray);
      doc.setFontSize(7);
      doc.text(`* Показаны топ-100 из ${data.keywords.length} запросов. Полный список — в CSV.`, MARGIN, y);
    }
  }

  // ─── МИНУС-СЛОВА ────────────────────────
  if (data.minusWords.length > 0) {
    newPage();
    drawSectionTitle(`МИНУС-СЛОВА ДЛЯ ЯНДЕКС.ДИРЕКТ — ${data.minusWords.length}`);

    setTextColor(COLORS.text_gray);
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
      setFill(COLORS.bg_card2);
      doc.roundedRect(MARGIN, y, CONTENT_W, 7, 1, 1, 'F');
      setTextColor(COLORS.purple_light);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${catNames[cat] || cat} (${words.length})`, MARGIN + 3, y + 5);
      y += 10;
      const wordsText = words.map((w: any) => `-${w.word}`).join('  ');
      setTextColor(COLORS.text_white);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      const wordLines = doc.splitTextToSize(wordsText, CONTENT_W);
      checkPageBreak(wordLines.length * 3.5 + 4);
      doc.text(wordLines, MARGIN, y);
      y += wordLines.length * 3.5 + 6;
    });
  }

  // ─── ПРИОРИТЕТНЫЙ ПЛАН ДЕЙСТВИЙ ────
  newPage();
  drawSectionTitle('ПРИОРИТЕТНЫЙ ПЛАН ДЕЙСТВИЙ');

  setTextColor(COLORS.text_gray);
  doc.setFontSize(8);
  doc.text('Выполните эти шаги последовательно — и сайт выйдет в топ.', MARGIN, y);
  y += 8;

  const topIssues = [...sortedIssues]
    .sort((a: any, b: any) => (b.impact_score || 0) - (a.impact_score || 0))
    .slice(0, 10);

  topIssues.forEach((issue: any, idx: number) => {
    checkPageBreak(16);
    const sevColor = getSeverityColor(issue.severity);
    setFill(COLORS.bg_card);
    doc.roundedRect(MARGIN, y, CONTENT_W, 12, 2, 2, 'F');
    doc.setFillColor(...hexToRgb(sevColor));
    doc.rect(MARGIN, y, 2, 12, 'F');
    setTextColor(COLORS.text_gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${idx + 1}.`, MARGIN + 4, y + 8);
    setTextColor(COLORS.text_white);
    const titleText = doc.splitTextToSize(issue.title || '', CONTENT_W - 40);
    doc.text(titleText, MARGIN + 12, y + 5);
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(COLORS.success));
    doc.text(`+${issue.impact_score || 0} б.`, PAGE_W - MARGIN - 2, y + 5, { align: 'right' });
    doc.setTextColor(...hexToRgb(sevColor));
    doc.text(getSeverityLabel(issue.severity), PAGE_W - MARGIN - 2, y + 10, { align: 'right' });
    y += 14;
  });

  y += 4;
  checkPageBreak(30);
  setFill(COLORS.purple_dark);
  doc.roundedRect(MARGIN, y, CONTENT_W, 22, 3, 3, 'F');
  setTextColor(COLORS.text_white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Следующий шаг:', MARGIN + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Запустите повторный аудит через 30 дней на OWNDEV.ru', MARGIN + 6, y + 14);
  setTextColor(COLORS.purple_light);
  doc.setFontSize(7);
  doc.text('OWNDEV.ru — первый GEO и AI-ready аудит сайта в Рунете', MARGIN + 6, y + 20);

  y += 28;
  drawLine(COLORS.purple_dark);
  setTextColor(COLORS.text_gray);
  doc.setFontSize(7);
  doc.text(`Сгенерировано: OWNDEV.ru  ·  ${formatDate()}  ·  Аудит: ${data.domain}`, MARGIN, y);

  const fileName = `owndev_audit_${data.domain}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
