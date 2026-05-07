/**
 * Site Formula PRO — генератор PDF-отчёта.
 * Параллель к generateSiteFormulaProWord — те же 7 разделов, A4, кириллица.
 */
import { jsPDF } from 'jspdf';
import { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } from '@/fonts/roboto-base64';
import { PRINT_COLORS } from '@/lib/reportHelpers';
import type { ProReportContext } from '@/lib/generateSiteFormulaProWord';

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
    for (const c of demand.clusters.slice(0, 30)) {
      const head = c.head_keyword ?? c.head ?? c.cluster_name ?? '—';
      const vol = c.total_volume ?? c.volume ?? 0;
      y = drawText(doc, y, `${head}  —  ${vol} показов/мес`, { size: 9, bold: true });
      if (Array.isArray(c.keywords) && c.keywords.length > 0) {
        const kws = c.keywords.slice(0, 6).map((k: any) => k.keyword ?? k).join(', ');
        y = drawText(doc, y, `   ${kws}`, { size: 8, color: PRINT_COLORS.text_secondary });
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
      y = drawSubHeader(doc, y, 'Критические fail-коды (P0)');
      for (const code of r.failed_p0_codes) y = drawBullet(doc, y, code);
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
          y = drawText(doc, y, `⚠ P0: ${rep.failed_p0.join(', ')}`, { size: 8, color: '#B91C1C' });
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
    y = drawSectionHeader(doc, y, '5. Технический паспорт');
    y = drawText(doc, y, 'Готовые к публикации файлы для индексации поисковиками и AI-ботами.', { size: 9 });
    if (passport.llms_txt) {
      y = drawCaption(doc, y, 'llms.txt');
      y = drawText(doc, y, String(passport.llms_txt).slice(0, 2500), { size: 8 });
    }
    if (passport.robots_txt) {
      y = drawCaption(doc, y, 'robots.txt (фрагмент)');
      y = drawText(doc, y, String(passport.robots_txt).slice(0, 1500), { size: 8 });
    }
    if (passport.ai_well_known) {
      y = drawCaption(doc, y, '.well-known/ai (17 AI-ботов)');
      const txt =
        typeof passport.ai_well_known === 'string'
          ? passport.ai_well_known
          : JSON.stringify(passport.ai_well_known, null, 2);
      y = drawText(doc, y, txt.slice(0, 2000), { size: 8 });
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
