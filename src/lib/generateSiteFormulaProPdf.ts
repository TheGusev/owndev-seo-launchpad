/**
 * Site Formula PRO — генератор PDF-отчёта.
 * Параллель к generateSiteFormulaProWord — те же 7 разделов, A4, кириллица.
 */
import { jsPDF } from 'jspdf';
import { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } from '@/fonts/roboto-base64';
import { PRINT_COLORS } from '@/lib/reportHelpers';
import type { ProReportContext } from '@/lib/generateSiteFormulaProWord';
import { explainP0Code } from '@/lib/p0Dictionary';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

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
    return MARGIN + 4;
  }
  return y;
}

function drawSectionHeader(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 14);
  doc.setFillColor(PRINT_COLORS.bg_header);
  doc.rect(MARGIN, y - 5, CONTENT_W, 9, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(PRINT_COLORS.text);
  doc.text(title, MARGIN + 2, y + 1);
  return y + 11;
}

function drawSubHeader(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 8);
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(PRINT_COLORS.text);
  doc.text(title, MARGIN, y);
  return y + 6;
}

function drawCaption(doc: jsPDF, y: number, label: string): number {
  y = ensureSpace(doc, y, 6);
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PRINT_COLORS.text_secondary);
  doc.text(label.toUpperCase(), MARGIN, y);
  return y + 4;
}

