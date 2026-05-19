/**
 * Site Formula PRO — генератор PDF-отчёта.
 *
 * PR-17: переписан в v1-стиль архитектурного blueprint — 9 разделов, ядро
 * рендерится из shared util proBlueprintSections.ts. Технические разделы
 * (preflight / passport / super-prompt / pipeline) идут приложением после
 * blueprint'а.
 */
import { jsPDF } from 'jspdf';
import { PRINT_COLORS } from '@/lib/reportHelpers';
import type { ProReportContext } from '@/lib/generateSiteFormulaProWord';
import { explainP0Code } from '@/lib/p0Dictionary';
import { buildBlueprintSections, type BlueprintBlock } from '@/lib/proBlueprintSections';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

async function setupFonts(doc: jsPDF) {
  const { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } = await import('@/fonts/roboto-base64');
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

function drawText(
  doc: jsPDF,
  y: number,
  text: string,
  opts: { size?: number; bold?: boolean; color?: string } = {},
): number {
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

function drawTable(doc: jsPDF, y: number, rows: Array<[string, string]>): number {
  const col1 = 60;
  const col2 = CONTENT_W - col1;
  for (let i = 0; i < rows.length; i++) {
    const [k, v] = rows[i];
    const isHeader = i === 0;
    doc.setFont('Roboto', isHeader ? 'bold' : 'normal');
    doc.setFontSize(9);
    const kLines = doc.splitTextToSize(k, col1 - 4);
    const vLines = doc.splitTextToSize(v, col2 - 4);
    const rowH = Math.max(kLines.length, vLines.length) * 4 + 3;
    y = ensureSpace(doc, y, rowH);
    if (isHeader) {
      doc.setFillColor(PRINT_COLORS.bg_header);
      doc.rect(MARGIN, y - 3, CONTENT_W, rowH, 'F');
    }
    doc.setTextColor(PRINT_COLORS.text);
    doc.text(kLines, MARGIN + 2, y);
    doc.text(vLines, MARGIN + col1 + 2, y);
    y += rowH;
  }
  return y + 2;
}

function renderBlock(doc: jsPDF, y: number, block: BlueprintBlock): number {
  const muted = block.emphasis === 'muted' ? PRINT_COLORS.text_secondary : undefined;
  switch (block.kind) {
    case 'paragraph':
      return drawText(doc, y, block.text ?? '', { size: 10, color: muted });
    case 'caption':
      return drawCaption(doc, y, block.text ?? '');
    case 'subheader':
      return drawSubHeader(doc, y, block.text ?? '');
    case 'kv':
      return drawKv(doc, y, block.key ?? '', block.value ?? '');
    case 'bullet':
      return drawBullet(doc, y, block.text ?? '');
    case 'table':
      return drawTable(doc, y, block.rows ?? []);
    case 'note':
      return drawText(doc, y, block.text ?? '', { size: 9, color: PRINT_COLORS.text_secondary });
    default:
      return y;
  }
}

export async function generateSiteFormulaProPdf(ctx: ProReportContext): Promise<Blob> {
  const { result, brand } = ctx;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await setupFonts(doc);

  // ─── Cover ────────────────────────────────────────────────────────────
  doc.setFillColor(PRINT_COLORS.accent);
  doc.rect(0, 0, PAGE_W, 32, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(22);
  doc.setTextColor('#ffffff');
  doc.text('OwnDev Site Formula PRO', MARGIN, 18);
  doc.setFontSize(11);
  doc.setFont('Roboto', 'normal');
  doc.text('Архитектурный Blueprint', MARGIN, 26);

  let y = 44;

  // ─── Метаданные ──────────────────────────────────────────────────────
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(PRINT_COLORS.text);
  doc.text(`Бренд: ${brand.name}`, MARGIN, y);
  y += 5;
  doc.text(
    `Класс проекта: ${(result as any).pro_report?.project_class?.toUpperCase() ?? 'не определён'}`,
    MARGIN,
    y,
  );
  y += 5;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(PRINT_COLORS.text_secondary);
  doc.text(
    `Сгенерировано ${new Date(result.generated_at).toLocaleDateString('ru-RU')}  •  Rules v1.0.0  •  Template v1.0.0`,
    MARGIN,
    y,
  );
  y += 7;

  // ─── 9 разделов архитектурного blueprint (из shared util) ─────────────
  const sections = buildBlueprintSections({ result, brand });
  for (const sec of sections) {
    y = drawSectionHeader(doc, y, `${sec.number}. ${sec.title}`);
    if (sec.intro) {
      y = drawText(doc, y, sec.intro, { size: 9, color: PRINT_COLORS.text_secondary });
    }
    for (const block of sec.blocks) {
      y = renderBlock(doc, y, block);
    }
    y += 4;
  }

  // ─── Приложение: технические артефакты ─────────────────────────────────
  // Preflight, passport, super-prompt, pipeline — оставлены как раздел
  // «Технический паспорт» в духе v1, но в виде приложения, чтобы не ломать
  // структуру 9-разделового blueprint'а.

  // 10. Preflight 4-осей (детально)
  if (result.preflight_rollup) {
    y = drawSectionHeader(doc, y, '10. Preflight 4-осей — детальный аудит');
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
          const labels = rep.failed_p0.map((code: string) => `${code} (${explainP0Code(code).title})`);
          y = drawText(doc, y, `P0: ${labels.join('; ')}`, { size: 8, color: '#B91C1C' });
        }
      }
    }
    y += 4;
  }

  // 11. Технический паспорт — исходники файлов
  const passport: any = (result as any).passport;
  if (passport) {
    y = drawSectionHeader(doc, y, '11. Файлы для размещения на сайте');
    y = drawText(
      doc,
      y,
      'Готовые файлы. Триада «Зачем · Куда положить · Что меняет» по каждому файлу описана выше в разделе 7 «Роли страниц». Здесь — исходники для копирования.',
      { size: 9 },
    );
    if (passport.llms_txt) {
      y = drawCaption(doc, y, '/llms.txt');
      y = drawText(doc, y, String(passport.llms_txt), { size: 8 });
    }
    if (passport.robots_txt) {
      y = drawCaption(doc, y, '/robots.txt');
      y = drawText(doc, y, String(passport.robots_txt), { size: 8 });
    }
    if (passport.sitemap_xml) {
      y = drawCaption(doc, y, '/sitemap.xml');
      y = drawText(doc, y, String(passport.sitemap_xml), { size: 8 });
    }
    if (passport.ai_well_known) {
      y = drawCaption(doc, y, '/.well-known/ai');
      const txt =
        typeof passport.ai_well_known === 'string'
          ? passport.ai_well_known
          : JSON.stringify(passport.ai_well_known, null, 2);
      y = drawText(doc, y, txt, { size: 8 });
    }
    if (passport.json_ld_script) {
      y = drawCaption(doc, y, 'JSON-LD graph (в <head>)');
      y = drawText(doc, y, String(passport.json_ld_script), { size: 8 });
    }
    if (passport.base_head) {
      y = drawCaption(doc, y, 'Базовый <head>-блок');
      y = drawText(doc, y, String(passport.base_head), { size: 8 });
    }
    if (Array.isArray(passport.head_per_page) && passport.head_per_page.length > 0) {
      y = drawCaption(doc, y, 'Шаблоны <head> по типам страниц');
      for (const entry of passport.head_per_page.slice(0, 8)) {
        y = drawText(doc, y, `— ${entry.page_type}  (${entry.url_pattern})`, { size: 9, bold: true });
        y = drawText(doc, y, String(entry.head_html), { size: 7 });
      }
    }
    y += 4;
  }

  // 12. Super-prompt
  const pack: any = (result as any).pack;
  if (pack) {
    y = drawSectionHeader(doc, y, '12. Super-prompt для AI-разработчика');
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
    y += 4;
  }

  // 13. Этапы pipeline
  if (Array.isArray(result.stages) && result.stages.length > 0) {
    y = drawSectionHeader(doc, y, '13. Этапы pipeline');
    for (const st of result.stages) {
      const status = st.ok ? 'ok' : 'fail';
      y = drawBullet(
        doc,
        y,
        `[${status}] ${st.stage} — ${st.duration_ms}ms${st.error ? ` (${st.error})` : ''}`,
      );
    }
  }

  // ─── Footer ──────────────────────────────────────────────────────────
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
