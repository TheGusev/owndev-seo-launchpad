/**
 * services/pipeline — V3 pipeline orchestrator types.
 *
 * Stages (linear with optional async hand-off via BullMQ):
 *   0. INTAKE      — validate input, classify project_code, persist job
 *   1. DEMAND      — Wordstat clusters + geo distribution
 *   2. CRAWL       — fetch site, optional Jina fallback for SPA
 *   3. AUDIT       — extractors + audits → PageEvidence per page
 *   4. PREFLIGHT   — 4-axis scoring per page, rollup at job level
 *   5. PACK        — strategy + page contracts + technical passport →
 *                    super_prompt_pack v1 → ZIP
 */

import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';
import type { DemandIntelligenceResult } from '../demand/types.js';
import type { SiteStrategy } from '../strategy/types.js';
import type { TechnicalPassportArtifacts } from '../technicalPassport/types.js';
import type { PreflightReport } from '../preflight/types.js';
import type { SuperPromptPack, ExportMode, PlatformTarget } from '../developerPack/types.js';
import type { CrawlPageRecord } from '../CrawlEngine/types.js';

export type PipelineStage = 'intake' | 'demand' | 'crawl' | 'audit' | 'preflight' | 'pack' | 'done' | 'failed';

export interface PipelineInput {
  job_id: string;                    // formula_jobs.id
  root_url: string;
  project_code: ProjectTypeCodeV3;
  brand: {
    name: string;
    industry: string;
    target_audience: string;
    competitive_position?: string;
    primary_city?: string;
    contact_email?: string;
  };
  // demand inputs
  seed_keywords?: string[];
  recommended_geos?: string[];
  // pack inputs
  pack_mode?: ExportMode;            // default 'structured'
  platform_target?: PlatformTarget;
  ai_training_policy?: 'allow' | 'deny' | 'allow_with_attribution';
  // toggles
  skip_demand?: boolean;
  skip_crawl?: boolean;
  max_crawl_pages?: number;
}

export interface PipelineStageResult {
  stage: PipelineStage;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  ok: boolean;
  error?: string;
}

export interface PipelineResultV3 {
  job_id: string;
  root_url: string;
  status: 'done' | 'failed';
  stages: PipelineStageResult[];
  demand?: DemandIntelligenceResult;
  crawl_pages?: CrawlPageRecord[];
  preflight_per_page?: PreflightReport[];
  preflight_rollup?: {
    total_pages: number;
    avg_total_score: number;
    pages_passed: number;
    pages_failed: number;
    failed_p0_codes: string[];
    axis_avg: { seo: number; direct: number; schema: number; ai_llm: number };
  };
  strategy?: SiteStrategy;
  passport?: TechnicalPassportArtifacts;
  pack?: SuperPromptPack;
  pack_zip_size?: number;
  generated_at: string;
}
