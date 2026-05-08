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
import type { EngineState } from '../../types/siteFormula.js';
import type { VerticalProfile } from '../verticals/types.js';

export type PipelineStage = 'intake' | 'demand' | 'crawl' | 'audit' | 'preflight' | 'pack' | 'done' | 'failed';

export interface PipelineInput {
  job_id: string;                    // formula_jobs.id
  // root_url опционален — клиент может ещё не иметь домена.
  // Если не задан — crawl/audit/preflight пропускаются.
  root_url?: string;
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
  // ───── Мост v1 → v3 (опционально, без слома обратной совместимости) ─────
  // Если передан, v3 поднимет project_class/dimensions/decision_trace из ядра v1
  // и применит фильтрацию контрактов по tier_size + взвешивание скоринга.
  // Если не передан — v3 работает как раньше (бесплатная v1 остаётся изолированной).
  engine_state?: EngineState;
  // ───── PR-3 Fan-out ─────
  // Пробрасываются в buildStrategy для развёртывания service-geo / category страниц +
  // построения hub-страниц из кластеров Wordstat. Без этих полей — legacy.
  cities?: Array<{ slug: string; label: string }>;
  service_directions?: Array<{ slug: string; label: string }>;
  enable_hub_pages?: boolean;
  // ───── PR-11 Cross-product fan-out защита ─────
  // Лимит общего числа сгенерированных посадок (направление × город).
  // По умолчанию 50 — защита от взрыва (24 города × 12 направлений = 288).
  fanout_max_pages?: number;
  // Если true, cross-product отключён — генерируется одна ось (cities или directions).
  disable_cross_product?: boolean;
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
  root_url?: string;
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
  // ───── PR-6 PRO-отчёт ─────
  // Если передан engine_state и/или есть профиль вертикали — собираем
  // дополнительный блок для UI: project_class + decision_trace + KPI + ROI-оценка.
  // Поле опционально; на фронтенде блок отрисовывается только при его наличии.
  pro_report?: ProReportV3;
}

export interface ProReportV3 {
  /** Класс проекта из v1 (start | growth | scale), если был engine_state. */
  project_class?: 'start' | 'growth' | 'scale';
  /** Причина класса — короткое объяснение для пользователя. */
  project_class_reason?: string;
  /** Решения движка v1 — что было активировано и почему. */
  decision_trace?: Array<{ rule_id?: string; outcome?: string; reason?: string; [k: string]: unknown }>;
  /** Использованный профиль вертикали (KPI, монетизация, бенчмарки). */
  vertical_profile?: VerticalProfile;
  /** Прикладные KPI-строки для UI (готовые к отображению). */
  kpi_summary?: string[];
  /** ROI-оценка месячного дохода/прибыли. Возвращается, если есть пагинация и KPI. */
  roi_estimate?: {
    expected_monthly_visits?: number;       // оценочно из preflight pages × среднего Wordstat
    expected_monthly_leads?: number;        // visits × cr_visit_to_lead
    expected_monthly_sales?: number;        // leads × cr_lead_to_sale
    expected_monthly_revenue_rub?: number;  // sales × average_order_rub
    expected_monthly_acquisition_cost_rub?: number; // leads × cpa_rub (если paid)
    rationale_ru?: string;                  // короткое объяснение расчёта
  };
  /** Применённые axis-веса (зеркало preflight). */
  axis_weights?: { SEO: number; DIRECT: number; SCHEMA: number; AI_LLM: number };
  /** Применённый порог total_score (зеркало preflight). */
  total_score_threshold?: number;
  // ───── PR-7: Wordstat / реклама / сезонность ─────
  /**
   * Рекламно-рыночный блок: оценка бюджета Я.Директа, сезонный коэффициент
   * на текущий месяц, индикатор конкурентности по составу интентов в demand.
   * Включается только если есть demand или есть профиль вертикали и данные о страницах.
   */
  ad_market_estimate?: {
    /** Высоконамеренный CPC, руб. (из бенчмарков ниши). */
    cpc_high_intent_rub?: number;
    /** Доля транзакционно-коммерческих интентов в demand (0..1). */
    transactional_share?: number;
    /** Оценочный месячный бюджет Я.Директа на «горячую» долю спроса, ₽. */
    monthly_paid_budget_rub?: number;
    /** Уровень конкурентности по интентам и CPC: low | medium | high. */
    competition_level?: 'low' | 'medium' | 'high';
    /** Окупаемость SEO-вложений из бенчмарка ниши, месяцев. */
    seo_payback_months?: number;
    /** Сезонный коэффициент на текущий месяц (1.0 = средний год). */
    seasonality_now?: number;
    /** Лучший месяц года по сезонности и сам коэффициент. */
    seasonality_peak?: { month: number; factor: number };
    /** Худший месяц года по сезонности и сам коэффициент. */
    seasonality_low?: { month: number; factor: number };
    /** Короткое объяснение расчёта на русском. */
    rationale_ru?: string;
  };
  // ───── PR-11: прозрачность источника данных ─────
  /**
   * Источник Wordstat-данных в этом отчёте.
   *  - 'real_wordstat' — были реальные вызовы Yandex Search API v2;
   *  - 'mock' — синтетические детерминированные данные (базовый режим без API-ключа).
   * UI при 'mock' показывает явный баннер «Демо-данные».
   */
  data_source?: 'mock' | 'real_wordstat';
  /** Баннер-предупреждение для UI, если data_source='mock'. */
  data_source_warning?: string;
}
