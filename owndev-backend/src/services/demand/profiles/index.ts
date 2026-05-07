/**
 * services/demand/profiles — отраслевые профили модификаторов
 * для авто-генерации seed-фраз в DEMAND-стейдже pipeline.
 *
 * Идея:
 *   Раньше auto-seed строил всегда одинаковый шаблон:
 *     <industry> <city> [цена | заказать | стоимость]
 *   Это плохо работает для разных типов бизнеса:
 *     • для аварийных — нужны «срочно/круглосуточно/вызов/выезд»
 *     • для медицины — «приём/запись»
 *     • для оптовиков — «купить оптом/прайс»
 *     • для бьюти — «запись/акции»
 *
 *   Профиль = JSON-файл рядом с этим index.ts. Каждый профиль содержит:
 *     - id              — уникальный ключ
 *     - title           — человекочитаемое имя (для логов и UI)
 *     - match[]         — список под-строк, по которым industry-строка
 *                          сопоставляется с профилем (case-insensitive,
 *                          substring-match)
 *     - modifiers_per_city[] — приклеиваются к каждому городу:
 *                              "<industry> <city> <mod>"
 *     - modifiers_global[]   — отдельные seed-фразы без города:
 *                              "<industry> <mod>"
 *
 * Файлы загружаются через createRequire (стабильно в ESM на Node ≥14 без флагов
 * и import-attributes), а путь собирается от import.meta.url — работает и
 * из src (tsx), и из dist (скомпилированный build).
 *
 * Чтобы JSON-файлы попадали в dist/, в npm run build добавлено копирование
 * src/services/demand/profiles/*.json → dist/services/demand/profiles/.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { logger } from '../../../utils/logger.js';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
function loadJson(name: string): unknown {
  return require(path.join(here, name));
}

const servicesDefault = loadJson('./services_default.json');
const servicesEmergency = loadJson('./services_emergency.json');
const medical = loadJson('./medical.json');
const beauty = loadJson('./beauty.json');
const repair = loadJson('./repair.json');
const education = loadJson('./education.json');
const b2bWholesale = loadJson('./b2b_wholesale.json');
const realestate = loadJson('./realestate.json');
const auto = loadJson('./auto.json');

export interface IndustryProfile {
  id: string;
  title: string;
  match: string[];
  modifiers_per_city: string[];
  modifiers_global: string[];
}

const RAW_PROFILES: unknown[] = [
  servicesDefault,
  servicesEmergency,
  medical,
  beauty,
  repair,
  education,
  b2bWholesale,
  realestate,
  auto,
];

function normalizeProfile(raw: unknown): IndustryProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<IndustryProfile>;
  if (typeof r.id !== 'string') return null;
  if (!Array.isArray(r.match)) return null;
  if (!Array.isArray(r.modifiers_per_city)) return null;
  return {
    id: r.id,
    title: typeof r.title === 'string' ? r.title : r.id,
    match: r.match.map((m) => String(m).toLowerCase()),
    modifiers_per_city: r.modifiers_per_city.map((m) => String(m)),
    modifiers_global: Array.isArray(r.modifiers_global)
      ? r.modifiers_global.map((m) => String(m))
      : [],
  };
}

let profilesCache: IndustryProfile[] | null = null;

function ensureLoaded(): IndustryProfile[] {
  if (profilesCache) return profilesCache;
  const result: IndustryProfile[] = [];
  for (const raw of RAW_PROFILES) {
    const p = normalizeProfile(raw);
    if (p) {
      result.push(p);
    } else {
      logger.warn('DEMAND_PROFILES', 'skipped malformed profile entry');
    }
  }
  logger.info(
    'DEMAND_PROFILES',
    `loaded ${result.length} profiles: ${result.map((p) => p.id).join(', ')}`,
  );
  profilesCache = result;
  return result;
}

/**
 * Подобрать профиль под industry-строку. Берём самый «специфичный» матч
 * (самый длинный совпавший токен из match[]). Если ни один профиль не подошёл —
 * services_default. Если файлы не подгрузились — inline fallback.
 */
export function pickProfileForIndustry(industry: string | null | undefined): IndustryProfile {
  const all = ensureLoaded();
  const norm = (industry ?? '').toLowerCase().trim();

  if (norm.length > 0 && all.length > 0) {
    let best: { profile: IndustryProfile; len: number } | null = null;
    for (const p of all) {
      if (p.id === 'services_default') continue;
      for (const m of p.match) {
        if (m.length === 0) continue;
        if (norm.includes(m)) {
          if (!best || m.length > best.len) {
            best = { profile: p, len: m.length };
          }
        }
      }
    }
    if (best) return best.profile;
  }

  const def = all.find((p) => p.id === 'services_default');
  if (def) return def;

  return {
    id: 'services_default_inline',
    title: 'Услуги (inline fallback)',
    match: ['default'],
    modifiers_per_city: ['цена', 'стоимость', 'заказать', 'недорого'],
    modifiers_global: ['отзывы'],
  };
}

/** Тестовый/диагностический хелпер. */
export function listLoadedProfiles(): IndustryProfile[] {
  return [...ensureLoaded()];
}
