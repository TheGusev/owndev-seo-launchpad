import {
  Document, Packer, Paragraph, TextRun, Table, TableRow,
  TableCell, WidthType, HeadingLevel, AlignmentType,
  BorderStyle, ShadingType, TableLayoutType,
  PageBreak, Header, Footer, PageNumber,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import {
  getSeverityLabel, getCategoryLabel,
  getScoreStatus, calcPotentialGain,
  formatDate, truncate, ReportData,
} from './reportHelpers';

const W = {
  purple: '8B5CF6', bg_dark: '0A0A0F', bg_card: '12121A',
  gray: '6B7280', white: 'FFFFFF',
  critical: 'EF4444', high: 'F97316', medium: 'EAB308', low: '6B7280',
  success: '10B981', info: '3B82F6',
};

const getSevColorW = (severity: string): string => {
  const map: Record<string, string> = { critical: W.critical, high: W.high, medium: W.medium, low: W.low };
  return map[severity] || W.low;
};

const sectionTitle = (text: string): Paragraph =>
  new Paragraph({
    spacing: { before: 400, after: 200 },
    shading: { type: ShadingType.CLEAR, color: '1A0A3A', fill: '1A0A3A' },
    indent: { left: convertInchesToTwip(0.1) },
    children: [new TextRun({ text, bold: true, color: W.purple, size: 32, font: 'Calibri' })],
  });

const subTitle = (text: string): Paragraph =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, color: 'A78BFA', size: 26, font: 'Calibri' })],
  });

const bodyText = (text: string, options?: { bold?: boolean; color?: string; size?: number; indent?: number }): Paragraph =>
  new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: options?.indent ? { left: convertInchesToTwip(options.indent) } : undefined,
    children: [new TextRun({ text, bold: options?.bold, color: options?.color || W.white, size: options?.size || 20, font: 'Calibri' })],
  });

const labelBlock = (label: string, text: string, labelColor: string): Paragraph =>
  new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({ text: `${label} `, bold: true, color: labelColor, size: 18, font: 'Calibri' }),
      new TextRun({ text, color: W.white, size: 18, font: 'Calibri' }),
    ],
  });

const pageBreakP = (): Paragraph => new Paragraph({ children: [new PageBreak()] });

const hrLine = (): Paragraph =>
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: W.purple } },
    spacing: { before: 100, after: 100 },
    children: [],
  });

