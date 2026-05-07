/**
 * services/preflight — v1 P0-guardrails адаптер.
 *
 * Это «мостовой» модуль: подгружает 6 P0-guardrails из таблицы
 * formula_v1_p0_guardrails (миграция 039) и проецирует их на PreflightFinding[],
 * чтобы axisScorer применял их так же, как любые другие P0-правила.
 *
 * Принципы:
 *   • v1-ядро (runEngine) НЕ модифицируется. Эти guardrails — справочник на стороне v3.
 *   • Если engine_state не передан → guardrails применяются все (consition='always'
 *     активны, scale_or_high_restructuring_risk — пропускается).
 *   • Если передан engine_state → P0_VERIFICATION_ON_SCALE активируется при
 *     project_class = 'scale' ИЛИ derived_scores.restructuring_risk >= 5.
 *   • PageEvidence используется как источник «доказательств» для passed/failed.
 *   • Если guardrails не загружаются (БД недоступна) — возвращаем пустой массив,
 *     v3 продолжает работать на legacy-правилах из preflight_rules.
 */

import { sql } from '../../db/client.js';
import type { EngineState } from '../../types/siteFormula.js';
import type {
  PreflightAxis,
  PreflightFinding,
  PageEvidence,
} from './types.js';

interface V1GuardrailRow {
  rule_code: string;
  axis: PreflightAxis;
  applies_when: 'always' | 'scale_or_high_restructuring_risk';
  flag_name: string;
  description_ru: string;
  remediation_ru: string;
}

let CACHE: V1GuardrailRow[] | null = null;
let CACHE_TS = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Подгружает активные guardrails из БД. Кеширует на 5 минут.
 * Если БД недоступна — возвращает [] и v3 работает на legacy-правилах.
 */
export async function loadV1Guardrails(): Promise<V1GuardrailRow[]> {
  const now = Date.now();
  if (CACHE && now - CACHE_TS < CACHE_TTL_MS) return CACHE;

  try {
    const rows = await sql<V1GuardrailRow[]>`
      SELECT rule_code, axis, applies_when, flag_name, description_ru, remediation_ru
      FROM formula_v1_p0_guardrails
      WHERE active = TRUE
      ORDER BY id
    `;
    CACHE = rows as unknown as V1GuardrailRow[];
    CACHE_TS = now;
    return CACHE;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[v1Guardrails] не удалось загрузить, fallback на пустой набор:', (err as Error).message);
    CACHE = [];
    CACHE_TS = now;
    return CACHE;
  }
}

/**
 * Решает, активен ли guardrail для текущего PRO-запроса.
 */
function isActive(
  g: V1GuardrailRow,
  engineState: EngineState | undefined,
): boolean {
  if (g.applies_when === 'always') return true;
  if (g.applies_when === 'scale_or_high_restructuring_risk') {
    if (!engineState) return false; // без engine_state не знаем — пропускаем
    if (engineState.project_class === 'scale') return true;
    const r = engineState.derived_scores?.restructuring_risk ?? 0;
    return r >= 5;
  }
  return false;
}

/**
 * Эвристики «проверки» каждого guardrail на основе PageEvidence.
 * Это консервативные эвристики: passed=true только если есть прямое
 * подтверждение, иначе passed=false (failing-as-default для P0 — намеренно,
 * чтобы пользователь увидел, что нужно подтвердить).
 *
 * ВАЖНО: passed=false здесь автоматически делает axis score = 0 в axisScorer
 * (см. правило «failed P0 → axis = 0»). Поэтому эти проверки строгие.
 */
function evaluateGuardrail(
  g: V1GuardrailRow,
  evidence: PageEvidence,
): boolean {
  switch (g.rule_code) {
    case 'V1_P0_ONE_URL_ONE_ENTITY':
      // Подтверждение: есть title + h1 + canonical (минимальные признаки уникальности).
      return evidence.has_title && evidence.has_h1 && evidence.has_canonical;

    case 'V1_P0_UTILITY_NOINDEX': {
      // Проверяем только utility-страницы. Не-utility — guardrail неприменим, passed=true.
      const isUtility = isUtilityPageType(evidence.page_type);
      if (!isUtility) return true;
      return !evidence.is_indexable;
    }

    case 'V1_P0_UTILITY_NO_SITEMAP': {
      const isUtility = isUtilityPageType(evidence.page_type);
      if (!isUtility) return true;
      return !evidence.in_sitemap;
    }

    case 'V1_P0_UTILITY_NO_SEO_LINKING':
      // На уровне одной страницы это нельзя точно проверить: нужно знать
      // топологию ссылок сайта. Здесь делаем мягкую проверку:
      // utility-страница не должна иметь много исходящих внутренних ссылок.
      if (!isUtilityPageType(evidence.page_type)) return true;
      return evidence.internal_link_count <= 5;

    case 'V1_P0_CENTRALIZED_ROUTING':
      // Признак: canonical присутствует и self-canonical установлен.
      return evidence.has_canonical && evidence.canonical_self;

    case 'V1_P0_VERIFICATION_ON_SCALE':
      // Для scale: должны быть llms.txt + last-updated + author-bio.
      return (
        evidence.has_llms_txt &&
        evidence.has_last_updated &&
        evidence.has_author_bio
      );

    default:
      // Неизвестный guardrail — не блокируем, passed=true.
      return true;
  }
}

const UTILITY_PAGE_TYPES = new Set([
  'cart', 'checkout', 'account', 'login', 'register', 'password_reset',
  'thank_you', 'order_status', 'profile', 'settings', 'utility',
]);

function isUtilityPageType(pageType?: string): boolean {
  if (!pageType) return false;
  return UTILITY_PAGE_TYPES.has(pageType);
}

/**
 * Главная функция модуля: возвращает PreflightFinding[] для всех активных
 * guardrails. Эти findings подмешиваются к existing findings перед buildReport,
 * и axisScorer их обработает как обычные P0.
 */
export async function buildV1GuardrailFindings(
  evidence: PageEvidence,
  engineState: EngineState | undefined,
): Promise<PreflightFinding[]> {
  const guardrails = await loadV1Guardrails();
  const findings: PreflightFinding[] = [];

  for (const g of guardrails) {
    if (!isActive(g, engineState)) continue;
    const passed = evaluateGuardrail(g, evidence);
    findings.push({
      rule_code: g.rule_code,
      axis: g.axis,
      severity: 'P0',
      weight: 0, // P0 не учитывается в score — failure обнуляет ось
      passed,
      description_ru: g.description_ru,
      remediation_ru: g.remediation_ru,
      evidence: {
        flag_name: g.flag_name,
        applies_when: g.applies_when,
        engine_state_project_class: engineState?.project_class ?? null,
      },
    });
  }

  return findings;
}

/** Только для тестов: сбросить кеш guardrails. */
export function _resetV1GuardrailsCache(): void {
  CACHE = null;
  CACHE_TS = 0;
}
