/**
 * PR-31: sanity-тесты для buildKeywordSeeds + vertical_minus_words в
 * buildDirectExport.
 *
 * Сценарии:
 *   1. Дезинфекция × 3 города × профиль services_emergency:
 *        seeds.length >= 20, видны "обработка от тараканов",
 *        "уничтожение клопов", "травля".
 *   2. Профиль без synonyms/targets → fallback на industry × city:
 *        seeds.length >= cities.length.
 *   3. buildDirectExport с profile.vertical_minus_words:
 *        campaign_minus_words содержит и глобальные ("бесплатно"), и
 *        vertical-специфичные ("своими руками" встречается, плюс уникальные
 *        из профиля как "народные средства").
 *   4. Минусы для двух разных профилей отличаются.
 */
import { buildKeywordSeeds } from '../src/services/demand/keywordSeedBuilder.js';
import type { IndustryProfile } from '../src/services/demand/profiles/index.js';
import { pickProfileForIndustry, listLoadedProfiles } from '../src/services/demand/profiles/index.js';
import { buildDirectExport } from '../src/services/demand/directCampaignExporter.js';
import type { DemandClusterV3 } from '../src/services/demand/types.js';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    throw new Error(`[pr31] FAIL: ${msg}`);
  }
}

// ── Сценарий 1: дезинфекция × 3 города × services_emergency ──
{
  const profile = pickProfileForIndustry('дезинфекция');
  assert(profile.id === 'services_emergency', `подобрался профиль services_emergency, got ${profile.id}`);
  assert(
    Array.isArray(profile.synonyms) && profile.synonyms.length > 0,
    'services_emergency должен иметь synonyms',
  );
  assert(
    Array.isArray(profile.targets) && profile.targets.length > 0,
    'services_emergency должен иметь targets',
  );

  const { seeds, expansion_stats } = buildKeywordSeeds({
    industry: 'дезинфекция',
    cities: ['москва', 'спб', 'казань'],
    profile,
    maxSeeds: 24,
  });

  assert(seeds.length >= 20, `seeds.length >= 20, got ${seeds.length}`);
  assert(seeds.length <= 24, `seeds.length <= 24, got ${seeds.length}`);

  // Должен быть хотя бы один seed с "обработка" и "тарак"
  const hasObrTarak = seeds.some((s) => s.includes('обработка') && s.includes('тарак'));
  assert(hasObrTarak, `должен быть seed с "обработка" и "тарак", got: ${seeds.join(' | ')}`);

  // Должен быть seed с "травля" (один из ключевых синонимов из жалобы юзера)
  const hasTravlya = seeds.some((s) => s.includes('травля'));
  assert(hasTravlya, `должен быть seed с "травля", got: ${seeds.join(' | ')}`);

  // Должно быть хотя бы 4 разных синонима, применённых в seeds (industry +
  //   как минимум 3 из synonyms — это раскрывает семантику запроса).
  const synonymHits = ['обработка', 'санобработка', 'дезинсекция', 'дератизация', 'травля', 'уничтожение', 'выведение']
    .filter((syn) => seeds.some((s) => s.startsWith(`${syn} `) || s === syn));
  assert(
    synonymHits.length >= 3,
    `должно быть >=3 синонимов в seeds, got ${synonymHits.length}: [${synonymHits.join(', ')}]`,
  );

  // Должно быть хотя бы 3 разных target-объекта в seeds (раскрытие семантики
  //   "от тараканов / от клопов / от муравьёв / от плесени" и т.д.).
  const targetHits = ['тарак', 'клоп', 'муравь', 'крыс', 'мышей', 'блох', 'плесен', 'грибк']
    .filter((t) => seeds.some((s) => s.includes(t)));
  assert(
    targetHits.length >= 3,
    `должно быть >=3 разных targets в seeds, got ${targetHits.length}: [${targetHits.join(', ')}]`,
  );

  assert(expansion_stats.synonym_used >= 3, `synonym_used >= 3, got ${expansion_stats.synonym_used}`);
  assert(expansion_stats.target_count > 0, `target_count > 0, got ${expansion_stats.target_count}`);
  console.log(
    `[pr31] scenario 1 OK — seeds=${seeds.length}, synonyms_used=${expansion_stats.synonym_used}, ` +
      `target_count=${expansion_stats.target_count}`,
  );
}

// ── Сценарий 2: профиль без synonyms/targets → fallback ──
{
  const minimalProfile: IndustryProfile = {
    id: 'minimal',
    title: 'minimal',
    match: ['minimal'],
    // synonyms/targets/vertical_minus_words опущены сознательно
    modifiers_per_city: ['цена', 'недорого'],
    modifiers_global: ['отзывы'],
  };
  const { seeds } = buildKeywordSeeds({
    industry: 'пицца',
    cities: ['москва', 'спб'],
    profile: minimalProfile,
    maxSeeds: 24,
  });
  assert(
    seeds.length >= 2,
    `fallback: seeds.length >= cities.length (2), got ${seeds.length}`,
  );
  assert(seeds.includes('пицца москва'), `fallback должен содержать "пицца москва"`);
  assert(seeds.includes('пицца спб'), `fallback должен содержать "пицца спб"`);
  // С модификаторами per_city тоже должен раскатать
  assert(
    seeds.some((s) => s.includes('цена')),
    `fallback должен использовать modifiers_per_city`,
  );
  console.log(`[pr31] scenario 2 OK — fallback seeds=${seeds.length}`);
}

