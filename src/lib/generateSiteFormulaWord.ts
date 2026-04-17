import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, ShadingType, Table, TableRow, TableCell, WidthType,
} from 'docx';
import type { FullReportPayload } from '@/lib/api/siteFormula';

const CLASS_LABELS: Record<string, string> = {
  start: 'Start',
  growth: 'Growth',
  scale: 'Scale',
};

function formatFieldName(key: string): string {
  return key.replace(/_/g, ' ');
}

function valueToParagraphs(value: any): Paragraph[] {
  if (typeof value === 'string') {
    return [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })];
  }
  if (Array.isArray(value)) {
    return value.map(
      (item) =>
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${typeof item === 'object' ? JSON.stringify(item) : String(item)}`,
              size: 20,
            }),
          ],
          indent: { left: 360 },
        })
    );
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).map(
      ([k, v]) =>
        new Paragraph({
          children: [
            new TextRun({ text: `${k}: `, bold: true, size: 20 }),
            new TextRun({ text: String(v), size: 20 }),
          ],
        })
    );
  }
  return [new Paragraph({ children: [new TextRun({ text: String(value), size: 20 })] })];
}

export async function generateSiteFormulaWord(report: FullReportPayload): Promise<Blob> {
  const dt = new Date(report.metadata.generated_at).toLocaleDateString('ru-RU');

  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'OwnDev Site Formula', bold: true, size: 40, color: '7C3AED' })],
    })
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Архитектурный Blueprint', size: 22, color: '6B7280' })],
      spacing: { after: 240 },
    })
  );

  // Project class info table
  children.push(
    new Table({
      width: { size: 9000, type: WidthType.DXA },
      columnWidths: [3000, 6000],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 3000, type: WidthType.DXA },
              shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: 'Класс проекта', bold: true, size: 20 })] })],
            }),
            new TableCell({
              width: { size: 6000, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: CLASS_LABELS[report.project_class] || report.project_class,
                      bold: true,
                      size: 24,
                      color: '7C3AED',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: 'Сгенерировано', bold: true, size: 20 })] })],
            }),
            new TableCell({
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${dt}  •  Rules v${report.metadata.rules_version}  •  Template v${report.metadata.template_version}`,
                      size: 18,
                      color: '6B7280',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: '', size: 2 })], spacing: { after: 200 } }));

  // Sections
  for (const section of report.sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: section.title, bold: true, size: 28, color: '1A1A1A' })],
        border: {
          bottom: { color: '7C3AED', size: 6, space: 1, style: BorderStyle.SINGLE },
        },
        spacing: { before: 240, after: 120 },
      })
    );

    for (const [key, value] of Object.entries(section.content)) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: formatFieldName(key).toUpperCase(),
              bold: true,
              size: 16,
              color: '6B7280',
            }),
          ],
          spacing: { before: 120, after: 60 },
        })
      );
      children.push(...valueToParagraphs(value));
    }
  }

  // Decision trace
  if (report.decision_trace_summary?.length) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: 'Обоснование решений', bold: true, size: 26 })],
        spacing: { before: 360, after: 120 },
      })
    );
    for (const item of report.decision_trace_summary) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: item, size: 16, color: '6B7280' })],
        })
      );
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial' } } },
    },
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

  const buffer = await Packer.toBlob(doc);
  return buffer;
}
