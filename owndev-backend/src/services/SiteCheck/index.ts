/**
 * SiteCheck — public entry point (façade).
 *
 * Статус рефактора (Phase 4 / Pass 2):
 *   - Шаг 1 (экстракция типов) — ГОТОВО: все публичные интерфейсы физически
 *     живут в ./types.ts; SiteCheckPipeline.ts их реимпортирует (обратная
 *     совместимость сохранена).
 *   - Шаги 2-7 (utils → llm → extractors → scoring → audits → pipeline) всё ещё
 *     внутри монолита services/SiteCheckPipeline.ts. Будут вынесены в
 *     отдельных PR с npm run build после каждого шага.
 *
 * Все consumer'ы (Worker, Audit Mode v2, frontend, AiDeveloperPack) ОБЯЗАНЫ
 * импортировать из этого барреля или из ./types.js, не обращаясь к
 * SiteCheckPipeline.ts напрямую:
 *   import { runPipeline, type PipelineResult } from '../services/SiteCheck/index.js';
 */

// Pipeline entry — оркестратор пока в монолите (Шаг 7 плана).
export { runPipeline } from '../SiteCheckPipeline.js';

// Public types — единственный источник истины (физически в ./types.ts).
export type {
  Issue,
  Stage0Data,
  RobotsData,
  RobotsBotEntry,
  SitemapData,
  LlmsTxtData,
  ResourcesData,
  GeoSignalsData,
  CROData,
  BenchmarkData,
  BenchmarkGap,
  RedirectHop,
  PipelineResult,
} from './types.js';