// ── Сценарий 3: vertical_minus_words в exporter ──
{
  const cluster: DemandClusterV3 = {
    session_id: 'pr31-test',
    cluster_label: 'Дезинфекция Москва',
    intent: 'transactional',
    seed_keyword: 'дезинфекция',
    region_code: '213',
    keywords: [
      { phrase: 'дезинфекция', frequency: 1000 },
      { phrase: 'дезинфекция москва', frequency: 800 },
    ],
    total_frequency: 1800,
    recommended_page_type: 'service',
    recommended_url_pattern: '/услуги/{slug}',
  };

  const profile = pickProfileForIndustry('дезинфекция');
  const r = buildDirectExport([cluster], {
    brand: 'Acme',
    cityName: 'Москва',
    profile: {
      id: profile.id,
      vertical_minus_words: profile.vertical_minus_words,
    },
  });

  // Глобальные минусы должны остаться
  assert(
    r.campaign_minus_words.includes('бесплатно'),
    'campaign_minus_words должен содержать глобальное "бесплатно"',
  );
  // vertical-специфичные минусы должны быть добавлены
  assert(
    r.campaign_minus_words.includes('народные средства'),
    `vertical_minus_words: должно быть "народные средства", got [${r.campaign_minus_words.join(', ')}]`,
  );
  assert(
    r.campaign_minus_words.includes('как избавиться самостоятельно'),
    `vertical_minus_words: должно быть "как избавиться самостоятельно"`,
  );
  console.log(`[pr31] scenario 3 OK — campaign_minus_words count=${r.campaign_minus_words.length}`);
}

// ── Сценарий 4: разные профили → разные минусы ──
{
  const cluster: DemandClusterV3 = {
    session_id: 'pr31-test-4',
    cluster_label: 'cluster',
    intent: 'transactional',
    seed_keyword: 'seed',
    region_code: '213',
    keywords: [
      { phrase: 'a', frequency: 1 },
      { phrase: 'b', frequency: 1 },
    ],
    total_frequency: 2,
    recommended_page_type: 'service',
    recommended_url_pattern: '/x',
  };

  const profEmergency = pickProfileForIndustry('дезинфекция');
  const profRealestate = pickProfileForIndustry('купить квартиру');

  const r1 = buildDirectExport([cluster], {
    profile: {
      id: profEmergency.id,
      vertical_minus_words: profEmergency.vertical_minus_words,
    },
  });
  const r2 = buildDirectExport([cluster], {
    profile: {
      id: profRealestate.id,
      vertical_minus_words: profRealestate.vertical_minus_words,
    },
  });

  // Минусы должны различаться (как минимум по содержимому уникальных для вертикали).
  const set1 = new Set(r1.campaign_minus_words.map((s) => s.toLowerCase()));
  const set2 = new Set(r2.campaign_minus_words.map((s) => s.toLowerCase()));
  const onlyIn1 = [...set1].filter((s) => !set2.has(s));
  const onlyIn2 = [...set2].filter((s) => !set1.has(s));
  assert(
    onlyIn1.length > 0 || onlyIn2.length > 0,
    `минусы для двух разных профилей должны отличаться, got одинаковые`,
  );
  // Конкретно: realestate имеет "циан"/"авито", emergency — "народные средства"
  assert(set1.has('народные средства'), `emergency должен иметь "народные средства"`);
  assert(set2.has('циан') || set2.has('cian'), `realestate должен иметь "циан"`);
  console.log(
    `[pr31] scenario 4 OK — emergency-only=${onlyIn1.length}, realestate-only=${onlyIn2.length}`,
  );
}

// ── Сценарий 5: убедимся что все профили проходят нормализацию ──
{
  const all = listLoadedProfiles();
  assert(all.length >= 9, `должно быть загружено >= 9 профилей, got ${all.length}`);
  for (const p of all) {
    // synonyms/targets/vertical_minus_words должны быть массивами после нормализации
    assert(Array.isArray(p.synonyms), `${p.id}: synonyms должен быть массивом`);
    assert(Array.isArray(p.targets), `${p.id}: targets должен быть массивом`);
    assert(
      Array.isArray(p.vertical_minus_words),
      `${p.id}: vertical_minus_words должен быть массивом`,
    );
  }
  console.log(`[pr31] scenario 5 OK — все ${all.length} профилей нормализованы`);
}

console.log('[pr31] OK — все сценарии прошли');
