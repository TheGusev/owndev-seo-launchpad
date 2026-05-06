/**
 * SiteCheck — public entry point.
 *
 * Pipeline orchestrator (`runPipeline`) still lives in services/SiteCheckPipeline.ts
 * (~2350 LoC). Types have been extracted to ./types.ts as part of the refactor
 * (see ./REFACTOR_PLAN.md). Subsequent steps will move audits/extractors/scoring
 * into dedicated files under audits/, extractors/, scoring/, utils/.
 *
 * All consumers (Worker, future gap-analyzer) MUST import from this barrel:
 *   import { runPipeline, type PipelineResult } from '../services/SiteCheck/index.js';
 */

// Pipeline entry (still in monolith for now)
export { runPipeline } from '../SiteCheckPipeline.js';

// Public types — single source of truth (re-exports from monolith via types.ts)
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
