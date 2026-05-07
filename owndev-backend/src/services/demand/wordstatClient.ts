/**
 * Yandex Search API v2 — Wordstat client (V3).
 *
 * The CORRECT endpoints (as per cloud.yandex.com/services/searchapi):
 *   POST  https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests              (1u)
 *   POST  https://searchapi.api.cloud.yandex.net/v2/wordstat/getDynamics              (2u)
 *   POST  https://searchapi.api.cloud.yandex.net/v2/wordstat/getRegionsDistribution   (2u)
 *   GET   https://searchapi.api.cloud.yandex.net/v2/wordstat/getRegionsTree           (free)
 *
 * Auth: AI Studio API-key (header `Authorization: Api-Key …`).
 *       folderId is part of the request *body*, not a header.
 * Rate: 100 000 sync units / day per cloud (tracked by quotaTracker).
 *
 * Modes:
 *   YANDEX_WORDSTAT_MODE=mock       — synthetic data (no creds, deterministic)
 *   YANDEX_WORDSTAT_MODE=search_api — real Search API v2
 *
 * Env:
 *   YANDEX_API_KEY    — AI Studio API key (preferred). Legacy alias: YANDEX_IAM_TOKEN.
 *   YANDEX_FOLDER_ID  — folder owning the service account that minted the key.
 */
import { logger } from '../../utils/logger.js';
import { reserveUnits, refundUnits } from './quotaTracker.js';
import type {
  TopRequestsRequest,
  TopRequestsResponse,
  GetDynamicsRequest,
  GetDynamicsResponse,
  GetRegionsDistributionRequest,
  GetRegionsDistributionResponse,
  GetRegionsTreeResponse,
} from './types.js';

const MODE = (process.env.YANDEX_WORDSTAT_MODE ?? 'mock') as 'mock' | 'search_api';
const API_KEY = process.env.YANDEX_API_KEY ?? process.env.YANDEX_IAM_TOKEN;
const FOLDER_ID = process.env.YANDEX_FOLDER_ID;
const API_BASE = 'https://searchapi.api.cloud.yandex.net/v2/wordstat';

// `devices: ['all']` is our internal shorthand. Yandex expects DEVICE_* enums.
function normalizeDevices(devices?: string[]): string[] {
  if (!devices || devices.length === 0) return ['DEVICE_ALL'];
  return devices.map((d) => {
    const v = d.toUpperCase();
    if (v === 'ALL') return 'DEVICE_ALL';
    if (v === 'DESKTOP') return 'DEVICE_DESKTOP';
    if (v === 'MOBILE' || v === 'PHONE') return 'DEVICE_PHONE';
    if (v === 'TABLET') return 'DEVICE_TABLET';
    return v.startsWith('DEVICE_') ? v : `DEVICE_${v}`;
  });
}

