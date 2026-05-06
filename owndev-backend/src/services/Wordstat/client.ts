/**
 * Wordstat client.
 *
 * Two backends supported through env config:
 *
 *   YANDEX_WORDSTAT_MODE=mock           — local synthetic data (dev / no creds)
 *   YANDEX_WORDSTAT_MODE=search_api     — Yandex Search API v1 over IAM token
 *
 * For Search API you also need:
 *   YANDEX_IAM_TOKEN   — short-lived IAM token (or pass via OAuth exchange)
 *   YANDEX_FOLDER_ID   — Yandex Cloud folder ID
 *
 * The cache layer (db) is one level above (see ./service.ts), so this module
 * only owns "talk to provider" responsibilities. All return shapes are unified
 * to the WordstatTopResponse / WordstatDynamicsResponse / WordstatRegionsResponse
 * contracts.
 *
 * Note: Yandex's Search API does not formally expose Wordstat semantics — the
 * /searchVolume endpoint provides keyword volume data. We map their response
 * to our unified shape. If the team later adopts the official direct.yandex.ru
 * Wordstat (v3 SOAP), drop a new backend here behind the same surface.
 */
import { logger } from '../../utils/logger.js';
import type {
  WordstatTopResponse,
  WordstatDynamicsResponse,
  WordstatRegionsResponse,
  WordstatDynamicsPoint,
} from './types.js';

const MODE = (process.env.YANDEX_WORDSTAT_MODE ?? 'mock') as 'mock' | 'search_api';
const IAM_TOKEN = process.env.YANDEX_IAM_TOKEN;
const FOLDER_ID = process.env.YANDEX_FOLDER_ID;

// ─── Public surface ───────────────────────────────────────────
export async function getTop(
  phrase: string,
  regionCode = '225',
): Promise<WordstatTopResponse> {
  if (MODE === 'search_api' && IAM_TOKEN && FOLDER_ID) {
    try {
      return await getTopFromSearchApi(phrase, regionCode);
    } catch (err: any) {
      logger.warn('WORDSTAT', `Search API getTop failed: ${err.message} — falling back to mock`);
    }
  }
  return getTopMock(phrase, regionCode);
}

export async function getDynamics(
  phrase: string,
  regionCode = '225',
): Promise<WordstatDynamicsResponse> {
  if (MODE === 'search_api' && IAM_TOKEN && FOLDER_ID) {
    try {
      return await getDynamicsFromSearchApi(phrase, regionCode);
    } catch (err: any) {
      logger.warn('WORDSTAT', `Search API getDynamics failed: ${err.message} — fallback`);
    }
  }
  return getDynamicsMock(phrase, regionCode);
}

export async function getRegions(
  phrase: string,
): Promise<WordstatRegionsResponse> {
  if (MODE === 'search_api' && IAM_TOKEN && FOLDER_ID) {
    try {
      return await getRegionsFromSearchApi(phrase);
    } catch (err: any) {
      logger.warn('WORDSTAT', `Search API getRegions failed: ${err.message} — fallback`);
    }
  }
  return getRegionsMock(phrase);
}

// ═══ Search API backend ═══════════════════════════════════════
// Endpoint contract (best-effort — Yandex does not document a stable endpoint
// for Wordstat-equivalent volume data outside Direct API. This module is
// structured so the actual HTTP shape can be edited in one place when access
// is granted).

const SEARCH_API_BASE = 'https://search.api.cloud.yandex.net/v2';

interface SearchApiHit {
  query: string;
  volume?: number;
  shows?: number;
}

