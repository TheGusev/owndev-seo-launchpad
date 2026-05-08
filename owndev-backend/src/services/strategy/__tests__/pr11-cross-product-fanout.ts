/**
 * Регресс-тест PR-11 «Cross-product fan-out: направление × город».
 *
 * Проверяет, что для multi-direction × multi-city проектов формула
 * генерирует корректную матрицу посадок (без взрыва, без потерь).
 *
 * Сценарии:
 *   1. Главный кейс: service_pest_control, 5 городов × 4 направления → 20 страниц.
 *   2. Лимит: 10 городов × 12 направлений = 120, но fanout_max_pages=50 → ровно 50.
 *   3. Disable: disable_cross_product=true → fan-out по одной оси (только города).
 *   4. Slug формата /[direction]/[city]/ — оба компонента в URL, кириллицы нет.
 *   5. Покрытие главного города: при обрезании по лимиту все направления первого
 *      города должны присутствовать (порядок for city → for dir).
 *   6. Приоритеты убывают от 0.85 → 0.55 (защита от равных весов).
 *
 * Запуск: tsx src/services/strategy/__tests__/pr11-cross-product-fanout.ts
 */

import { applyPageFanout } from '../pageFanout.js';
import type { SitePage } from '../types.js';

interface Finding {
  scenario: string;
  level: 'critical' | 'warning';
  message: string;
}

const findings: Finding[] = [];
function critical(scenario: string, message: string) {
  findings.push({ scenario, level: 'critical', message });
}
function warning(scenario: string, message: string) {
  findings.push({ scenario, level: 'warning', message });
}

// Базовая GEO-страница (тип service_geo — попадает в GEO_PAGE_TYPES).
function makeGeoBase(): SitePage {
  return {
    page_id: 'geo-1',
    page_type: 'service-geo',
    url_pattern: '/services/{geo}/',
    title: 'Услуги',
    priority: 0.8,
    reasoning: 'Базовая гео-страница услуг',
    contract: {
      page_id: 'geo-1',
      page_type: 'service-geo',
      url_pattern: '/services/{geo}/',
      h1_template: 'Услуги в {city}',
      title_template: 'Услуги {service} в {city}',
      meta_description_template: 'Профессиональные услуги {service} в городе {city}.',
      intro_answer_template: 'Мы выполняем {service} в городе {city}.',
      faq_questions: ['Сколько стоит {service} в {city}?'],
    } as unknown as SitePage['contract'],
  } as unknown as SitePage;
}

// ─── Сценарий 1: 5 городов × 4 направления ──────────────────
{
  const cities = [
    { slug: 'moskva', label: 'Москва' },
    { slug: 'sankt-peterburg', label: 'Санкт-Петербург' },
    { slug: 'khimki', label: 'Химки' },
    { slug: 'kazan', label: 'Казань' },
    { slug: 'novosibirsk', label: 'Новосибирск' },
  ];
  const dirs = [
    { slug: 'dezinfekciya', label: 'Дезинфекция' },
    { slug: 'fumigatsiya', label: 'Фумигация' },
    { slug: 'uborka-posle-pozhara', label: 'Уборка после пожара' },
    { slug: 'uborka-posle-trupov', label: 'Уборка после трупов' },
  ];
  const result = applyPageFanout([makeGeoBase()], {
    cities,
    service_directions: dirs,
  });
  if (result.length !== 20) {
    critical('5×4=20', `получено ${result.length} страниц вместо 20`);
  }
  // Уникальность url_pattern.
  const urls = new Set(result.map((p) => p.url_pattern));
  if (urls.size !== result.length) {
    critical('5×4=20', `дубликаты URL: ${urls.size} уникальных из ${result.length}`);
  }
  // Каждая страница имеет оба slug в URL.
  for (const p of result) {
    const hasCity = cities.some((c) => p.url_pattern.includes(c.slug));
    const hasDir = dirs.some((d) => p.url_pattern.includes(d.slug));
    if (!hasCity || !hasDir) {
      critical('5×4=20', `URL без city/direction: ${p.url_pattern}`);
      break;
    }
  }
  // Кириллицы нет.
  for (const p of result) {
    if (/[а-яё]/i.test(p.url_pattern)) {
      critical('5×4=20', `кириллица в URL: ${p.url_pattern}`);
      break;
    }
  }
}