const createStyledTable = (headers: string[], rows: string[][], colWidths: number[]): Table => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, color: '3D1B8A', fill: '3D1B8A' },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: W.white, size: 18, font: 'Calibri' })], alignment: AlignmentType.CENTER })],
    })),
  });
  const dataRows = rows.map((row, rowIdx) =>
    new TableRow({
      children: row.map((cell, colIdx) => new TableCell({
        width: { size: colWidths[colIdx], type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, color: rowIdx % 2 === 0 ? '12121A' : '1A1A2E', fill: rowIdx % 2 === 0 ? '12121A' : '1A1A2E' },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: cell, color: W.white, size: 17, font: 'Calibri' })] })],
      })),
    }),
  );
  return new Table({ layout: TableLayoutType.FIXED, width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...dataRows] });
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
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'OWNDEV', bold: true, size: 72, color: W.purple, font: 'Calibri' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 400 }, children: [new TextRun({ text: 'GEO и AI-ready аудит сайта', size: 24, color: W.gray, font: 'Calibri' })] }),
    hrLine(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: 'ОТЧЁТ АУДИТА САЙТА', bold: true, size: 48, color: W.white, font: 'Calibri' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 }, children: [new TextRun({ text: truncate(data.url, 70), size: 28, color: W.purple, font: 'Calibri', bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 }, children: [new TextRun({ text: `Тематика: ${data.theme}`, size: 22, color: W.gray, font: 'Calibri' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 600 }, children: [new TextRun({ text: `Дата: ${formatDate(new Date(data.scanDate))}`, size: 22, color: W.gray, font: 'Calibri' })] }),
    hrLine(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300, after: 100 }, children: [new TextRun({ text: 'ИТОГОВЫЕ ОЦЕНКИ', bold: true, size: 24, color: W.purple, font: 'Calibri' })] }),
  );

  children.push(createStyledTable(
    ['Общий', 'SEO', 'Директ', 'Schema', 'AI'],
    [[String(data.scores.total), String(data.scores.seo), String(data.scores.direct), String(data.scores.schema), String(data.scores.ai)]],
    [20, 20, 20, 20, 20],
  ));

  children.push(
    new Paragraph({ spacing: { before: 200 }, children: [] }),
    bodyText(`Найдено: ${data.issues.length} проблем · ${critCount} критических · Потенциальный прирост: +${gain} баллов`, { color: W.gray }),
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
    bodyText(`Исправьте ${critCount} критических ошибок → оценка вырастет на ~+${gain} баллов`, { color: W.gray }),
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
          new TextRun({ text: `${idx + 1}. `, bold: true, color: sevColor, size: 22, font: 'Calibri' }),
          new TextRun({ text: `[${getSeverityLabel(issue.severity).toUpperCase()}] `, bold: true, color: sevColor, size: 20, font: 'Calibri' }),
          new TextRun({ text: issue.title || '', bold: true, color: W.white, size: 22, font: 'Calibri' }),
          new TextRun({ text: `  +${issue.impact_score || 0} балл.`, color: '10B981', size: 18, font: 'Calibri' }),
        ],
      }),
      labelBlock('Категория:', getCategoryLabel(issue.category || issue.module || ''), W.purple),
      labelBlock('Где:', issue.where || issue.location || '—', W.gray),
    );

    if (issue.description) children.push(bodyText(issue.description, { color: W.gray }));

    if (issue.why_important || issue.why_it_matters) {
      children.push(
        new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: 'ПОЧЕМУ ЭТО ВАЖНО:', bold: true, color: 'EAB308', size: 18, font: 'Calibri' })] }),
        bodyText(issue.why_important || issue.why_it_matters, { color: W.white, indent: 0.2 }),
      );
    }

    if (issue.how_to_fix) {
      children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: 'КАК ИСПРАВИТЬ:', bold: true, color: '10B981', size: 18, font: 'Calibri' })] }));
      (issue.how_to_fix as string).split('\n').filter((s: string) => s.trim()).forEach((step: string) => {
        children.push(new Paragraph({ spacing: { before: 40, after: 40 }, indent: { left: convertInchesToTwip(0.25) }, children: [new TextRun({ text: step.trim(), color: W.white, size: 18, font: 'Calibri' })] }));
      });
    }

    if (issue.example || issue.example_fix) {
      children.push(
        new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: 'ПРИМЕР:', bold: true, color: '10B981', size: 18, font: 'Calibri' })] }),
        new Paragraph({
          spacing: { before: 60, after: 60 }, indent: { left: convertInchesToTwip(0.2) },
          shading: { type: ShadingType.CLEAR, color: '0D1117', fill: '0D1117' },
          children: [new TextRun({ text: issue.example || issue.example_fix, color: '10B981', size: 16, font: 'Courier New' })],
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
        { color: W.gray },
      ));
    }

    const compHeaders = ['Сайт', 'Слов', 'H2', 'FAQ', 'Цены', 'Отзывы', 'Schema', 'Видео'];
    const compRows: string[][] = [
      [`★ ${data.domain}`, String(data.comparisonTable?.your_site?.content_length_words || '—'), String(data.seoData?.h2Count || '—'),
        data.seoData?.hasFaq ? '✓' : '✗', data.seoData?.hasPriceBlock ? '✓' : '✗', data.seoData?.hasReviews ? '✓' : '✗',
        data.seoData?.hasSchema ? '✓' : '✗', data.seoData?.hasVideo ? '✓' : '✗'],
      ...competitors.map((c: any) => [
        `#${c.position} ${c.domain}`, String(c.content_length_words || 0), String(c.h2_count || 0),
        c.has_faq ? '✓' : '✗', c.has_price_block ? '✓' : '✗', c.has_reviews ? '✓' : '✗',
        c.has_schema ? '✓' : '✗', c.has_video ? '✓' : '✗',
      ]),
    ];
    if (data.comparisonTable) {
      const avg = data.comparisonTable.avg_top10;
      compRows.push(['СРЕДНЕЕ', String(avg?.content_length_words || 0), String(avg?.h2_count || 0),
        avg?.has_faq ? '✓' : '—', avg?.has_price_block ? '✓' : '—', avg?.has_reviews ? '✓' : '—',
        avg?.has_schema ? '✓' : '—', avg?.has_video ? '✓' : '—']);
    }
    children.push(createStyledTable(compHeaders, compRows, [24, 10, 8, 8, 8, 10, 10, 8]));

    if (data.comparisonTable?.insights?.length) {
      children.push(subTitle('Что взять у конкурентов'));
      data.comparisonTable.insights.forEach((insight: string) => {
        children.push(new Paragraph({
          spacing: { before: 100, after: 100 },
          shading: { type: ShadingType.CLEAR, color: '1A1A2E', fill: '1A1A2E' },
          indent: { left: convertInchesToTwip(0.1) },
          children: [new TextRun({ text: insight, color: W.white, size: 19, font: 'Calibri' })],
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
      bodyText('Добавьте на уровне аккаунта в Яндекс.Директ:', { color: W.gray }),
    );
    const catNames: Record<string, string> = { informational: 'Информационные', irrelevant: 'Нерелевантные', competitor: 'Конкуренты', geo: 'Регионы', other: 'Прочие', general: 'Общие' };
    const groups: Record<string, any[]> = {};
    data.minusWords.forEach((w: any) => { const cat = w.category || w.type || 'other'; if (!groups[cat]) groups[cat] = []; groups[cat].push(w); });
    const minusRows = Object.entries(groups).map(([cat, words]) => [catNames[cat] || cat, words.map((w: any) => `-${w.word}`).join(', '), String(words.length)]);
    children.push(createStyledTable(['Категория', 'Минус-слова', 'Кол-во'], minusRows, [18, 70, 12]));
    children.push(
      subTitle('Строка для вставки в Яндекс.Директ:'),
      new Paragraph({
        spacing: { before: 100, after: 100 },
        shading: { type: ShadingType.CLEAR, color: '0D1117', fill: '0D1117' },
        children: [new TextRun({ text: data.minusWords.map((w: any) => `-${w.word}`).join(' '), color: '10B981', size: 16, font: 'Courier New' })],
      }),
      pageBreakP(),
    );
  }

  // Action plan
  children.push(
    sectionTitle('ПРИОРИТЕТНЫЙ ПЛАН ДЕЙСТВИЙ'),
    bodyText('Выполните эти шаги последовательно — сайт выйдет в топ.', { color: W.gray }),
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
        new TextRun({ text: `${idx + 1}. `, bold: true, color: sevColor, size: 22, font: 'Calibri' }),
        new TextRun({ text: issue.title || '', bold: true, color: W.white, size: 22, font: 'Calibri' }),
        new TextRun({ text: `  → +${issue.impact_score || 0} баллов`, color: '10B981', size: 18, font: 'Calibri' }),
      ],
    }));
  });

  children.push(
    new Paragraph({ spacing: { before: 400 }, children: [] }),
    hrLine(),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: 'Сгенерировано: OWNDEV.ru — GEO и AI-ready аудит', color: W.gray, size: 18, font: 'Calibri' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Следующий аудит рекомендуется через 30 дней', color: W.gray, size: 16, font: 'Calibri' })] }),
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', color: W.white, size: 20 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', run: { bold: true, color: W.purple, size: 32, font: 'Calibri' }, paragraph: { spacing: { before: 240, after: 240 } } },
        { id: 'Heading2', name: 'Heading 2', run: { bold: true, color: 'A78BFA', size: 26, font: 'Calibri' }, paragraph: { spacing: { before: 180, after: 180 } } },
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
              new TextRun({ text: `OWNDEV  ·  GEO-аудит  ·  ${data.domain}  ·  `, color: W.gray, size: 14, font: 'Calibri' }),
              new TextRun({ children: ['стр. ', PageNumber.CURRENT], color: W.gray, size: 14, font: 'Calibri' }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: W.purple } },
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: '3D1B8A' } },
            children: [
              new TextRun({ text: `OWNDEV.ru — первый GEO и AI-ready аудит  ·  ${formatDate()}`, color: W.gray, size: 14, font: 'Calibri' }),
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