async function searchApiCall<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${SEARCH_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${IAM_TOKEN}`,
      'X-Folder-Id': FOLDER_ID!,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Search API ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

async function getTopFromSearchApi(
  phrase: string,
  regionCode: string,
): Promise<WordstatTopResponse> {
  // Two parallel calls: also-search and including.
  const [alsoRes, incRes] = await Promise.all([
    searchApiCall<{ hits: SearchApiHit[]; total?: number }>(
      '/keyword/search',
      { query: phrase, regionId: regionCode, mode: 'related' },
    ),
    searchApiCall<{ hits: SearchApiHit[]; total?: number }>(
      '/keyword/search',
      { query: phrase, regionId: regionCode, mode: 'including' },
    ),
  ]);

  return {
    phrase,
    region_code: regionCode,
    total: alsoRes.total ?? 0,
    also_search: alsoRes.hits.map((h) => ({
      phrase: h.query,
      volume: h.volume ?? h.shows ?? 0,
      region_code: regionCode,
    })),
    including: incRes.hits.map((h) => ({
      phrase: h.query,
      volume: h.volume ?? h.shows ?? 0,
      region_code: regionCode,
    })),
    source: 'yandex_search_api',
    fetched_at: new Date().toISOString(),
  };
}

interface DynamicsApiResponse {
  series: { period: string; volume: number }[];
}

async function getDynamicsFromSearchApi(
  phrase: string,
  regionCode: string,
): Promise<WordstatDynamicsResponse> {
  const res = await searchApiCall<DynamicsApiResponse>('/keyword/dynamics', {
    query: phrase,
    regionId: regionCode,
    granularity: 'MONTHLY',
  });
  const series = res.series ?? [];
  return {
    phrase,
    region_code: regionCode,
    series,
    trend: detectTrend(series),
    source: 'yandex_search_api',
    fetched_at: new Date().toISOString(),
  };
}

interface RegionsApiResponse {
  regions: { regionId: string; name: string; share: number; volume: number }[];
}

async function getRegionsFromSearchApi(phrase: string): Promise<WordstatRegionsResponse> {
  const res = await searchApiCall<RegionsApiResponse>('/keyword/regions', { query: phrase });
  return {
    phrase,
    regions: (res.regions ?? []).map((r) => ({
      region_code: r.regionId,
      region_name: r.name,
      share: r.share,
      volume: r.volume,
    })),
    source: 'yandex_search_api',
    fetched_at: new Date().toISOString(),
  };
}

// ═══ Mock backend ═════════════════════════════════════════════
// Deterministic synthetic data so dev / tests don't need API access.

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getTopMock(phrase: string, regionCode: string): WordstatTopResponse {
  const seed = hash(phrase);
  const total = 500 + (seed % 50_000);

  const baseVariants = [
    `${phrase} цена`,
    `${phrase} стоимость`,
    `${phrase} отзывы`,
    `${phrase} в Москве`,
    `${phrase} срочно`,
    `купить ${phrase}`,
    `заказать ${phrase}`,
    `${phrase} недорого`,
    `${phrase} 24 часа`,
    `как ${phrase}`,
  ];

  return {
    phrase,
    region_code: regionCode,
    total,
    also_search: baseVariants.slice(5).map((p, i) => ({
      phrase: p,
      volume: Math.max(50, Math.floor(total / (3 + i))),
      region_code: regionCode,
    })),
    including: baseVariants.slice(0, 5).map((p, i) => ({
      phrase: p,
      volume: Math.max(100, Math.floor(total / (2 + i))),
      region_code: regionCode,
    })),
    source: 'mock',
    fetched_at: new Date().toISOString(),
  };
}

function getDynamicsMock(phrase: string, regionCode: string): WordstatDynamicsResponse {
  const now = new Date();
  const series: WordstatDynamicsPoint[] = [];
  const seed = hash(phrase);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const base = 500 + (seed % 5_000);
    const seasonal = Math.sin((i / 12) * Math.PI * 2) * (base / 4);
    const noise = ((seed >> i) & 0xff) - 128;
    series.push({
      period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      volume: Math.max(0, Math.round(base + seasonal + noise)),
    });
  }
  return {
    phrase,
    region_code: regionCode,
    series,
    trend: detectTrend(series),
    source: 'mock',
    fetched_at: new Date().toISOString(),
  };
}

function getRegionsMock(phrase: string): WordstatRegionsResponse {
  const seed = hash(phrase);
  const regs = [
    { code: '213', name: 'Москва', share: 0.35 + ((seed % 10) / 100) },
    { code: '2',   name: 'Санкт-Петербург', share: 0.18 },
    { code: '54',  name: 'Екатеринбург', share: 0.07 },
    { code: '47',  name: 'Нижний Новгород', share: 0.05 },
    { code: '65',  name: 'Новосибирск', share: 0.05 },
  ];
  const totalShare = regs.reduce((s, r) => s + r.share, 0);
  // Normalise + add an "other" bucket
  const normalised = regs.map((r) => ({ ...r, share: r.share / totalShare * 0.7 }));
  normalised.push({ code: '0', name: 'Другие регионы', share: 0.3 });

  return {
    phrase,
    regions: normalised.map((r) => ({
      region_code: r.code,
      region_name: r.name,
      share: r.share,
      volume: Math.round(10_000 * r.share),
    })),
    source: 'mock',
    fetched_at: new Date().toISOString(),
  };
}

function detectTrend(series: WordstatDynamicsPoint[]): 'rising' | 'declining' | 'stable' {
  if (series.length < 3) return 'stable';
  const first = series.slice(0, Math.floor(series.length / 2));
  const last = series.slice(Math.floor(series.length / 2));
  const avg = (xs: WordstatDynamicsPoint[]) =>
    xs.reduce((s, p) => s + p.volume, 0) / Math.max(1, xs.length);
  const a = avg(first);
  const b = avg(last);
  const delta = (b - a) / Math.max(1, a);
  if (delta > 0.1) return 'rising';
  if (delta < -0.1) return 'declining';
  return 'stable';
}

export const wordstatMode = MODE;