// ─── Сценарий 2: лимит 50 (10×12=120) ──────────────────────
{
  const cities = Array.from({ length: 10 }, (_, i) => ({
    slug: `city-${i + 1}`,
    label: `Город ${i + 1}`,
  }));
  const dirs = Array.from({ length: 12 }, (_, i) => ({
    slug: `dir-${i + 1}`,
    label: `Направление ${i + 1}`,
  }));
  const result = applyPageFanout([makeGeoBase()], {
    cities,
    service_directions: dirs,
    fanout_max_pages: 50,
  });
  if (result.length !== 50) {
    critical('10×12 lim=50', `получено ${result.length} вместо 50`);
  }
  // Главный город (city-1) должен иметь все 12 направлений.
  const firstCityPages = result.filter((p) => p.url_pattern.includes('city-1'));
  if (firstCityPages.length < 12) {
    critical(
      '10×12 lim=50',
      `главный город получил ${firstCityPages.length} направлений, должен 12 (порядок for city → for dir)`,
    );
  }
}

// ─── Сценарий 3: disable_cross_product ─────────────────────
{
  const cities = [
    { slug: 'moskva', label: 'Москва' },
    { slug: 'spb', label: 'СПб' },
    { slug: 'khimki', label: 'Химки' },
  ];
  const dirs = [
    { slug: 'a', label: 'A' },
    { slug: 'b', label: 'B' },
  ];
  const result = applyPageFanout([makeGeoBase()], {
    cities,
    service_directions: dirs,
    disable_cross_product: true,
  });
  // С отключённым cross-product GEO-страница разворачивается только по городам = 3.
  if (result.length !== 3) {
    critical('disable_cross', `при disable_cross_product=true получено ${result.length} вместо 3 (по городам)`);
  }
}

// ─── Сценарий 4: приоритеты убывают ─────────────────────────
{
  const cities = [
    { slug: 'a', label: 'A' },
    { slug: 'b', label: 'B' },
    { slug: 'c', label: 'C' },
  ];
  const dirs = [
    { slug: 'x', label: 'X' },
    { slug: 'y', label: 'Y' },
  ];
  const result = applyPageFanout([makeGeoBase()], {
    cities,
    service_directions: dirs,
  });
  if (result.length !== 6) {
    critical('priority', `получено ${result.length} вместо 6`);
  }
  const first = result[0].priority ?? 0;
  const last = result[result.length - 1].priority ?? 0;
  if (!(first > last)) {
    critical('priority', `priority не убывает: first=${first}, last=${last}`);
  }
  if (first > 0.86 || first < 0.84) {
    warning('priority', `первый priority=${first}, ожидался ~0.85`);
  }
  if (last > 0.56 || last < 0.54) {
    warning('priority', `последний priority=${last}, ожидался ~0.55`);
  }
}

// ─── Сценарий 5: единственный город или направление → нет cross ─
{
  const result = applyPageFanout([makeGeoBase()], {
    cities: [{ slug: 'moskva', label: 'Москва' }],
    service_directions: [
      { slug: 'a', label: 'A' },
      { slug: 'b', label: 'B' },
    ],
  });
  // 1 город × 2 направления → cross не активируется (нужно ≥2 каждый).
  // GEO без cross + 1 город → возвращаем как есть (1 страница).
  if (result.length !== 1) {
    warning(
      '1×2',
      `1 город × 2 направления вернуло ${result.length} страниц (ожидалось 1, cross требует ≥2 каждый)`,
    );
  }
}

// ─── Итоги ──────────────────────────────────────────────────
const criticals = findings.filter((f) => f.level === 'critical');
const warnings = findings.filter((f) => f.level === 'warning');

// eslint-disable-next-line no-console
console.log(`\n📋 PR-11 cross-product fan-out: 5 сценариев`);
// eslint-disable-next-line no-console
console.log(`   критичных: ${criticals.length}`);
// eslint-disable-next-line no-console
console.log(`   предупреждений: ${warnings.length}`);

if (warnings.length > 0) {
  // eslint-disable-next-line no-console
  console.log('\n⚠️  Предупреждения (не блокируют):');
  for (const f of warnings) {
    // eslint-disable-next-line no-console
    console.log(`   - [${f.scenario}] ${f.message}`);
  }
}

if (criticals.length > 0) {
  // eslint-disable-next-line no-console
  console.error('\n❌ Критичные ляпы (блокируют PR-11):');
  for (const f of criticals) {
    // eslint-disable-next-line no-console
    console.error(`   - [${f.scenario}] ${f.message}`);
  }
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\n✅ PR-11 регресс: cross-product fan-out работает корректно (5 сценариев)`);