function drawText(doc: jsPDF, y: number, text: string, opts: { size?: number; bold?: boolean; color?: string } = {}): number {
  const { size = 10, bold = false, color = PRINT_COLORS.text } = opts;
  doc.setFont('Roboto', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(color);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  y = ensureSpace(doc, y, lines.length * (size * 0.4));
  doc.text(lines, MARGIN, y);
  return y + lines.length * (size * 0.4) + 1;
}

function drawKv(doc: jsPDF, y: number, key: string, value: string): number {
  y = ensureSpace(doc, y, 6);
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(PRINT_COLORS.text);
  doc.text(`${key}:`, MARGIN, y);
  doc.setFont('Roboto', 'normal');
  doc.setTextColor(PRINT_COLORS.text);
  const lines = doc.splitTextToSize(value, CONTENT_W - 50);
  doc.text(lines, MARGIN + 50, y);
  y += Math.max(5, lines.length * 4) + 1;
  return y;
}

function drawBullet(doc: jsPDF, y: number, text: string): number {
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(PRINT_COLORS.text);
  const lines = doc.splitTextToSize(`• ${text}`, CONTENT_W - 4);
  y = ensureSpace(doc, y, lines.length * 4);
  doc.text(lines, MARGIN + 2, y);
  return y + lines.length * 4 + 1;
}

export async function generateSiteFormulaProPdf(ctx: ProReportContext): Promise<Blob> {
  const { result, brand } = ctx;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  setupFonts(doc);

  // ── Cover ───────────────────────────────────────────────────────────────
  doc.setFillColor(PRINT_COLORS.accent);
  doc.rect(0, 0, PAGE_W, 32, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(22);
  doc.setTextColor('#ffffff');
  doc.text('OwnDev Site Formula PRO', MARGIN, 18);
  doc.setFontSize(11);
  doc.setFont('Roboto', 'normal');
  doc.text('Расширенный архитектурный отчёт', MARGIN, 26);

  let y = 44;

  // ── 1. Сводка о проекте ────────────────────────────────────────────────
  y = drawSectionHeader(doc, y, '1. Сводка о проекте');
  y = drawKv(doc, y, 'Бренд', brand.name);
  y = drawKv(doc, y, 'Отрасль', brand.industry);
  y = drawKv(doc, y, 'Тип проекта', brand.project_label ?? brand.project_code);
  if (brand.primary_city) y = drawKv(doc, y, 'Основной город', brand.primary_city);
  if (brand.cities?.length) y = drawKv(doc, y, 'Все города', brand.cities.join(', '));
  y = drawKv(doc, y, 'URL', result.root_url ?? 'не задан');
  if (brand.services?.length) y = drawKv(doc, y, 'Услуги', brand.services.join(', '));
  y = drawKv(doc, y, 'Сгенерировано', new Date(result.generated_at).toLocaleDateString('ru-RU'));
  y = drawKv(doc, y, 'Job ID', result.job_id);
  y += 4;

  // ── 1.5. KEY DECISIONS — архитектурные решения (PR-16) ─────────────────
  // Источник: pro_report.project_class + decision_trace из engine_state v1.
  // Раздел рисуется только когда есть engine_state — иначе ничего не выводим.
  const pro: any = (result as any).pro_report ?? {};
  const decisionTrace: any[] = Array.isArray(pro.decision_trace) ? pro.decision_trace : [];
  if (pro.project_class || decisionTrace.length > 0) {
    y = drawSectionHeader(doc, y, '1.5. Ключевые архитектурные решения (KEY DECISIONS)');
    y = drawText(
      doc,
      y,
      'Список архитектурных решений, которые движок выбрал для вашего проекта. Каждый пункт — ответ на вопрос «как этот сайт должен быть устроен», полученный детерминированно из ваших ответов в free-форме SiteFormula.',
      { size: 9, color: PRINT_COLORS.text_secondary },
    );
    if (pro.project_class) {
      y = drawKv(
        doc,
        y,
        'Класс проекта',
        `${String(pro.project_class).toUpperCase()}${
          pro.project_class_reason ? ` — ${pro.project_class_reason}` : ''
        }`,
      );
    }
    if (decisionTrace.length > 0) {
      y = drawSubHeader(doc, y, 'Решения движка');
      for (const t of decisionTrace.slice(0, 30)) {
        const reason = t?.reason ?? t?.outcome ?? '';
        if (t?.rule_id) {
          y = drawText(doc, y, `• ${t.rule_id}: ${reason}`, { size: 9 });
        } else if (reason) {
          y = drawBullet(doc, y, String(reason));
        }
      }
    }
    y += 4;
  }

  // ── 2. Архитектурный blueprint ─────────────────────────────────────────
  const strategy: any = (result as any).strategy;
  if (strategy) {
    y = drawSectionHeader(doc, y, '2. Архитектурный blueprint');
    if (strategy.recommended_geos?.length) {
      y = drawKv(doc, y, 'Рекомендованная гео', strategy.recommended_geos.join(', '));
    }
    if (Array.isArray(strategy.pages) && strategy.pages.length > 0) {
      y = drawSubHeader(doc, y, `Страницы сайта (${strategy.pages.length})`);
      for (const pg of strategy.pages) {
        y = ensureSpace(doc, y, 10);
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(PRINT_COLORS.accent);
        doc.text(pg.page_type, MARGIN, y);
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(PRINT_COLORS.text_secondary);
        doc.text(`   ${pg.url_pattern}`, MARGIN + 40, y);
        y += 4;
        if (pg.contract?.h1_template) y = drawText(doc, y, `H1: ${pg.contract.h1_template}`, { size: 9 });
        if (Array.isArray(pg.contract?.required_schema_graph) && pg.contract.required_schema_graph.length) {
          y = drawText(doc, y, `Schema: ${pg.contract.required_schema_graph.join(', ')}`, {
            size: 8,
            color: PRINT_COLORS.text_secondary,
          });
        }
        y += 1;
      }
    }
  }

  // ── 3. Wordstat ────────────────────────────────────────────────────────
  y = drawSectionHeader(doc, y, '3. Реальный спрос (Wordstat)');
  const demand: any = (result as any).demand;
  if (!demand || !Array.isArray(demand.clusters) || demand.clusters.length === 0) {
    y = drawText(
      doc,
      y,
      'Спрос не запрошен — список услуг был пустым, поэтому Wordstat был пропущен. Заполните поле «Что вы делаете» в форме, чтобы получить реальные частоты.',
      { size: 9, color: PRINT_COLORS.text_secondary },
    );
  } else {
    y = drawKv(doc, y, 'Всего кластеров', String(demand.clusters.length));
    if (demand.total_volume) y = drawKv(doc, y, 'Суммарный объём', String(demand.total_volume));
    y = drawSubHeader(doc, y, 'Топ-кластеры');
    // PR-16: фактическая структура DemandClusterV3 — { cluster_label, total_frequency, keywords: { phrase, frequency }[] }.
    // Старые fallback'и (head_keyword/total_volume/k.keyword) давали '—' и [object Object].
    for (const c of demand.clusters.slice(0, 30)) {
      const head =
        c.cluster_label ?? c.head_keyword ?? c.head ?? c.cluster_name ?? c.seed_keyword ?? '—';
      const vol = c.total_frequency ?? c.total_volume ?? c.volume ?? 0;
      y = drawText(doc, y, `${head}  —  ${Number(vol).toLocaleString('ru-RU')} показов/мес`, {
        size: 9,
        bold: true,
      });
      if (Array.isArray(c.keywords) && c.keywords.length > 0) {
        const kws = c.keywords
          .slice(0, 6)
          .map((k: any) => {
            if (typeof k === 'string') return k;
            return k?.phrase ?? k?.keyword ?? '';
          })
          .filter(Boolean)
          .join(', ');
        if (kws) y = drawText(doc, y, `   ${kws}`, { size: 8, color: PRINT_COLORS.text_secondary });
      }
    }
  }
  y += 4;

  // ── 4. Preflight 4-осей ────────────────────────────────────────────────
  y = drawSectionHeader(doc, y, '4. Preflight 4-осей');
  if (result.preflight_rollup) {
    const r = result.preflight_rollup;
    y = drawKv(doc, y, 'Всего страниц', String(r.total_pages));
    y = drawKv(doc, y, 'Прошли preflight', `${r.pages_passed} из ${r.total_pages}`);
    y = drawKv(doc, y, 'SEO', `${r.axis_avg.seo} (порог 85)`);
    y = drawKv(doc, y, 'Direct', `${r.axis_avg.direct} (порог 90)`);
    y = drawKv(doc, y, 'Schema', `${r.axis_avg.schema} (порог 100)`);
    y = drawKv(doc, y, 'AI / LLM', `${r.axis_avg.ai_llm} (порог 85)`);
    y = drawKv(doc, y, 'Итог', `${r.avg_total_score} / 100`);
    if (r.failed_p0_codes?.length) {
      y = drawSubHeader(doc, y, 'Критические fail-коды (P0) — что это и что делать');
      for (const code of r.failed_p0_codes) {
        const ex = explainP0Code(code);
        y = drawText(doc, y, `${code}: ${ex.title}`, { size: 9, bold: true, color: '#B91C1C' });
        y = drawText(doc, y, ex.why, { size: 8, color: PRINT_COLORS.text_secondary });
        y = drawText(doc, y, `Что делать: ${ex.whatToDo}`, { size: 8 });
      }
    }
    const reports: any[] = (result as any).preflight_per_page ?? [];
    if (reports.length > 0) {
      y = drawSubHeader(doc, y, `Постраничный аудит (${reports.length})`);
      for (const rep of reports.slice(0, 20)) {
        y = drawText(doc, y, `${rep.url} — total ${rep.total_score}`, {
          size: 9,
          bold: true,
          color: rep.passed ? '#0E8A4F' : '#B91C1C',
        });
        if (Array.isArray(rep.axes)) {
          const axesStr = rep.axes.map((a: any) => `${a.axis} ${a.score}`).join(' · ');
          y = drawText(doc, y, axesStr, { size: 8, color: PRINT_COLORS.text_secondary });
        }
        if (Array.isArray(rep.failed_p0) && rep.failed_p0.length > 0) {
          // PR-16: вместо голых кодов выводим краткий title из P0-словаря.
          const labels = rep.failed_p0.map((code: string) => `${code} (${explainP0Code(code).title})`);
          y = drawText(doc, y, `⚠ P0: ${labels.join('; ')}`, { size: 8, color: '#B91C1C' });
        }
      }
    }
  } else {
    y = drawText(
      doc,
      y,
      'Preflight не выполнялся — у проекта пока нет домена или сбор сайта был пропущен.',
      { size: 9, color: PRINT_COLORS.text_secondary },
    );
  }
  y += 4;

  // ── 5. Технический паспорт ─────────────────────────────────────────────
  const passport: any = (result as any).passport;
  if (passport) {
    y = drawSectionHeader(doc, y, '5. Файлы для размещения на сайте — копируйте как есть');
    y = drawText(
      doc,
      y,
      'Раздел содержит готовые файлы и фрагменты для размещения на сайте. Без этих файлов ПС и AI-боты не понимают ваш сайт — из-за пропуска в GEO-аудите баллы падают ниже 70.',
      { size: 9 },
    );
    // PR-16: каждый файл сопровождается триадой «Зачем · Куда положить · Что меняет».
    if (passport.llms_txt) {
      y = drawCaption(doc, y, '5.1. /llms.txt');
      y = drawText(
        doc,
        y,
        'Зачем: официальный стандарт для AI-агентов (ChatGPT, Perplexity, Claude). Описывает структуру сайта и ключевые страницы.',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      y = drawText(doc, y, 'Куда положить: в корень сайта, доступ по /llms.txt.', {
        size: 8,
        color: PRINT_COLORS.text_secondary,
      });
      y = drawText(
        doc,
        y,
        'Что меняет: AI-ассистенты получают навигацию → выше шанс попасть в AI-цитирование.',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      y = drawText(doc, y, String(passport.llms_txt), { size: 8 });
    }
    if (passport.robots_txt) {
      y = drawCaption(doc, y, '5.2. /robots.txt');
      y = drawText(
        doc,
        y,
        'Зачем: правила для поисковых краулеров и AI-ботов (GPTBot, ClaudeBot, PerplexityBot, YandexGPT).',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      y = drawText(doc, y, 'Куда положить: в корень сайта, доступ по /robots.txt.', {
        size: 8,
        color: PRINT_COLORS.text_secondary,
      });
      y = drawText(
        doc,
        y,
        'Что меняет: без явных Allow-правил AI-боты блокируются wildcard-правилами — сайт пропадает из AI-выдачи.',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      y = drawText(doc, y, String(passport.robots_txt), { size: 8 });
    }
    if (passport.sitemap_xml) {
      y = drawCaption(doc, y, '5.3. /sitemap.xml');
      y = drawText(
        doc,
        y,
        'Зачем: карта индексируемых страниц, ускоряет индексацию на 30–50% и помогает с canonical.',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      y = drawText(
        doc,
        y,
        'Куда положить: в корень + прописать в robots.txt строку «Sitemap: https://<домен>/sitemap.xml».',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      y = drawText(
        doc,
        y,
        'Что меняет: страницы попадают в индекс быстрее, поисковик понимает приоритеты обновлений.',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      y = drawText(doc, y, String(passport.sitemap_xml), { size: 8 });
    }
    if (passport.ai_well_known) {
      y = drawCaption(doc, y, '5.4. /.well-known/ai — карта 17 AI-ботов');
      y = drawText(
        doc,
        y,
        'Зачем: явное согласие или запрет на обучение AI-моделей на содержимом сайта.',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      y = drawText(doc, y, 'Куда положить: в каталог /.well-known/ai/ на сайте.', {
        size: 8,
        color: PRINT_COLORS.text_secondary,
      });
      y = drawText(
        doc,
        y,
        'Что меняет: AI-операторы видят политику и привязывают атрибуцию (имя бренда) к цитированиям.',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      const txt =
        typeof passport.ai_well_known === 'string'
          ? passport.ai_well_known
          : JSON.stringify(passport.ai_well_known, null, 2);
      y = drawText(doc, y, txt, { size: 8 });
    }
    if (passport.json_ld_script) {
      y = drawCaption(doc, y, '5.5. JSON-LD graph — в <head> каждой страницы');
      y = drawText(
        doc,
        y,
        'Organization + WebSite + BreadcrumbList — обязательный минимум для rich-snippets.',
        { size: 8, color: PRINT_COLORS.text_secondary },
      );
      y = drawText(doc, y, String(passport.json_ld_script), { size: 8 });
    }
    if (passport.base_head) {
      y = drawCaption(doc, y, '5.6. Базовый <head>-блок для всех страниц');
      y = drawText(doc, y, String(passport.base_head), { size: 8 });
    }
    if (Array.isArray(passport.head_per_page) && passport.head_per_page.length > 0) {
      y = drawCaption(doc, y, '5.7. Шаблоны <head> по типам страниц');
      for (const entry of passport.head_per_page.slice(0, 8)) {
        y = drawText(doc, y, `— ${entry.page_type}  (${entry.url_pattern})`, { size: 9, bold: true });
        y = drawText(doc, y, String(entry.head_html), { size: 7 });
      }
    }
  }

  // ── 6. Super-prompt ────────────────────────────────────────────────────
  const pack: any = (result as any).pack;
  if (pack) {
    y = drawSectionHeader(doc, y, '6. Super-prompt для AI-разработчика');
    if (pack.role_prompt) {
      y = drawCaption(doc, y, 'Роль');
      y = drawText(doc, y, String(pack.role_prompt).slice(0, 3000), { size: 9 });
    }
    if (pack.task_prompt) {
      y = drawCaption(doc, y, 'Задача');
      y = drawText(doc, y, String(pack.task_prompt).slice(0, 3000), { size: 9 });
    }
    if (pack.acceptance_criteria) {
      y = drawCaption(doc, y, 'Критерии приёмки');
      const arr = Array.isArray(pack.acceptance_criteria)
        ? pack.acceptance_criteria
        : [pack.acceptance_criteria];
      for (const it of arr) y = drawBullet(doc, y, String(it));
    }
    if (pack.export_mode) y = drawKv(doc, y, 'Режим экспорта', String(pack.export_mode));
    if (pack.platform_target) y = drawKv(doc, y, 'Платформа', String(pack.platform_target));
  }

  // ── 7. Этапы pipeline ─────────────────────────────────────────────────
  if (Array.isArray(result.stages) && result.stages.length > 0) {
    y = drawSectionHeader(doc, y, '7. Этапы pipeline');
    for (const st of result.stages) {
      const status = st.ok ? '✓' : '✗';
      y = drawBullet(doc, y, `${status} ${st.stage} — ${st.duration_ms}ms${st.error ? ` (${st.error})` : ''}`);
    }
  }

  // ── Footer ─────────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(PRINT_COLORS.text_secondary);
    doc.text(`OwnDev.ru  •  Site Formula PRO  •  ${i} / ${totalPages}`, MARGIN, PAGE_H - 6);
  }

  return doc.output('blob');
}
