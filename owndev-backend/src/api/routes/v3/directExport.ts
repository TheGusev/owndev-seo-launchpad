/**
 * V3 Direct-export endpoints.
 *
 *   POST /api/v3/direct-export/json — готовые группы Я.Директа в JSON
 *   POST /api/v3/direct-export/csv  — CSV для импорта в Excel/Direct.Commander
 *
 * Вход: { clusters: DemandClusterV3[], options?: { brand, cityName, vertical, data_source } }
 */
import type { FastifyInstance } from 'fastify';
import {
  buildDirectExport,
  type BuildDirectExportOptions,
} from '../../../services/demand/directCampaignExporter.js';
import type { DemandClusterV3 } from '../../../services/demand/types.js';

interface DirectExportBody {
  clusters?: DemandClusterV3[];
  options?: BuildDirectExportOptions;
}

function csvEscape(s: string): string {
  if (s == null) return '';
  const str = String(s);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function directExportRoutes(app: FastifyInstance) {
  app.post('/json', async (req, reply) => {
    const body = (req.body ?? {}) as DirectExportBody;
    const clusters = Array.isArray(body.clusters) ? body.clusters : [];
    const result = buildDirectExport(clusters, body.options ?? {});
    return reply.send({ success: true, data: result });
  });

  app.post('/csv', async (req, reply) => {
    const body = (req.body ?? {}) as DirectExportBody;
    const clusters = Array.isArray(body.clusters) ? body.clusters : [];
    const result = buildDirectExport(clusters, body.options ?? {});

    const header = [
      'Группа',
      'Интент',
      'Ключевая фраза',
      'Тип соответствия',
      'Минус-слова группы',
      'Подсказка лендинга',
    ].join(',');
    const rows: string[] = [header];
    for (const g of result.groups) {
      const minus = g.minus_words.join('; ');
      for (const kw of g.keywords) {
        rows.push(
          [
            csvEscape(g.group_name),
            csvEscape(g.intent),
            csvEscape(kw.phrase),
            csvEscape(kw.match_type),
            csvEscape(minus),
            csvEscape(g.landing_hint),
          ].join(','),
        );
      }
    }
    const csv = '﻿' + rows.join('\r\n');
    reply
      .header('content-type', 'text/csv; charset=utf-8')
      .header(
        'content-disposition',
        `attachment; filename="direct-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      )
      .send(csv);
  });
}
