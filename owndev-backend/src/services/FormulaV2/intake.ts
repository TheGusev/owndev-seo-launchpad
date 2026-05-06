/**
 * Intake / project-type classifier.
 *
 * Maps free-form intake answers to one of the 19 project_types. This is the
 * primary v2 entry point — every blueprint or audit starts here.
 *
 * Strategy:
 *   1. If user explicitly picks a type (UI dropdown), use it.
 *   2. Otherwise, score each type based on keyword matches in name + description.
 *   3. Fallback to 'service_geo' (most common case for SMB Russian web).
 *
 * For now this is rule-based; an LLM-backed classifier can plug in later
 * via the same async function signature.
 */
import { listProjectTypes, getProjectType } from './repository.js';
import type { ProjectType, ProjectTypeCode } from '../../types/formulaV2.js';

export interface IntakeAnswers {
  // explicit choice
  project_type_code?: ProjectTypeCode;
  // free-form fields used for inference
  business_description?: string;
  industry?: string;
  has_physical_location?: boolean;
  sells_products?: boolean;
  has_appointments?: boolean;
  is_marketplace?: boolean;
  is_subscription?: boolean;
  audience?: 'b2b' | 'b2c' | 'mixed';
}

export interface IntakeResult {
  project_type: ProjectType;
  confidence: number; // 0..1
  reasoning: string;
  alternatives: Array<{ code: ProjectTypeCode; score: number }>;
}

// ─── Keyword bank per type ────────────────────────────────────
const KEYWORDS: Record<ProjectTypeCode, string[]> = {
  service_geo: ['услуг', 'выезд', 'мойк', 'ремонт', 'клининг', 'на дом', 'мастер', 'установк', 'монтаж'],
  service_pro: ['консалт', 'юрист', 'бухгалт', 'аудит', 'консультант', 'эксперт'],
  service_b2b: ['b2b', 'корпорат', 'для бизнеса', 'для компаний', 'агентств', 'аутсорс'],
  ecommerce: ['магазин', 'каталог', 'товар', 'купить', 'доставк', 'shop', 'cart', 'корзин'],
  marketplace: ['маркетплейс', 'площадк', 'продавец', 'продавц', 'marketplace', 'multivendor'],
  saas: ['saas', 'подписк', 'тариф', 'облач', 'платформ', 'crm', 'erp', 'app'],
  mobile_app: ['приложен', 'app store', 'google play', 'ios', 'android'],
  media: ['журнал', 'издани', 'новост', 'медиа', 'редакц'],
  blog: ['блог', 'личн', 'автор', 'эксперт', 'дневник'],
  education: ['курс', 'школ', 'обучен', 'тренинг', 'академ', 'университет', 'образован'],
  medical: ['клиник', 'врач', 'медицин', 'стоматолог', 'диагностик', 'госпитал'],
  legal: ['юрфирм', 'адвокат', 'юрист', 'нотари', 'правов'],
  finance: ['банк', 'финанс', 'кредит', 'инвест', 'страхов', 'микрофинанс'],
  realestate: ['недвижимост', 'квартир', 'дом', 'застройщик', 'аренд', 'риелтор'],
  hospitality: ['отель', 'гостиниц', 'ресторан', 'кафе', 'хостел'],
  events: ['событи', 'концерт', 'конференц', 'фестивал', 'тикет', 'билет'],
  nonprofit: ['нко', 'фонд', 'благотворит', 'волонт', 'некоммерч'],
  gov: ['муниципал', 'госорган', 'министерств', 'правительств', 'админ'],
  portfolio: ['портфолио', 'визитк', 'сайт-визит', 'studio', 'студи'],
};

function scoreType(type: ProjectType, answers: IntakeAnswers): number {
  const text = [
    answers.business_description ?? '',
    answers.industry ?? '',
  ]
    .join(' ')
    .toLowerCase();

  if (!text.trim()) return 0;

  const keywords = KEYWORDS[type.code] ?? [];
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) score += 1;
  }

  // Heuristic boosts
  if (answers.is_marketplace && type.code === 'marketplace') score += 5;
  if (answers.is_subscription && type.code === 'saas') score += 3;
  if (answers.sells_products && (type.code === 'ecommerce' || type.code === 'marketplace')) {
    score += 2;
  }
  if (answers.has_physical_location && type.code === 'service_geo') score += 2;
  if (answers.has_appointments && (type.code === 'medical' || type.code === 'service_geo')) {
    score += 1;
  }
  if (answers.audience === 'b2b' && type.code === 'service_b2b') score += 2;

  return score;
}

export async function classifyProjectType(answers: IntakeAnswers): Promise<IntakeResult> {
  // 1. Explicit choice wins.
  if (answers.project_type_code) {
    const explicit = await getProjectType(answers.project_type_code);
    if (explicit) {
      return {
        project_type: explicit,
        confidence: 1,
        reasoning: 'Explicit user selection',
        alternatives: [],
      };
    }
  }

  // 2. Score all types.
  const all = await listProjectTypes();
  const scored = all
    .map((t) => ({ type: t, score: scoreType(t, answers) }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];

  // 3. Fallback to service_geo if no signal at all.
  if (!top || top.score === 0) {
    const fallback = await getProjectType('service_geo');
    if (!fallback) throw new Error('Project types not seeded — run migrate');
    return {
      project_type: fallback,
      confidence: 0,
      reasoning: 'No keyword match; defaulting to service_geo',
      alternatives: scored.slice(0, 5).map((s) => ({ code: s.type.code, score: s.score })),
    };
  }

  const second = scored[1]?.score ?? 0;
  const margin = top.score - second;
  // Confidence is max-margin normalised, capped at 0.95 (never claim certainty
  // from rules alone).
  const confidence = Math.min(0.95, 0.4 + 0.1 * top.score + 0.05 * margin);

  return {
    project_type: top.type,
    confidence,
    reasoning: `Matched ${top.score} keyword(s); margin over runner-up = ${margin}`,
    alternatives: scored
      .slice(0, 5)
      .filter((s) => s.score > 0)
      .map((s) => ({ code: s.type.code, score: s.score })),
  };
}
