/**
 * SiteCheck — public types.
 *
 * Phase 1 of refactor: this file is currently a thin re-export shim over
 * services/SiteCheckPipeline.ts (the monolith), so all consumers can already
 * pin their imports here:
 *
 *   import type { Issue, PipelineResult } from '../services/SiteCheck/types.js';
 *
 * Phase 2 of refactor (REFACTOR_PLAN.md, Step 1): the actual `interface`
 * definitions move INTO this file, and SiteCheckPipeline.ts re-imports them.
 * Consumers don't need to change anything when that happens.
 *
 * DO NOT change shapes without coordinating: SiteCheckWorker, frontend
 * (ScoreCards/IssueCard), and the BD JSONB column site_check_scans.result
 * all depend on these contracts.
 */

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
} from '../SiteCheckPipeline.js';
