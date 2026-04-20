import {
  Document, Packer, Paragraph, TextRun, Table, TableRow,
  TableCell, WidthType, HeadingLevel, AlignmentType,
  BorderStyle, ShadingType, TableLayoutType,
  PageBreak, Header, Footer, PageNumber,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import {
  PRINT_COLORS,
  getSeverityLabel, getCategoryLabel,
  getScoreStatus, calcPotentialGain,
  formatDate, truncate, ReportData,
} from './reportHelpers';

const P = PRINT_COLORS;

const W = {
  text: '1A1A1A', text_sec: '6B7280', accent: '7C3AED',
  bg_header: 'F3F4F6', bg_alt: 'F9FAFB', border: 'E5E7EB',
  critical: 'DC2626', high: 'EA580C', medium: 'CA8A04', low: '6B7280',
  success: '059669', info: '2563EB',
};

const getSevColorW = (severity: string): string => {
  const map: Record<string, string> = { critical: W.critical, high: W.high, medium: W.medium, low: W.low };
  return map[severity] || W.low;
};

const sectionTitle = (text: string): Paragraph =>
  new Paragraph({
    spacing: { before: 400, after: 200 },
    shading: { type: ShadingType.CLEAR, color: W.bg_header, fill: W.bg_header },
    indent: { left: convertInchesToTwip(0.1) },
    children: [new TextRun({ text, bold: true, color: W.accent, size: 32, font: 'Arial' })],
  });

const subTitle = (text: string): Paragraph =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, color: W.accent, size: 26, font: 'Arial' })],
  });

const bodyText = (text: string, options?: { bold?: boolean; color?: string; size?: number; indent?: number }): Paragraph =>
  new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: options?.indent ? { left: convertInchesToTwip(options.indent) } : undefined,
    children: [new TextRun({ text, bold: options?.bold, color: options?.color || W.text, size: options?.size || 20, font: 'Arial' })],
  });

const labelBlock = (label: string, text: string, labelColor: string): Paragraph =>
  new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: `${label} `, bold: true, color: labelColor, size: 18, font: 'Arial' }),
      new TextRun({ text, color: W.text, size: 18, font: 'Arial' }),
    ],
  });

const pageBreakP = (): Paragraph => new Paragraph({ children: [new PageBreak()] });

const hrLine = (): Paragraph =>
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: W.border } },
    spacing: { before: 100, after: 100 },
    children: [],
  });

const createStyledTable = (headers: string[], rows: string[][], colWidths: number[]): Table => {
  const normalizedWidths = (() => {
    const total = colWidths.reduce((s, w) => s + w, 0);
    if (total === 0) return colWidths;
    return colWidths.map(w => Math.round((w / total) * 100));
  })();

  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: normalizedWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, color: W.bg_header, fill: W.bg_header },
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: W.text, size: 16, font: 'Arial' })], alignment: AlignmentType.CENTER })],
    })),
  });
  const dataRows = rows.map((row, rowIdx) =>
    new TableRow({
      cantSplit: false,
      children: row.map((cell, colIdx) => new TableCell({
        width: { size: normalizedWidths[colIdx], type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, color: rowIdx % 2 === 0 ? 'FFFFFF' : W.bg_alt, fill: rowIdx % 2 === 0 ? 'FFFFFF' : W.bg_alt },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children: [new Paragraph({ children: [new TextRun({ text: cell, color: W.text, size: 16, font: 'Arial' })] })],
      })),
    }),
  );
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
};

