/**
 * Регресс-тест PR-20 «Schema.org MobileApplication + NGO».
 *
 * Цель: убедиться, что buildGraph() для project_type=mobile_app эмитит узел
 * @type=MobileApplication, а для project_type=nonprofit — @type=NGO.
 * Закрывает H6 / КП-4 / КП-5 ASI-вердикта PR-14.
 *
 * Запуск: tsx src/services/schemaRegistry/__tests__/pr20-mobileapp-ngo.ts
 */

import { buildGraph, validateGraph } from '../index.js';
import type { GraphBuildInput } from '../graphBuilder.js';

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

function baseInput(projectCode: string, pageType: string): GraphBuildInput {
  return {
    project_code: projectCode as any,
    page_type: pageType,
    page_url: 'https://example.org/',
    page_name: 'Главная',
    page_description: 'Описание страницы',
    schema_ctx: {
      brand_name: 'Тестовый бренд',
      url: 'https://example.org/',
      logo_url: 'https://example.org/logo.png',
      phone: '+7 495 000-00-00',
      email: 'hello@example.org',
      address: {
        street: 'ул. Пушкина, 1',
        city: 'Москва',
        country: 'RU',
      },
    },
  };
}

async function run() {
  // eslint-disable-next-line no-console
  console.log('\n📋 PR-20 Schema.org MobileApplication + NGO');

  // ── mobile_app/home → MobileApplication присутствует
  const mobileInput: GraphBuildInput = {
    ...baseInput('mobile_app', 'home'),
    mobileapp_ctx: {
      name: 'MyApp Mobile',
      description: 'Лучшее приложение для X',
      operating_system: 'iOS, Android',
      application_category: 'BusinessApplication',
      download_url: 'https://apps.apple.com/app/id000000000',
      screenshot: 'https://example.org/screenshot.png',
      price: { value: 0, currency: 'RUB' },
      aggregate_rating: { rating_value: 4.7, review_count: 1234 },
    },
  };
  const mobileResult = buildGraph(mobileInput);
  const mobileGraph = mobileResult.graph['@graph'];
  const mobileNode = mobileGraph.find((n) => n['@type'] === 'MobileApplication');
  assert(mobileNode !== undefined, 'mobile_app/home граф содержит узел @type=MobileApplication');
  assert(mobileNode?.name === 'MyApp Mobile', 'MobileApplication.name проброшен корректно');
  assert(
    mobileNode?.operatingSystem === 'iOS, Android',
    'MobileApplication.operatingSystem проброшен',
  );
  assert(
    mobileNode?.applicationCategory === 'BusinessApplication',
    'MobileApplication.applicationCategory проброшен',
  );
  assert(
    mobileNode?.offers?.price === 0 && mobileNode?.offers?.priceCurrency === 'RUB',
    'MobileApplication.offers содержит price+currency',
  );
  assert(
    mobileNode?.aggregateRating?.ratingValue === 4.7,
    'MobileApplication.aggregateRating проброшен',
  );
  assert(
    mobileNode?.publisher && mobileNode.publisher['@id']?.includes('#organization'),
    'MobileApplication.publisher ссылается на Organization @id',
  );
  // recipe.nodes должен содержать mobileapp
  assert(
    mobileResult.recipe_nodes.includes('mobileapp'),
    'recipe_nodes для mobile_app/home содержит "mobileapp"',
  );

  // mobile_app/feature → тоже mobileapp в нодах
  const mobileFeatureResult = buildGraph({
    ...baseInput('mobile_app', 'feature'),
    mobileapp_ctx: { name: 'MyApp Mobile', operating_system: 'iOS' },
    breadcrumb_items: [
      { name: 'Главная', url: 'https://example.org/' },
      { name: 'Возможности', url: 'https://example.org/features' },
    ],
    service_ctx: { service_name: 'Push-уведомления' },
    faq_items: [
      { question: 'q1', answer: 'a1' },
      { question: 'q2', answer: 'a2' },
    ],
  });
  const mobileFeatureNode = mobileFeatureResult.graph['@graph'].find(
    (n) => n['@type'] === 'MobileApplication',
  );
  assert(
    mobileFeatureNode !== undefined,
    'mobile_app/feature граф содержит узел @type=MobileApplication',
  );

  // mobile_app/home без mobileapp_ctx → fallback с brand_name
  const mobileFallback = buildGraph(baseInput('mobile_app', 'home'));
  const fallbackNode = mobileFallback.graph['@graph'].find(
    (n) => n['@type'] === 'MobileApplication',
  );
  assert(fallbackNode !== undefined, 'mobile_app/home без ctx — fallback MobileApplication');
  assert(
    fallbackNode?.name === 'Тестовый бренд',
    'fallback MobileApplication.name = brand_name',
  );

  // ── nonprofit/home → NGO присутствует
  const ngoInput: GraphBuildInput = {
    ...baseInput('nonprofit', 'home'),
    ngo_ctx: {
      legal_name: 'Благотворительный фонд "Тест"',
      description: 'Помогаем людям',
      tax_id: '7700000000',
      nonprofit_status: 'NonprofitType:UnincorporatedNonprofit',
      founder: 'Иван Иванов',
      founding_date: '2010-01-01',
      funder: ['Фонд X', 'Фонд Y'],
      area_served: ['Москва', 'Санкт-Петербург'],
      knows_about: ['Образование', 'Медицина'],
    },
  };
  const ngoResult = buildGraph(ngoInput);
  const ngoGraph = ngoResult.graph['@graph'];
  const ngoNode = ngoGraph.find((n) => n['@type'] === 'NGO');
  assert(ngoNode !== undefined, 'nonprofit/home граф содержит узел @type=NGO');
  assert(
    ngoNode?.legalName === 'Благотворительный фонд "Тест"',
    'NGO.legalName проброшен',
  );
  assert(ngoNode?.description === 'Помогаем людям', 'NGO.description проброшен');
  assert(
    ngoNode?.nonprofitStatus === 'NonprofitType:UnincorporatedNonprofit',
    'NGO.nonprofitStatus проброшен',
  );
  assert(ngoNode?.founder?.name === 'Иван Иванов', 'NGO.founder проброшен');
  assert(ngoNode?.foundingDate === '2010-01-01', 'NGO.foundingDate проброшен');
  assert(
    Array.isArray(ngoNode?.funder) && ngoNode.funder.length === 2,
    'NGO.funder — массив организаций',
  );
  assert(
    Array.isArray(ngoNode?.areaServed) && ngoNode.areaServed.length === 2,
    'NGO.areaServed — массив AdministrativeArea',
  );
  assert(
    Array.isArray(ngoNode?.identifier) &&
      ngoNode.identifier.some((i: any) => i.name === 'taxID'),
    'NGO.identifier содержит taxID',
  );
  assert(ngoNode?.address?.streetAddress === 'ул. Пушкина, 1', 'NGO.address из schema_ctx');
  assert(ngoNode?.logo?.url === 'https://example.org/logo.png', 'NGO.logo из schema_ctx');
  assert(
    ngoResult.recipe_nodes.includes('ngo'),
    'recipe_nodes для nonprofit/home содержит "ngo"',
  );

  // nonprofit/about и /donate
  const ngoAbout = buildGraph(baseInput('nonprofit', 'about'));
  assert(
    ngoAbout.graph['@graph'].some((n) => n['@type'] === 'NGO'),
    'nonprofit/about — узел NGO присутствует',
  );
  const ngoDonate = buildGraph(baseInput('nonprofit', 'donate'));
  assert(
    ngoDonate.graph['@graph'].some((n) => n['@type'] === 'NGO'),
    'nonprofit/donate — узел NGO присутствует',
  );

  // ── validateGraph: оба графа должны проходить валидацию
  const mobileValidation = validateGraph(mobileResult.graph);
  assert(
    mobileValidation.is_valid,
    `validateGraph(mobile_app) is_valid (errors: ${JSON.stringify(
      mobileValidation.per_node.flatMap((n) => n.errors),
    )})`,
  );
  const ngoValidation = validateGraph(ngoResult.graph);
  assert(
    ngoValidation.is_valid,
    `validateGraph(nonprofit) is_valid (errors: ${JSON.stringify(
      ngoValidation.per_node.flatMap((n) => n.errors),
    )})`,
  );

  // ── regression: другие ниши не получают MobileApplication/NGO случайно
  const serviceGeo = buildGraph(baseInput('service_geo', 'home'));
  assert(
    !serviceGeo.graph['@graph'].some((n) => n['@type'] === 'MobileApplication'),
    'service_geo/home НЕ содержит MobileApplication (регресс)',
  );
  assert(
    !serviceGeo.graph['@graph'].some((n) => n['@type'] === 'NGO'),
    'service_geo/home НЕ содержит NGO (регресс)',
  );

  if (failed > 0) {
    // eslint-disable-next-line no-console
    console.error(`\n❌ PR-20: провалено ${failed} проверок`);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`\n✅ PR-20 регресс: все проверки прошли`);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ PR-20 тест упал с исключением:', err);
  process.exit(1);
});
