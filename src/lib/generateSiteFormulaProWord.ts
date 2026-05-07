/**
 * Site Formula PRO — генератор DOCX-отчёта.
 *
 * Источник правды — PipelineResultV3 + входные данные (бренд, тип, услуги).
 * Структура повторяет FREE-отчёт и расширяется:
 *   1. Сводка о проекте
 *   2. Архитектурный blueprint (страницы + интенты + слои)
 *   3. Реальный спрос из Wordstat (кластеры × города)
 *   4. Preflight 4-осей (построчно + gap-анализ)
 *   5. Технический паспорт (llms.txt + robots + 17 AI-ботов)
 *   6. Super-prompt для AI-разработчика
 *   7. Обоснование решений
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import type { PipelineResultV3 } from '@/lib/api/formulaV3';

export interface ProReportContext {
  result: PipelineResultV3;
  brand: {
    name: string;
    industry: string;
    primary_city?: string;
    cities?: string[];
    services?: string[];
    project_code: string;
    project_label?: string;
  };
}

const ACCENT = '7C3AED';
const MUTED = '6B7280';

function p(text: string, opts: any = {}): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: opts.size ?? 20, ...opts })],
    spacing: opts.spacing,
    indent: opts.indent,
  });
}

function h1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 28, color: '1A1A1A' })],
    border: { bottom: { color: ACCENT, size: 6, space: 1, style: BorderStyle.SINGLE } },
    spacing: { before: 280, after: 140 },
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 22, color: '1A1A1A' })],
    spacing: { before: 200, after: 100 },
  });
}

function caption(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 16, color: MUTED })],
    spacing: { before: 120, after: 60 },
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 20 })],
    indent: { left: 360 },
  });
}

function kv(key: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${key}: `, bold: true, size: 20 }),
      new TextRun({ text: value, size: 20 }),
    ],
  });
}

function tableTwoCol(rows: Array<[string, string]>): Table {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [3200, 5800],
    rows: rows.map(
      ([k, v]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 3200, type: WidthType.DXA },
              shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({ children: [new TextRun({ text: k, bold: true, size: 20 })] }),
              ],
            }),
            new TableCell({
              width: { size: 5800, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: v, size: 20 })] })],
            }),
          ],
        }),
    ),
  });
}

export async function generateSiteFormulaProWord(ctx: ProReportContext): Promise<Blob> {
  const { result, brand } = ctx;
  const dt = new Date(result.generated_at).toLocaleDateString('ru-RU');
  const children: any[] = [];

  // ─── Cover ──────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'OwnDev Site Formula PRO', bold: true, size: 44, color: ACCENT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Расширенный архитектурный отчёт', size: 22, color: MUTED })],
      spacing: { after: 240 },
    }),
  );

  // ─── 1. Сводка о проекте ────────────────────────────────────────────────
  children.push(h1('1. Сводка о проекте'));
  children.push(
    tableTwoCol([
      ['Бренд', brand.name],
      ['Отрасль', brand.industry],
      ['Тип проекта', brand.project_label ?? brand.project_code],
      ['Основной город', brand.primary_city ?? '—'],
      ['Все города работы', (brand.cities ?? []).join(', ') || '—'],
      ['URL', result.root_url ?? 'не задан (домен ещё не куплен)'],
      ['Услуги / направления', (brand.services ?? []).join(', ') || '— (не заданы вручную)'],
      ['Сгенерировано', dt],
      ['Job ID', result.job_id],
    ]),
  );
  children.push(p('', { spacing: { after: 200 } }));

  // ─── 2. Архитектурный blueprint ─────────────────────────────────────────
  const strategy: any = (result as any).strategy;
  if (strategy) {
    children.push(h1('2. Архитектурный blueprint'));
    children.push(p('Структура сайта собрана автоматически по типу проекта и рекомендованной географии.'));
    if (strategy.recommended_geos?.length) {
      children.push(kv('Рекомендованная гео', strategy.recommended_geos.join(', ')));
    }
    if (Array.isArray(strategy.pages) && strategy.pages.length > 0) {
      children.push(h2(`Страницы сайта (${strategy.pages.length})`));
      for (const pg of strategy.pages) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${pg.page_type}`, bold: true, size: 22, color: ACCENT }),
              new TextRun({ text: `   ${pg.url_pattern}`, size: 18, color: MUTED }),
            ],
            spacing: { before: 140, after: 40 },
          }),
        );
        if (pg.contract?.h1_template) {
          children.push(kv('H1', pg.contract.h1_template));
        }
        if (pg.contract?.intro_answer_template) {
          children.push(kv('Описание', String(pg.contract.intro_answer_template)));
        }
        if (Array.isArray(pg.contract?.required_schema_graph)) {
          children.push(kv('Schema-граф', pg.contract.required_schema_graph.join(', ') || '—'));
        }
        if (Array.isArray(pg.contract?.required_blocks)) {
          children.push(kv('Обязательные блоки', pg.contract.required_blocks.join(', ') || '—'));
        }
      }
    }
  }

  // ─── 3. Wordstat — реальный спрос ───────────────────────────────────────
  const demand: any = (result as any).demand;
  children.push(h1('3. Реальный спрос (Wordstat)'));
  if (!demand || !Array.isArray(demand.clusters) || demand.clusters.length === 0) {
    children.push(
      p(
        'Спрос не запрошен — список услуг был пустым, поэтому Wordstat был пропущен. Чтобы получить реальные частоты — заполните поле «Что вы делаете» в форме.',
        { color: MUTED, italics: true },
      ),
    );
  } else {
    children.push(kv('Всего кластеров', String(demand.clusters.length)));
    if (demand.total_volume) children.push(kv('Суммарный объём', String(demand.total_volume)));
    if (demand.recommended_geos?.length) children.push(kv('География', demand.recommended_geos.join(', ')));
    children.push(h2('Топ-кластеры'));
    for (const c of demand.clusters.slice(0, 30)) {
      const head = c.head_keyword ?? c.head ?? c.cluster_name ?? '—';
      const vol = c.total_volume ?? c.volume ?? 0;
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${head}`, bold: true, size: 20 }),
            new TextRun({ text: `   ${vol} показов/мес`, size: 18, color: MUTED }),
          ],
          indent: { left: 200 },
        }),
      );
      if (Array.isArray(c.keywords) && c.keywords.length > 0) {
        const kws = c.keywords.slice(0, 6).map((k: any) => k.keyword ?? k).join(', ');
        children.push(p(`   ${kws}`, { size: 18, color: MUTED, indent: { left: 360 } }));
      }
    }
  }

  // ─── 4. Preflight 4-осей ────────────────────────────────────────────────
  children.push(h1('4. Preflight 4-осей'));
  if (result.preflight_rollup) {
    const r = result.preflight_rollup;
    children.push(
      tableTwoCol([
        ['Всего страниц проверено', String(r.total_pages)],
        ['Прошли preflight', `${r.pages_passed} / ${r.total_pages}`],
        ['Не прошли', String(r.pages_failed)],
        ['SEO средний', `${r.axis_avg.seo} (порог 85)`],
        ['Direct средний', `${r.axis_avg.direct} (порог 90)`],
        ['Schema средний', `${r.axis_avg.schema} (порог 100)`],
        ['AI / LLM средний', `${r.axis_avg.ai_llm} (порог 85)`],
        ['Итог', `${r.avg_total_score} / 100`],
      ]),
    );
    if (r.failed_p0_codes?.length) {
      children.push(h2('Критические fail-коды (P0)'));
      for (const code of r.failed_p0_codes) children.push(bullet(code));
    }

    const reports: any[] = (result as any).preflight_per_page ?? [];
    if (reports.length > 0) {
      children.push(h2(`Постраничный аудит (${reports.length})`));
      for (const rep of reports.slice(0, 20)) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${rep.url}`, bold: true, size: 20 }),
              new TextRun({ text: `   total ${rep.total_score}`, size: 18, color: rep.passed ? '0E8A4F' : 'B91C1C' }),
            ],
            spacing: { before: 140, after: 40 },
          }),
        );
        if (Array.isArray(rep.axes)) {
          for (const ax of rep.axes) {
            children.push(p(`   ${ax.axis}: ${ax.score}`, { size: 18, indent: { left: 200 } }));
          }
        }
        if (Array.isArray(rep.failed_p0) && rep.failed_p0.length > 0) {
          children.push(p(`   ⚠ P0: ${rep.failed_p0.join(', ')}`, { size: 18, color: 'B91C1C', indent: { left: 200 } }));
        }
      }
    }
  } else {
    children.push(
      p('Preflight не выполнялся — у проекта пока нет домена или сбор сайта был пропущен.', {
        color: MUTED,
        italics: true,
      }),
    );
  }

  // ─── 5. Технический паспорт ─────────────────────────────────────────────
  const passport: any = (result as any).passport;
  if (passport) {
    children.push(h1('5. Файлы для размещения на сайте — копируйте как есть'));
    children.push(
      p(
        'Раздел содержит готовые файлы и фрагменты, которые нужно разместить на сайте. Это ключ к 100/100 в GEO-аудите — без этих файлов ПС и AI-боты не понимают ваш сайт. Блоки описывают, в какой файл/раздел копировать содержимое.',
      ),
    );
    if (passport.llms_txt) {
      children.push(caption('5.1. /llms.txt — разместить в корне сайта'));
      children.push(p(String(passport.llms_txt), { size: 16 }));
    }
    if (passport.robots_txt) {
      children.push(caption('5.2. /robots.txt — разместить в корне сайта'));
      children.push(p(String(passport.robots_txt), { size: 16 }));
    }
    if (passport.sitemap_xml) {
      children.push(caption('5.3. /sitemap.xml — разместить в корне сайта'));
      children.push(p(String(passport.sitemap_xml), { size: 16 }));
    }
    if (passport.ai_well_known) {
      children.push(caption('5.4. /.well-known/ai — карта 17 AI-ботов и политика обучения'));
      const txt =
        typeof passport.ai_well_known === 'string'
          ? passport.ai_well_known
          : JSON.stringify(passport.ai_well_known, null, 2);
      children.push(p(txt, { size: 16 }));
    }
    if (passport.json_ld_script) {
      children.push(caption('5.5. JSON-LD graph — вставить в <head> каждой страницы'));
      children.push(
        p(
          'Organization + WebSite + BreadcrumbList — обязательный минимум для rich-snippets и понимания ПС/AI «что за бренд и сайт».',
          { size: 16, italics: true, color: MUTED },
        ),
      );
      children.push(p(String(passport.json_ld_script), { size: 16 }));
    }
    if (passport.base_head) {
      children.push(caption('5.6. Базовый <head>-блок — общий для всех страниц'));
      children.push(p(String(passport.base_head), { size: 16 }));
    }
    if (Array.isArray(passport.head_per_page) && passport.head_per_page.length > 0) {
      children.push(caption('5.7. Шаблоны <head> по типам страниц'));
      children.push(
        p(
          'На каждый тип страницы из стратегии — свой набор title/description/canonical/OG/Twitter. Копируйте в соответствующую страницу.',
          { size: 16, italics: true, color: MUTED },
        ),
      );
      for (const entry of passport.head_per_page.slice(0, 12)) {
        children.push(
          p(`— ${entry.page_type}  (${entry.url_pattern})`, { bold: true, size: 18 }),
        );
        children.push(p(String(entry.head_html), { size: 14 }));
      }
    }
  }

  // ─── 6. Super-prompt для AI-разработчика ────────────────────────────────
  const pack: any = (result as any).pack;
  if (pack) {
    children.push(h1('6. Super-prompt для AI-разработчика'));
    if (pack.role_prompt) {
      children.push(caption('Роль'));
      children.push(p(String(pack.role_prompt).slice(0, 4000)));
    }
    if (pack.task_prompt) {
      children.push(caption('Задача'));
      children.push(p(String(pack.task_prompt).slice(0, 4000)));
    }
    if (pack.acceptance_criteria) {
      children.push(caption('Критерии приёмки'));
      const arr = Array.isArray(pack.acceptance_criteria)
        ? pack.acceptance_criteria
        : [pack.acceptance_criteria];
      for (const it of arr) children.push(bullet(String(it)));
    }
    if (pack.export_mode) {
      children.push(p('', { spacing: { before: 100 } }));
      children.push(kv('Режим экспорта', String(pack.export_mode)));
      if (pack.platform_target) children.push(kv('Целевая платформа', String(pack.platform_target)));
    }
  }

  // ─── 7. Этапы pipeline (что было выполнено) ─────────────────────────────
  if (Array.isArray(result.stages) && result.stages.length > 0) {
    children.push(h1('7. Этапы pipeline'));
    for (const st of result.stages) {
      const status = st.ok ? '✓' : '✗';
      children.push(p(`${status}  ${st.stage} — ${st.duration_ms}ms${st.error ? ` (${st.error})` : ''}`));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Arial' } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
