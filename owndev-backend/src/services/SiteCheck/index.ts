/**
 * Sprint 4 — модульная точка входа SiteCheck.
 *
 * Пока pipeline остаётся в монолите services/SiteCheckPipeline.ts (2335 строк),
 * этот модуль re-export'ит публичный API. На следующих итерациях монолит будет
 * разбит на steps/ + scoring/ + utils/ без изменения внешнего контракта.
 *
 * Все consumers (Worker, тесты) должны импортировать ОТСЮДА:
 *   import { runPipeline, type PipelineResult } from '../services/SiteCheck/index.js';
 */
export {
  runPipeline,
  type PipelineResult,
  type Issue,
  type Stage0Data,
  type RobotsData,
  type SitemapData,
  type LlmsTxtData,
  type ResourcesData,
  type GeoSignalsData,
  type CROData,
  type BenchmarkData,
  type BenchmarkGap,
  type RedirectHop,
} from '../SiteCheckPipeline.js';