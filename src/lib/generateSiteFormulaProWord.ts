/**
 * Site Formula PRO — генератор DOCX-отчёта.
 *
 * PR-17: переписан в v1-стиль архитектурного blueprint — 9 разделов, ядро
 * рендерится из shared util proBlueprintSections.ts. Технические разделы
 * (preflight / passport / super-prompt / pipeline) идут приложением после
 * blueprint'а.
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
import { explainP0Code } from '@/lib/p0Dictionary';
import { buildBlueprintSections, type BlueprintBlock } from '@/lib/proBlueprintSections';

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
const DANGER = 'B91C1C';

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

function captionPara(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 16, color: MUTED })],
    spacing: { before: 120, after: 60 },
  });
}

function bulletPara(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `• ${text}`, size: 20 })],
    indent: { left: 360 },
  });
}

function kvPara(key: string, value: string): Paragraph {
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
      ([k, v], idx) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 3200, type: WidthType.DXA },
              shading: { fill: idx === 0 ? 'E5E7EB' : 'F3F4F6', type: ShadingType.CLEAR },
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

function renderBlock(block: BlueprintBlock): any[] {
  const muted = block.emphasis === 'muted';
  const color = muted ? MUTED : undefined;
  switch (block.kind) {
    case 'paragraph':
      return [p(block.text ?? '', { color })];
    case 'caption':
      return [captionPara(block.text ?? '')];
    case 'subheader':
      return [h2(block.text ?? '')];
    case 'kv':
      return [kvPara(block.key ?? '', block.value ?? '')];
    case 'bullet':
      return [bulletPara(block.text ?? '')];
    case 'table':
      return [tableTwoCol(block.rows ?? []), p('', { spacing: { after: 120 } })];
    case 'note':
      return [p(block.text ?? '', { italics: true, color: MUTED, size: 18 })];
    default:
      return [];
  }
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
      children: [new TextRun({ text: 'Архитектурный Blueprint', size: 22, color: MUTED })],
      spacing: { after: 240 },
    }),
  );

  // Метаданные — небольшая таблица как в эталоне 08.08.docx.
  const pro: any = (result as any).pro_report ?? {};
  const cls = pro.project_class ? String(pro.project_class).toUpperCase() : 'не определён';
  children.push(
    tableTwoCol([
      ['Бренд', brand.name],
      ['Класс проекта', cls + (pro.project_class_reason ? `  —  ${pro.project_class_reason}` : '')],
      ['Сгенерировано', `${dt}  •  Rules v1.0.0  •  Template v1.0.0`],
      ['Job ID', result.job_id],
    ]),
    p('', { spacing: { after: 240 } }),
  );

  // ─── 9 разделов архитектурного blueprint (shared util) ──────────────────
  const sections = buildBlueprintSections({ result, brand });
  for (const sec of sections) {
    children.push(h1(`${sec.number}. ${sec.title}`));
    if (sec.intro) children.push(p(sec.intro, { color: MUTED }));
    for (const block of sec.blocks) {
      for (const node of renderBlock(block)) {
        children.push(node);
      }
    }
  }

  // ─── 10. Preflight 4-осей — детальный аудит ─────────────────────────────
  if (result.preflight_rollup) {
    children.push(h1('10. Preflight 4-осей — детальный аудит'));
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
      for (const code of r.failed_p0_codes) {
        const ex = explainP0Code(code);
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${code}: `, bold: true, size: 20, color: DANGER }),
              new TextRun({ text: ex.title, bold: true, size: 20 }),
            ],
            spacing: { before: 120, after: 40 },
          }),
        );
        children.push(p(ex.why, { size: 18, color: MUTED, indent: { left: 200 } }));
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Что делать: ', bold: true, size: 18 }),
              new TextRun({ text: ex.whatToDo, size: 18 }),
            ],
            indent: { left: 200 },
          }),
        );
      }
    }

    const reports: any[] = (result as any).preflight_per_page ?? [];
    if (reports.length > 0) {
      children.push(h2(`Постраничный аудит (${reports.length})`));
      for (const rep of reports.slice(0, 20)) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${rep.url}`, bold: true, size: 20 }),
              new TextRun({
                text: `   total ${rep.total_score}`,
                size: 18,
                color: rep.passed ? '0E8A4F' : DANGER,
              }),
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
          const labels = rep.failed_p0.map((code: string) => `${code} (${explainP0Code(code).title})`);
          children.push(
            p(`   P0: ${labels.join('; ')}`, { size: 18, color: DANGER, indent: { left: 200 } }),
          );
        }
      }
    }
  }

  // ─── 11. Технический паспорт — исходники файлов ─────────────────────────
  const passport: any = (result as any).passport;
  if (passport) {
    children.push(h1('11. Файлы для размещения на сайте'));
    children.push(
      p(
        'Готовые файлы. Триада «Зачем · Куда положить · Что меняет» по каждому файлу описана выше в разделе 7 «Роли страниц». Здесь — исходники для копирования.',
      ),
    );
    if (passport.llms_txt) {
      children.push(captionPara('/llms.txt'));
      children.push(p(String(passport.llms_txt), { size: 16 }));
    }
    if (passport.robots_txt) {
      children.push(captionPara('/robots.txt'));
      children.push(p(String(passport.robots_txt), { size: 16 }));
    }
    if (passport.sitemap_xml) {
      children.push(captionPara('/sitemap.xml'));
      children.push(p(String(passport.sitemap_xml), { size: 16 }));
    }
    if (passport.ai_well_known) {
      children.push(captionPara('/.well-known/ai'));
      const txt =
        typeof passport.ai_well_known === 'string'
          ? passport.ai_well_known
          : JSON.stringify(passport.ai_well_known, null, 2);
      children.push(p(txt, { size: 16 }));
    }
    if (passport.json_ld_script) {
      children.push(captionPara('JSON-LD graph (в <head>)'));
      children.push(p(String(passport.json_ld_script), { size: 16 }));
    }
    if (passport.base_head) {
      children.push(captionPara('Базовый <head>-блок'));
      children.push(p(String(passport.base_head), { size: 16 }));
    }
    if (Array.isArray(passport.head_per_page) && passport.head_per_page.length > 0) {
      children.push(captionPara('Шаблоны <head> по типам страниц'));
      for (const entry of passport.head_per_page.slice(0, 12)) {
        children.push(p(`— ${entry.page_type}  (${entry.url_pattern})`, { bold: true, size: 18 }));
        children.push(p(String(entry.head_html), { size: 14 }));
      }
    }
  }

  // ─── 12. Super-prompt для AI-разработчика ───────────────────────────────
  const pack: any = (result as any).pack;
  if (pack) {
    children.push(h1('12. Super-prompt для AI-разработчика'));
    if (pack.role_prompt) {
      children.push(captionPara('Роль'));
      children.push(p(String(pack.role_prompt).slice(0, 4000)));
    }
    if (pack.task_prompt) {
      children.push(captionPara('Задача'));
      children.push(p(String(pack.task_prompt).slice(0, 4000)));
    }
    if (pack.acceptance_criteria) {
      children.push(captionPara('Критерии приёмки'));
      const arr = Array.isArray(pack.acceptance_criteria)
        ? pack.acceptance_criteria
        : [pack.acceptance_criteria];
      for (const it of arr) children.push(bulletPara(String(it)));
    }
    if (pack.export_mode) {
      children.push(p('', { spacing: { before: 100 } }));
      children.push(kvPara('Режим экспорта', String(pack.export_mode)));
      if (pack.platform_target) children.push(kvPara('Целевая платформа', String(pack.platform_target)));
    }
  }

  // ─── 13. Этапы pipeline ─────────────────────────────────────────────────
  if (Array.isArray(result.stages) && result.stages.length > 0) {
    children.push(h1('13. Этапы pipeline'));
    for (const st of result.stages) {
      const status = st.ok ? 'ok' : 'fail';
      children.push(
        p(`[${status}]  ${st.stage} — ${st.duration_ms}ms${st.error ? ` (${st.error})` : ''}`),
      );
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
