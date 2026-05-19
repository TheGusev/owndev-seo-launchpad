/**
 * generateDirectExportXlsx — клиентский билдер XLSX-файла для Я.Директа.
 *
 * Сначала зовёт POST /api/v3/direct-export/json (там вся логика типов
 * соответствия, минусов и шаблонов), потом из ответа собирает workbook
 * с тремя листами и инициирует скачивание.
 */
import * as XLSX from 'xlsx';
import { apiUrlV3, apiHeaders } from '@/lib/api/config';

export interface DirectExportClusterInput {
  cluster_label: string;
  intent: string;
  seed_keyword: string;
  region_code: string;
  keywords: Array<{ phrase: string; frequency: number; intent_subtype?: string }>;
  total_frequency: number;
  recommended_page_type: string;
  recommended_url_pattern: string;
  // прочие поля DemandClusterV3 — бэк их игнорирует
  [k: string]: unknown;
}

export interface DirectExportOptions {
  brand?: string;
  cityName?: string;
  vertical?: string;
  data_source?: string;
}

interface DirectExportApiGroup {
  group_name: string;
  intent: string;
  subtype?: string;
  keywords: Array<{ phrase: string; match_type: '!phrase' | '"exact"' | 'broad' }>;
  minus_words: string[];
  suggested_headlines: string[];
  suggested_texts: string[];
  landing_hint: string;
}

interface DirectExportApiResult {
  groups: DirectExportApiGroup[];
  campaign_minus_words: string[];
  recommendations: string[];
  meta: { generated_at: string; clusters_count: number; total_keywords: number; data_source?: string };
}

async function fetchDirectExport(
  clusters: DirectExportClusterInput[],
  options: DirectExportOptions,
): Promise<DirectExportApiResult> {
  const r = await fetch(apiUrlV3('/direct-export/json'), {
    method: 'POST',
    headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ clusters, options }),
  });
  if (!r.ok) {
    throw new Error(`direct-export API ${r.status}: ${await r.text()}`);
  }
  const json = (await r.json()) as { success: boolean; data: DirectExportApiResult };
  if (!json?.data) throw new Error('direct-export API: пустой ответ');
  return json.data;
}

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function generateDirectExportXlsx(
  clusters: DirectExportClusterInput[],
  options: DirectExportOptions = {},
): Promise<{ filename: string; blob: Blob }> {
  const data = await fetchDirectExport(clusters, options);

  const wb = XLSX.utils.book_new();

  // Лист 1 — группы объявлений (по одной строке на ключ)
  const groupsRows: any[][] = [
    [
      'Группа',
      'Интент',
      'Подтип',
      'Ключевая фраза',
      'Тип соответствия',
      'Минус-слова группы',
      'Заголовок 1',
      'Заголовок 2',
      'Текст 1',
      'Лендинг',
    ],
  ];
  for (const g of data.groups) {
    const h1 = g.suggested_headlines[0] ?? '';
    const h2 = g.suggested_headlines[1] ?? '';
    const t1 = g.suggested_texts[0] ?? '';
    const minus = g.minus_words.join('; ');
    for (const kw of g.keywords) {
      groupsRows.push([
        g.group_name,
        g.intent,
        g.subtype ?? '',
        kw.phrase,
        kw.match_type,
        minus,
        h1,
        h2,
        t1,
        g.landing_hint,
      ]);
    }
  }
  const wsGroups = XLSX.utils.aoa_to_sheet(groupsRows);
  XLSX.utils.book_append_sheet(wb, wsGroups, 'Группы объявлений');

  // Лист 2 — глобальные минус-слова кампании
  const minusRows: any[][] = [['Минус-слово кампании']];
  for (const w of data.campaign_minus_words) minusRows.push([w]);
  const wsMinus = XLSX.utils.aoa_to_sheet(minusRows);
  XLSX.utils.book_append_sheet(wb, wsMinus, 'Минус-слова кампании');

  // Лист 3 — рекомендации
  const recRows: any[][] = [['Рекомендация']];
  for (const r of data.recommendations) recRows.push([r]);
  const wsRec = XLSX.utils.aoa_to_sheet(recRows);
  XLSX.utils.book_append_sheet(wb, wsRec, 'Рекомендации');

  const filename = `direct-export-${todayStamp()}.xlsx`;
  const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([arr], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  return { filename, blob };
}