// ─── HTTP plumbing ───────────────────────────────────────────

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!API_KEY || !FOLDER_ID) {
    throw new Error('YANDEX_API_KEY / YANDEX_FOLDER_ID not configured');
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Api-Key ${API_KEY}`,
    },
    body: JSON.stringify({ ...body, folderId: FOLDER_ID }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Wordstat ${path} HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  if (!API_KEY || !FOLDER_ID) {
    throw new Error('YANDEX_API_KEY / YANDEX_FOLDER_ID not configured');
  }
  // The real API exposes getRegionsTree only as POST with folderId in body.
  return postJson<T>(path, {});
}

// ─── Public surface ──────────────────────────────────────────

export async function topRequests(req: TopRequestsRequest): Promise<TopRequestsResponse> {
  if (MODE === 'mock') return mockTopRequests(req);

  const reservation = await reserveUnits('topRequests');
  try {
    type RawTop = {
      results?: Array<{ phrase: string; count: number | string }>;
      topRequests?: Array<{ phrase: string; count: number | string }>;
      associations?: Array<{ phrase: string; count: number | string }>;
      totalCount?: number | string;
    };
    const raw = await postJson<RawTop>('/topRequests', {
      phrase: req.phrase,
      regions: req.geoIds ?? ['225'],
      devices: normalizeDevices(req.devices),
      numPhrases: 25,
    });
    const toItem = (x: { phrase: string; count: number | string }) => ({
      phrase: x.phrase,
      count: typeof x.count === 'string' ? Number(x.count) : x.count,
    });
    return {
      topRequests: (raw.results ?? raw.topRequests ?? []).map(toItem),
      associations: (raw.associations ?? []).map(toItem),
      totalCount: typeof raw.totalCount === 'string' ? Number(raw.totalCount) : (raw.totalCount ?? 0),
    };
  } catch (err: any) {
    await refundUnits('topRequests', reservation.unitsReserved);
    logger.warn('WORDSTAT', `topRequests failed: ${err.message}`);
    throw err;
  }
}

export async function getDynamics(req: GetDynamicsRequest): Promise<GetDynamicsResponse> {
  if (MODE === 'mock') return mockGetDynamics(req);

  const reservation = await reserveUnits('getDynamics');
  try {
    return await postJson<GetDynamicsResponse>('/getDynamics', {
      phrase: req.phrase,
      regions: req.geoIds ?? ['225'],
      devices: normalizeDevices(req.devices),
      period: `PERIOD_${(req.granularity ?? 'MONTH').toUpperCase().replace(/LY$/, '')}LY`,
    });
  } catch (err: any) {
    await refundUnits('getDynamics', reservation.unitsReserved);
    logger.warn('WORDSTAT', `getDynamics failed: ${err.message}`);
    throw err;
  }
}

export async function getRegionsDistribution(
  req: GetRegionsDistributionRequest,
): Promise<GetRegionsDistributionResponse> {
  if (MODE === 'mock') return mockGetRegionsDistribution(req);

  const reservation = await reserveUnits('getRegionsDistribution');
  try {
    return await postJson<GetRegionsDistributionResponse>('/getRegionsDistribution', {
      phrase: req.phrase,
      devices: normalizeDevices(req.devices),
      region: 'REGION_REGIONS',
    });
  } catch (err: any) {
    await refundUnits('getRegionsDistribution', reservation.unitsReserved);
    logger.warn('WORDSTAT', `getRegionsDistribution failed: ${err.message}`);
    throw err;
  }
}

export async function getRegionsTree(): Promise<GetRegionsTreeResponse> {
  if (MODE === 'mock') return mockGetRegionsTree();
  await reserveUnits('getRegionsTree'); // free, but logs the call
  return await getJson<GetRegionsTreeResponse>('/getRegionsTree');
}

// ─── Mock data (deterministic) ───────────────────────────────

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function mockTopRequests(req: TopRequestsRequest): TopRequestsResponse {
  const seed = hash(req.phrase);
  const baseVolume = 800 + (seed % 30_000);
  const tops = [
    { phrase: req.phrase, count: baseVolume },
    { phrase: `${req.phrase} цена`, count: Math.round(baseVolume * 0.4) },
    { phrase: `${req.phrase} отзывы`, count: Math.round(baseVolume * 0.3) },
    { phrase: `${req.phrase} в Москве`, count: Math.round(baseVolume * 0.25) },
    { phrase: `купить ${req.phrase}`, count: Math.round(baseVolume * 0.22) },
    { phrase: `${req.phrase} срочно`, count: Math.round(baseVolume * 0.18) },
    { phrase: `${req.phrase} стоимость`, count: Math.round(baseVolume * 0.16) },
    { phrase: `заказать ${req.phrase}`, count: Math.round(baseVolume * 0.14) },
  ];
  const associations = [
    { phrase: `${req.phrase} рейтинг`, count: Math.round(baseVolume * 0.12) },
    { phrase: `${req.phrase} сравнить`, count: Math.round(baseVolume * 0.1) },
    { phrase: `${req.phrase} услуги`, count: Math.round(baseVolume * 0.09) },
    { phrase: `${req.phrase} компания`, count: Math.round(baseVolume * 0.08) },
    { phrase: `как ${req.phrase}`, count: Math.round(baseVolume * 0.07) },
  ];
  return {
    topRequests: tops,
    associations,
    totalCount: baseVolume,
  };
}

function mockGetDynamics(req: GetDynamicsRequest): GetDynamicsResponse {
  const seed = hash(req.phrase);
  const now = new Date();
  const dynamics: Array<{ period: string; count: number }> = [];
  const granularity = req.granularity ?? 'MONTH';
  const points = granularity === 'WEEK' ? 26 : 12;
  for (let i = points - 1; i >= 0; i--) {
    const d =
      granularity === 'MONTH'
        ? new Date(now.getFullYear(), now.getMonth() - i, 1)
        : new Date(now.getTime() - i * 7 * 86_400_000);
    const base = 500 + (seed % 5_000);
    const seasonal = Math.sin((i / points) * Math.PI * 2) * (base / 4);
    const noise = ((seed >> i) & 0xff) - 128;
    dynamics.push({
      period:
        granularity === 'MONTH'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : d.toISOString().slice(0, 10),
      count: Math.max(0, Math.round(base + seasonal + noise)),
    });
  }
  return { dynamics };
}

function mockGetRegionsDistribution(
  req: GetRegionsDistributionRequest,
): GetRegionsDistributionResponse {
  const seed = hash(req.phrase);
  const baseVolume = 800 + (seed % 30_000);
  const regs = [
    { geoId: '213', geoName: 'Москва', share: 0.34 + ((seed % 10) / 100) },
    { geoId: '2', geoName: 'Санкт-Петербург', share: 0.18 },
    { geoId: '54', geoName: 'Екатеринбург', share: 0.07 },
    { geoId: '47', geoName: 'Нижний Новгород', share: 0.05 },
    { geoId: '65', geoName: 'Новосибирск', share: 0.05 },
    { geoId: '50', geoName: 'Краснодар', share: 0.04 },
    { geoId: '51', geoName: 'Казань', share: 0.04 },
  ];
  const total = regs.reduce((s, r) => s + r.share, 0);
  return {
    regions: regs.map((r) => ({
      geoId: r.geoId,
      geoName: r.geoName,
      count: Math.round(baseVolume * (r.share / total) * 0.85),
      affinityIndex: Number((r.share / total * 100).toFixed(2)),
    })),
  };
}

function mockGetRegionsTree(): GetRegionsTreeResponse {
  return {
    regions: [
      { geoId: '225', name: 'Россия', type: 'country' },
      { geoId: '1', name: 'Московская область', parentGeoId: '225', type: 'region' },
      { geoId: '213', name: 'Москва', parentGeoId: '1', type: 'city' },
      { geoId: '10174', name: 'Санкт-Петербург и область', parentGeoId: '225', type: 'region' },
      { geoId: '2', name: 'Санкт-Петербург', parentGeoId: '10174', type: 'city' },
      { geoId: '54', name: 'Екатеринбург', parentGeoId: '225', type: 'city' },
      { geoId: '47', name: 'Нижний Новгород', parentGeoId: '225', type: 'city' },
      { geoId: '65', name: 'Новосибирск', parentGeoId: '225', type: 'city' },
      { geoId: '50', name: 'Краснодар', parentGeoId: '225', type: 'city' },
      { geoId: '51', name: 'Казань', parentGeoId: '225', type: 'city' },
    ],
  };
}

export const wordstatV3Mode = MODE;