export async function generateWordReport(data: ReportData): Promise<void> {
  const gain = calcPotentialGain(data.issues);
  const critCount = data.issues.filter((i: any) => i.severity === 'critical').length;
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedIssues = [...data.issues].sort((a: any, b: any) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));
  const children: (Paragraph | Table)[] = [];

  // Title page
  children.push(
    new Paragraph({ spacing: { before: 2000 }, children: [] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'OWNDEV', bold: true, size: 72, color: W.accent, font: 'Arial' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 400 }, children: [new TextRun({ text: 'GEO и AI-ready аудит сайта', size: 24, color: W.text_sec, font: 'Arial' })] }),
    hrLine(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'ОТЧЁТ АУДИТА САЙТА', bold: true, size: 48, color: W.text, font: 'Arial' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 }, children: [new TextRun({ text: truncate(data.url, 70), size: 28, color: W.accent, font: 'Arial', bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 }, children: [new TextRun({ text: `Тематика: ${data.theme}`, size: 22, color: W.text_sec, font: 'Arial' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 600 }, children: [new TextRun({ text: `Дата: ${formatDate(new Date(data.scanDate))}`, size: 22, color: W.text_sec, font: 'Arial' })] }),
    hrLine(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: 'ИТОГОВЫЕ ОЦЕНКИ', bold: true, size: 24, color: W.accent, font: 'Arial' })] }),
  );

  children.push(createStyledTable(
    ['Общий', 'SEO', 'Директ', 'Schema', 'AI'],
    [[String(data.scores.total), String(data.scores.seo), String(data.scores.direct), String(data.scores.schema), String(data.scores.ai)]],
    [20, 20, 20, 20, 20],
  ));

  children.push(
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    bodyText(`Найдено: ${data.issues.length} проблем · ${critCount} критических · Потенциальный прирост: +${gain} баллов`, { color: W.text_sec }),
    pageBreakP(),
  );

  // Technical passport
  children.push(sectionTitle('ТЕХНИЧЕСКИЙ ПАСПОРТ САЙТА'));
  const seo = data.seoData || {};
  const passportRows: string[][] = [
    ['Title', truncate(seo.title || 'Не найден', 60), seo.title ? (seo.titleLength >= 50 && seo.titleLength <= 65 ? '✓ OK' : '⚠ Не норма') : '✗ Отсутствует', '50-65 симв.'],
    ['Description', truncate(seo.description || 'Не найден', 60), seo.description ? '✓ Есть' : '✗ Отсутствует', '120-160 симв.'],
    ['H1', truncate(seo.h1 || 'Не найден', 60), seo.h1 ? '✓ Есть' : '✗ Отсутствует', '1 штука'],
    ['Кол-во H1', String(seo.h1Count || 0), seo.h1Count === 1 ? '✓ OK' : '✗ Ошибка', 'Ровно 1'],
    ['Заголовков H2', String(seo.h2Count || 0), seo.h2Count >= 3 ? '✓ OK' : '⚠ Мало', '3-10'],
    ['Объём контента', seo.wordCount ? `${seo.wordCount} слов` : '—', seo.wordCount >= 500 ? '✓ OK' : '✗ Мало', '500+ слов'],
    ['Canonical', seo.canonical ? 'Есть' : 'Отсутствует', seo.canonical ? '✓ OK' : '⚠ Нет', 'Обязателен'],
    ['Schema.org', seo.hasSchema ? (seo.schemaTypes?.join(', ') || 'Есть') : 'Нет', seo.hasSchema ? '✓ Есть' : '✗ Нет', 'Обязательна'],
    ['llms.txt', seo.hasLlmsTxt ? 'Есть' : 'Нет', seo.hasLlmsTxt ? '✓ Есть' : '✗ Нет (-20 LLM)', 'AI-стандарт'],
  ];
  children.push(createStyledTable(['Параметр', 'Значение', 'Статус', 'Норма'], passportRows, [25, 40, 20, 15]));
  children.push(pageBreakP());

  // Issues
  children.push(
    sectionTitle(`ПЛАН ИСПРАВЛЕНИЯ — ${data.issues.length} ПРОБЛЕМ`),
    bodyText(`Исправьте ${critCount} критических ошибок → оценка вырастет на ~+${gain} баллов`, { color: W.text_sec }),
    new Paragraph({ spacing: { before: 200 }, children: [] }),
  );

  sortedIssues.forEach((issue: any, idx: number) => {
    const sevColor = getSevColorW(issue.severity);
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        border: { left: { style: BorderStyle.THICK, size: 12, color: sevColor } },
        indent: { left: convertInchesToTwip(0.15) },
        children: [
          new TextRun({ text: `${idx + 1}. `, bold: true, color: sevColor, size: 22, font: 'Arial' }),
          new TextRun({ text: `[${getSeverityLabel(issue.severity).toUpperCase()}] `, bold: true, color: sevColor, size: 20, font: 'Arial' }),
          new TextRun({ text: issue.title || '', bold: true, color: W.text, size: 22, font: 'Arial' }),
          new TextRun({ text: `  +${issue.impact_score || 0} балл.`, color: W.success, size: 18, font: 'Arial' }),
        ],
      }),
      labelBlock('Категория:', getCategoryLabel(issue.category || issue.module || ''), W.accent),
      labelBlock('Где:', issue.where || issue.location || '—', W.text_sec),
    );

    if (issue.description) children.push(bodyText(issue.description, { color: W.text_sec }));

    if (issue.why_important || issue.why_it_matters) {
      children.push(
        new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: 'ПОЧЕМУ ЭТО ВАЖНО:', bold: true, color: W.medium, size: 18, font: 'Arial' })] }),
        bodyText(issue.why_important || issue.why_it_matters, { color: W.text, indent: 0.2 }),
      );
    }

    if (issue.how_to_fix) {
      children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: 'КАК ИСПРАВИТЬ:', bold: true, color: W.success, size: 18, font: 'Arial' })] }));
      (issue.how_to_fix as string).split('\n').filter((s: string) => s.trim()).forEach((step: string) => {
        children.push(new Paragraph({ spacing: { before: 40, after: 40 }, indent: { left: convertInchesToTwip(0.25) }, children: [new TextRun({ text: step.trim(), color: W.text, size: 18, font: 'Arial' })] }));
      });
    }

    if (issue.example || issue.example_fix) {
      children.push(
        new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: 'ПРИМЕР:', bold: true, color: W.success, size: 18, font: 'Arial' })] }),
        new Paragraph({
          spacing: { before: 60, after: 60 }, indent: { left: convertInchesToTwip(0.2) },
          shading: { type: ShadingType.CLEAR, color: W.bg_alt, fill: W.bg_alt },
          children: [new TextRun({ text: issue.example || issue.example_fix, color: W.text, size: 16, font: 'Courier New' })],
        }),
      );
    }
    children.push(hrLine());
  });

  children.push(pageBreakP());

  // Competitors
  const competitors = data.competitors.filter((c: any) => c._type === 'competitor');
  if (competitors.length > 0) {
    children.push(sectionTitle('АНАЛИЗ КОНКУРЕНТОВ'));
    if (data.comparisonTable) {
      const ct = data.comparisonTable;
      children.push(bodyText(
        `Ваш контент: ${ct.your_site?.content_length_words || 0} слов  ·  Среднее: ${ct.avg_top10?.content_length_words || 0} слов  ·  Лидер: ${ct.leader?.content_length_words || 0} слов`,
        { color: W.text_sec },
      ));
    }

    // Table 1: content metrics (mobile-friendly: 4 columns)
    const compHeaders1 = ['Сайт / Домен', 'Слов', 'H2', 'Позиция'];
    const compRows1: string[][] = [
      [`★ ВАШ САЙТ: ${data.domain}`, String(data.comparisonTable?.your_site?.content_length_words || '—'), String(data.seoData?.h2Count || '—'), '—'],
      ...competitors.slice(0, 10).map((c: any) => [
        `#${c.position} ${c.domain}`, String(c.content_length_words || 0), String(c.h2_count || 0), String(c.position || '—'),
      ]),
    ];
    if (data.comparisonTable) {
      const avg = data.comparisonTable.avg_top10;
      compRows1.push(['СРЕДНЕЕ ТОП-10', String(avg?.content_length_words || 0), String(avg?.h2_count || 0), '—']);
    }
    children.push(createStyledTable(compHeaders1, compRows1, [52, 18, 15, 15]));
    children.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

    // Table 2: feature flags (mobile-friendly: 5 columns)
    const compHeaders2 = ['Домен', 'FAQ', 'Цены', 'Отзывы', 'Schema'];
    const compRows2: string[][] = [
      [data.domain,
        data.seoData?.hasFaq ? '✓' : '✗', data.seoData?.hasPriceBlock ? '✓' : '✗',
        data.seoData?.hasReviews ? '✓' : '✗', data.seoData?.hasSchema ? '✓' : '✗'],
      ...competitors.slice(0, 10).map((c: any) => [
        c.domain, c.has_faq ? '✓' : '✗', c.has_price_block ? '✓' : '✗',
        c.has_reviews ? '✓' : '✗', c.has_schema ? '✓' : '✗',
      ]),
    ];
    children.push(createStyledTable(compHeaders2, compRows2, [44, 14, 14, 14, 14]));

    if (data.comparisonTable?.insights?.length) {
      children.push(subTitle('Что взять у конкурентов'));
      data.comparisonTable.insights.forEach((insight: string) => {
        children.push(new Paragraph({
          spacing: { before: 100, after: 100 },
          shading: { type: ShadingType.CLEAR, color: W.bg_alt, fill: W.bg_alt },
          indent: { left: convertInchesToTwip(0.1) },
          children: [new TextRun({ text: insight, color: W.text, size: 19, font: 'Arial' })],
        }));
      });
    }
    children.push(pageBreakP());
  }

  // Keywords
  if (data.keywords.length > 0) {
    children.push(sectionTitle(`СЕМАНТИЧЕСКОЕ ЯДРО — ${data.keywords.length} ЗАПРОСОВ`));
    const sortedKW = [...data.keywords].sort((a: any, b: any) => (b.frequency || b.volume || 0) - (a.frequency || a.volume || 0)).slice(0, 150);
    const kwRows = sortedKW.map((k: any) => [
      k.phrase || k.keyword || '', k.cluster || '',
      k.intent === 'commercial' ? 'Коммерческий' : k.intent === 'transactional' ? 'Транзакционный' : k.intent === 'informational' ? 'Информационный' : 'Навигационный',
      (k.frequency || k.volume) ? String(k.frequency || k.volume) : '—',
      k.landing_needed ? 'Нужен лендинг' : 'Нет',
    ]);
    children.push(createStyledTable(['Запрос', 'Кластер', 'Интент', 'Частота', 'Лендинг'], kwRows, [33, 25, 18, 12, 12]));
    children.push(pageBreakP());
  }

  // Minus words
  if (data.minusWords.length > 0) {
    children.push(
      sectionTitle(`МИНУС-СЛОВА ДЛЯ ДИРЕКТА — ${data.minusWords.length}`),
      bodyText('Добавьте на уровне аккаунта в Яндекс.Директ:', { color: W.text_sec }),
    );
    const catNames: Record<string, string> = { informational: 'Информационные', irrelevant: 'Нерелевантные', competitor: 'Конкуренты', geo: 'Регионы', other: 'Прочие', general: 'Общие' };
    const groups: Record<string, any[]> = {};
    data.minusWords.forEach((w: any) => { const cat = w.category || w.type || 'other'; if (!groups[cat]) groups[cat] = []; groups[cat].push(w); });
    // Split long minus-word lists into chunks of 8 words per row for mobile readability
    const minusRows: string[][] = [];
    Object.entries(groups).forEach(([cat, words]) => {
      const CHUNK = 8;
      const wordArr = words.map((w: any) => `-${w.word}`);
      for (let i = 0; i < wordArr.length; i += CHUNK) {
        const chunk = wordArr.slice(i, i + CHUNK);
        minusRows.push([
          i === 0 ? (catNames[cat] || cat) : '',
          chunk.join('  '),
          i === 0 ? String(words.length) : '',
        ]);
      }
    });
    children.push(createStyledTable(['Категория', 'Минус-слова', 'Кол-во'], minusRows, [22, 64, 14]));
    children.push(
      subTitle('Строка для вставки в Яндекс.Директ:'),
      new Paragraph({
        spacing: { before: 100, after: 100 },
        shading: { type: ShadingType.CLEAR, color: W.bg_alt, fill: W.bg_alt },
        children: [new TextRun({ text: data.minusWords.map((w: any) => `-${w.word}`).join(' '), color: W.text, size: 16, font: 'Courier New' })],
      }),
      pageBreakP(),
    );
  }

  // Action plan
  children.push(
    sectionTitle('ПРИОРИТЕТНЫЙ ПЛАН ДЕЙСТВИЙ'),
    bodyText('Выполните эти шаги последовательно — сайт выйдет в топ.', { color: W.text_sec }),
    new Paragraph({ spacing: { before: 200 }, children: [] }),
  );

  const topIssues = [...sortedIssues].sort((a: any, b: any) => (b.impact_score || 0) - (a.impact_score || 0)).slice(0, 10);
  topIssues.forEach((issue: any, idx: number) => {
    const sevColor = getSevColorW(issue.severity);
    children.push(new Paragraph({
      spacing: { before: 150, after: 80 },
      border: { left: { style: BorderStyle.THICK, size: 12, color: sevColor } },
      indent: { left: convertInchesToTwip(0.2) },
      children: [
        new TextRun({ text: `${idx + 1}. `, bold: true, color: sevColor, size: 22, font: 'Arial' }),
        new TextRun({ text: issue.title || '', bold: true, color: W.text, size: 22, font: 'Arial' }),
        new TextRun({ text: `  → +${issue.impact_score || 0} баллов`, color: W.success, size: 18, font: 'Arial' }),
      ],
    }));
  });

  children.push(
    new Paragraph({ spacing: { before: 400 }, children: [] }),
    hrLine(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: 'Сгенерировано: OWNDEV.ru — GEO и AI-ready аудит', color: W.text_sec, size: 18, font: 'Arial' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Следующий аудит рекомендуется через 30 дней', color: W.text_sec, size: 16, font: 'Arial' })] }),
  );

  // CRO section (optional)
  if (data.cro) {
    const cro = data.cro;
    children.push(
      pageBreakP(),
      sectionTitle('CRO-АУДИТ — ПОЧЕМУ САЙТ НЕ ПРОДАЁТ'),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
        children: [new TextRun({
          text: `Конверсионный потенциал: ${cro.conversion_score} / 100`,
          bold: true, size: 36,
          color: cro.conversion_score >= 76 ? W.success : cro.conversion_score >= 51 ? W.medium : W.critical,
          font: 'Arial',
        })],
      }),
      labelBlock('Недополученный доход:', cro.money_lost_estimate, W.critical),
      labelBlock('Потери бюджета Директа:', cro.direct_budget_waste, W.high),
    );

    if (cro.barriers?.length > 0) {
      children.push(subTitle(`Конверсионные барьеры (${cro.barriers.length})`));
      cro.barriers.forEach((b, idx) => {
        const sevColor = getSevColorW(b.severity);
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 80 },
            border: { left: { style: BorderStyle.THICK, size: 12, color: sevColor } },
            indent: { left: convertInchesToTwip(0.15) },
            children: [
              new TextRun({ text: `${idx + 1}. `, bold: true, color: sevColor, size: 22, font: 'Arial' }),
              new TextRun({ text: `[${b.severity.toUpperCase()}] `, bold: true, color: sevColor, size: 18, font: 'Arial' }),
              new TextRun({ text: b.title, bold: true, color: W.text, size: 22, font: 'Arial' }),
            ],
          }),
          labelBlock('Категория:', b.category, W.accent),
          bodyText(b.description, { color: W.text_sec, indent: 0.15 }),
          labelBlock('Решение:', b.fix, W.success),
        );
        if (b.impact) children.push(labelBlock('Эффект:', b.impact, W.success));
        children.push(hrLine());
      });
    }

    if (cro.quick_wins?.length > 0) {
      children.push(subTitle('Быстрые победы'));
      cro.quick_wins.forEach((w, i) => {
        children.push(new Paragraph({
          spacing: { before: 60, after: 60 },
          indent: { left: convertInchesToTwip(0.2) },
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, color: W.success, size: 20, font: 'Arial' }),
            new TextRun({ text: w, color: W.text, size: 20, font: 'Arial' }),
          ],
        }));
      });
    }

    if (cro.fix_cost_estimate) {
      const fc = cro.fix_cost_estimate;
      const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
      children.push(
        subTitle('Стоимость исправления'),
        new Paragraph({
          spacing: { before: 100, after: 100 },
          children: [new TextRun({
            text: `${fmt(fc.min)} — ${fmt(fc.max)}`,
            bold: true, size: 28, color: W.accent, font: 'Arial',
          })],
        }),
      );
      if (fc.breakdown?.length > 0) {
        fc.breakdown.forEach((line) => {
          children.push(new Paragraph({
            spacing: { before: 40, after: 40 },
            indent: { left: convertInchesToTwip(0.2) },
            children: [
              new TextRun({ text: '• ', color: W.text_sec, size: 18, font: 'Arial' }),
              new TextRun({ text: line, color: W.text, size: 18, font: 'Arial' }),
            ],
          }));
        });
      }
      if (fc.roi_months > 0) {
        children.push(bodyText(`Окупается за ${fc.roi_months} мес.`, { color: W.success, bold: true }));
      }
    }

    if (cro.cta_recommendation) {
      children.push(
        new Paragraph({ spacing: { before: 300 }, children: [] }),
        hrLine(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          shading: { type: ShadingType.CLEAR, color: W.bg_alt, fill: W.bg_alt },
          children: [new TextRun({
            text: cro.cta_recommendation,
            bold: true, color: W.accent, size: 22, font: 'Arial',
          })],
        }),
      );
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', color: W.text, size: 20 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', run: { bold: true, color: W.accent, size: 32, font: 'Arial' }, paragraph: { spacing: { before: 240, after: 240 } } },
        { id: 'Heading2', name: 'Heading 2', run: { bold: true, color: W.accent, size: 26, font: 'Arial' }, paragraph: { spacing: { before: 180, after: 180 } } },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: convertInchesToTwip(0.8), bottom: convertInchesToTwip(0.8), left: convertInchesToTwip(0.9), right: convertInchesToTwip(0.9) },
          size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [
              new TextRun({ text: `OWNDEV  ·  GEO-аудит  ·  ${data.domain}  ·  `, color: W.text_sec, size: 14, font: 'Arial' }),
              new TextRun({ children: ['стр. ', PageNumber.CURRENT], color: W.text_sec, size: 14, font: 'Arial' }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: W.accent } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: W.border } },
            children: [
              new TextRun({ text: `OWNDEV.ru — первый GEO и AI-ready аудит  ·  ${formatDate()}`, color: W.text_sec, size: 14, font: 'Arial' }),
            ],
          })],
        }),
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const fileName = `owndev_audit_${data.domain}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName);
}
