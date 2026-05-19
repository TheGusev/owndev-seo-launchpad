/**
 * keywordSeedBuilder — построение seed-фраз для DEMAND-стейджа с учётом
 * синонимов базовой услуги и объектов услуги (targets).
 *
 * Раньше pipelineOrchestrator собирал seeds по плоской схеме
 *   "<industry> <city> [modifier]" — для дезинфекции это давало 6-8 фраз
 *   уровня "дезинфекция москва цена", без раскрытия семантики
 *   ("обработка от тараканов", "уничтожение клопов", "травля муравьёв").
 *
 * Теперь профиль вертикали может содержать synonyms[] и targets[]. На их
 * основе мы раскручиваем seed-набор:
 *   A) база: synonym × city                     ("обработка москва")
 *   B) с целью: synonym × target × city         ("обработка от тараканов москва")
 *   C) с per-city модификатором                 ("дезинфекция москва срочно")
 *   D) глобальные модификаторы                  ("дезинфекция отзывы")
 *
 * Если профиль не содержит synonyms/targets — fallback на старое поведение
 * (industry × city × modifier), чтобы не ломать обратную совместимость.
 *
 * Лимит maxSeeds (по умолчанию 24) защищает Wordstat-квоту.
 */
import type { IndustryProfile } from './profiles/index.js';

export interface SeedBuilderInput {
  industry: string;
  cities: string[];
  profile: IndustryProfile;
  maxSeeds?: number;
}

export interface SeedBuilderResult {
  seeds: string[];
  expansion_stats: {
    base_count: number;
    target_count: number;
    modifier_count: number;
    synonym_used: number;
  };
}

const DEFAULT_MAX_SEEDS = 24;

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function buildKeywordSeeds(input: SeedBuilderInput): SeedBuilderResult {
  const industry = norm(input.industry);
  const cities = (input.cities ?? [])
    .map((c) => norm(c))
    .filter((c) => c.length > 0);
  const profile = input.profile;
  const maxSeeds = Math.max(1, input.maxSeeds ?? DEFAULT_MAX_SEEDS);

  // Уникальный набор базовых фраз: сама industry + синонимы профиля.
  // Поддерживаем порядок: industry первым (как наиболее точная фраза).
  const basesSet = new Set<string>();
  const bases: string[] = [];
  function pushBase(b: string) {
    const n = norm(b);
    if (n.length === 0) return;
    if (basesSet.has(n)) return;
    basesSet.add(n);
    bases.push(n);
  }
  pushBase(industry);
  for (const s of profile.synonyms ?? []) pushBase(s);

  const targets = (profile.targets ?? []).map((t) => norm(t)).filter((t) => t.length > 0);
  const modsPerCity = (profile.modifiers_per_city ?? [])
    .map((m) => norm(m))
    .filter((m) => m.length > 0);
  const modsGlobal = (profile.modifiers_global ?? [])
    .map((m) => norm(m))
    .filter((m) => m.length > 0);

  const seeds: string[] = [];
  const seedsSet = new Set<string>();
  const stats = {
    base_count: 0,
    target_count: 0,
    modifier_count: 0,
    synonym_used: 0,
  };
  // Какие синонимы реально пошли в выдачу (без industry).
  const usedSynonyms = new Set<string>();

  function pushSeed(phrase: string, kind: 'base' | 'target' | 'modifier'): boolean {
    if (seeds.length >= maxSeeds) return false;
    const p = norm(phrase);
    if (p.length === 0) return false;
    if (seedsSet.has(p)) return false;
    seedsSet.add(p);
    seeds.push(p);
    if (kind === 'base') stats.base_count += 1;
    else if (kind === 'target') stats.target_count += 1;
    else stats.modifier_count += 1;
    return true;
  }

  function trackSynonym(base: string) {
    if (base !== industry) usedSynonyms.add(base);
  }

  const effectiveCities = cities.length > 0 ? cities : [''];
  const hasSynonyms = bases.length > 1;
  const hasTargets = targets.length > 0;

  // A) База: industry × city (только сама industry — синонимы без target дают
  //    мало пользы и быстро съедают бюджет; полные synonym×city добавим в
  //    блоке E если останется место).
  for (const city of effectiveCities) {
    const phrase = city ? `${industry} ${city}` : industry;
    pushSeed(phrase, 'base');
    if (seeds.length >= maxSeeds) break;
  }

  // B) С целью: внешний цикл по city, чтобы сначала покрыть разнообразие
  //    пар (synonym × target) для основного города, потом для второго и
  //    т.д. Внутри города идём по диагонали (base_idx + target_idx) —
  //    каждая диагональ даёт новые пары, а не выжирает бюджет одним
  //    базовым префиксом или одним объектом.
  if (hasTargets && seeds.length < maxSeeds) {
    const maxDiag = bases.length + targets.length - 1;
    outer: for (const city of effectiveCities) {
      for (let d = 0; d < maxDiag; d++) {
        for (let bi = 0; bi <= d; bi++) {
          const ti = d - bi;
          if (bi >= bases.length || ti >= targets.length) continue;
          const base = bases[bi];
          const target = targets[ti];
          const phrase = city ? `${base} ${target} ${city}` : `${base} ${target}`;
          if (pushSeed(phrase, 'target')) trackSynonym(base);
          if (seeds.length >= maxSeeds) break outer;
        }
      }
    }
  } else if (hasSynonyms && seeds.length < maxSeeds) {
    // Если targets нет, но synonyms есть — раскатываем synonym × city.
    outer2: for (const base of bases) {
      if (base === industry) continue;
      for (const city of effectiveCities) {
        const phrase = city ? `${base} ${city}` : base;
        if (pushSeed(phrase, 'base')) trackSynonym(base);
        if (seeds.length >= maxSeeds) break outer2;
      }
    }
  }

  // C) Базовые с модификаторами per_city — используем industry, чтобы не
  //    раздувать фразы синонимами на этом уровне (старое поведение).
  if (seeds.length < maxSeeds) {
    outer: for (const city of cities) {
      for (const mod of modsPerCity) {
        const phrase = `${industry} ${city} ${mod}`;
        pushSeed(phrase, 'modifier');
        if (seeds.length >= maxSeeds) break outer;
      }
    }
  }

  // D) Глобальные модификаторы.
  if (seeds.length < maxSeeds) {
    for (const mod of modsGlobal) {
      pushSeed(`${industry} ${mod}`, 'modifier');
      if (seeds.length >= maxSeeds) break;
    }
  }

  // Fallback: если профиль не дал ни синонимов, ни целей и пока не набрали
  // даже по 1 фразе на город — добавим саму industry и industry+city.
  if (!hasSynonyms && !hasTargets && seeds.length < maxSeeds) {
    pushSeed(industry, 'base');
    for (const city of cities) {
      pushSeed(`${industry} ${city}`, 'base');
      if (seeds.length >= maxSeeds) break;
    }
  }

  stats.synonym_used = usedSynonyms.size;

  return { seeds, expansion_stats: stats };
}
