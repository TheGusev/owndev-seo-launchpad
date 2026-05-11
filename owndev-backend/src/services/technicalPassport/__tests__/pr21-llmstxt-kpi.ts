/**
 * Регресс-тест PR-21 «llms.txt подтягивает KPI/CR/CPA из vertical_profile».
 *
 * Цель: убедиться, что buildLlmsTxt() добавляет раздел «## Business KPIs» с
 * метриками из vertical_profile для целевого project_code, а при отсутствии
 * профиля или KPI — этого раздела нет (и нет undefined-строк).
 * Закрывает H9 ASI-вердикта PR-14.
 *
 * Запуск: tsx src/services/technicalPassport/__tests__/pr21-llmstxt-kpi.ts
 */

import { buildLlmsTxt } from '../llmsTxtBuilder.js';
import type { PassportInputs } from '../types.js';
import type { SiteStrategy } from '../../strategy/types.js';
import type { ProjectTypeCodeV3 } from '../../../types/formulaV3.js';
import type { GeneratedPageContract } from '../../pageContracts/types.js';

let failed = 0;
function assert(cond: unknown, msg: string) {
  if (!cond) {
    // eslint-disable-next-line no-console
    console.error(`  ❌ ${msg}`);
    failed++;
  } else {
    // eslint-disable-next-line no-console
    console.log(`  ✅ ${msg}`);
  }
}

function makeContract(pageType: string): GeneratedPageContract {
  return {
    page_type: pageType,
    url_pattern: '/',
    h1_template: `Заголовок ${pageType}`,
    title_template: `Title ${pageType}`,
    meta_description_template: `Meta ${pageType}`,
    intro_answer_template: 'Краткий ответ на главный вопрос пользователя по странице. Дополнительное предложение.',
    faq_questions: [],
    required_blocks: [],
    required_commercial_signals: [],
    required_schema_graph: [],
    notes_ru: null,
  };
}

function makeStrategy(projectCode: ProjectTypeCodeV3): SiteStrategy {
  return {
    project_code: projectCode,
    brand_name: 'Тестовый бренд',
    positioning: 'Короткое позиционирование тестового бренда.',
    primary_audience: 'Целевая аудитория',
    primary_cta: 'lead_form',
    funnel_stages: [
      { stage: 'awareness', page_types: ['home'], primary_cta: 'lead_form' },
      { stage: 'consideration', page_types: ['service'], primary_cta: 'lead_form' },
    ],
    pages: [
      {
        page_type: 'home',
        url_pattern: '/',
        priority: 1.0,
        changefreq: 'weekly',
        primary_cta: 'lead_form',
        contract: makeContract('home'),
        reasoning: 'home',
      },
    ],
    recommended_geos: ['RU-MOW'],
    total_clusters: 3,
    generated_at: new Date().toISOString(),
  };
}

function makeInputs(): PassportInputs {
  return {
    brand_name: 'Тестовый бренд',
    domain: 'example.com',
    base_url: 'https://example.com',
    contact_email: 'hello@example.com',
    description_ru: 'Тестовое описание',
    primary_geo: 'RU',
    languages: ['ru'],
    ai_training_policy: 'allow_with_attribution',
    license: 'proprietary',
    sitemap_pages: [],
  };
}

async function run() {
  // eslint-disable-next-line no-console
  console.log('\n📋 PR-21 llms.txt × Business KPIs');

  // ── Case 1: service_geo — профиль с полным набором KPI ──────────────
  const txtGeo = buildLlmsTxt(makeInputs(), makeStrategy('service_geo'));
  assert(
    txtGeo.includes('## Business KPIs'),
    'service_geo: llms.txt содержит раздел «## Business KPIs»',
  );
  assert(
    /Conversion Rate \(visit → lead\): ~5\.0%/.test(txtGeo),
    'service_geo: CR visit→lead = ~5.0% (из vertical_profile)',
  );
  assert(
    /Conversion Rate \(lead → sale\): ~45%/.test(txtGeo),
    'service_geo: CR lead→sale = ~45%',
  );
  assert(
    /CPA target: ~700/.test(txtGeo),
    'service_geo: CPA target = ~700 ₽',
  );
  assert(
    /Средний чек \(AOV\): ~6\s?000/.test(txtGeo),
    'service_geo: AOV = ~6 000 ₽',
  );
  assert(
    /LTV: ~18\s?000/.test(txtGeo),
    'service_geo: LTV = ~18 000 ₽',
  );
  assert(
    /Частотный индекс ниши: 75\/100/.test(txtGeo),
    'service_geo: frequency_index = 75/100',
  );
  // Раздел «Business KPIs» должен идти ПЕРЕД секциями страниц (funnel_stages).
  const idxKpi = txtGeo.indexOf('## Business KPIs');
  const idxPages = txtGeo.indexOf('## Главное и контент');
  assert(idxKpi > 0 && idxPages > 0 && idxKpi < idxPages, 'service_geo: Business KPIs выше pages-секций');
  assert(!txtGeo.includes('undefined'), 'service_geo: нет undefined в llms.txt');

  // ── Case 2: gov — cpa_rub=0, ltv_rub=0, average_order_rub=0 → строки скрыты
  const txtGov = buildLlmsTxt(makeInputs(), makeStrategy('gov'));
  assert(
    txtGov.includes('## Business KPIs'),
    'gov: раздел Business KPIs присутствует (есть CR и frequency_index)',
  );
  assert(!/CPA target/.test(txtGov), 'gov: CPA-строка скрыта при cpa_rub=0');
  assert(!/Средний чек/.test(txtGov), 'gov: AOV-строка скрыта при average_order_rub=0');
  assert(!/LTV:/.test(txtGov), 'gov: LTV-строка скрыта при ltv_rub=0');
  assert(!txtGov.includes('undefined'), 'gov: нет undefined в llms.txt');

  // ── Case 3: project_code без профиля — Business KPIs отсутствует ────
  // getVerticalProfile вернёт null → раздел не должен появиться.
  const txtUnknown = buildLlmsTxt(
    makeInputs(),
    makeStrategy('this_code_does_not_exist' as ProjectTypeCodeV3),
  );
  assert(
    !txtUnknown.includes('## Business KPIs'),
    'unknown project_code: раздел Business KPIs отсутствует',
  );
  assert(!txtUnknown.includes('undefined'), 'unknown project_code: нет undefined в llms.txt');

  // ── Case 4: общие свойства llms.txt не сломаны ──────────────────────
  assert(txtGeo.startsWith('# Тестовый бренд'), 'llms.txt начинается с # бренд');
  assert(txtGeo.includes('## Контакт для AI'), 'llms.txt содержит «## Контакт для AI»');
  assert(txtGeo.includes('hello@example.com'), 'llms.txt содержит контактный email');

  if (failed > 0) {
    // eslint-disable-next-line no-console
    console.error(`\n❌ PR-21: ${failed} assertion(s) failed\n`);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log('\n✅ PR-21: все ассерты прошли\n');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
