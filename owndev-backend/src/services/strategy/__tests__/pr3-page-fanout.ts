/**
 * Регресс-тест PR-3 «Развёртывание страниц».
 *
 * Что проверяем:
 *   1. Без cities/directions/clusters → applyPageFanout — это no-op (legacy).
 *   2. С 5 городами и page_type='service-geo' → 5 экземпляров с разными URL.
 *   3. С 3 направлениями и page_type='category' → 3 экземпляра.
 *   4. SEO-priority экземпляров убывает: первые города выше.
 *   5. URL-плейсхолдеры {geo}/{slug} конкретизируются (не остаются {...}).
 *   6. Hub-страницы создаются из топ-кластеров Wordstat (если enable_hub_pages !== false).
 *   7. Дубликаты URL дедупаются.
 *   8. page_instance_kind проставляется корректно.
 *   9. enable_hub_pages=false → hub-страницы не создаются.
 *
 * Запуск: npm run test:pr3-page-fanout
 *
 * Тесты не ходят в БД, не вызывают runEngine.
 */

import { applyPageFanout } from '../pageFanout.js';
import type { SitePage } from '../types.js';
import type { DemandClusterV3 } from '../../demand/types.js';

const failures: string[] = [];
function assert(cond: boolean, msg: string) {
  if (!cond) failures.push(msg);
}
function expectEq<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) failures.push(`${label}: ожидалось ${String(expected)}, получено ${String(actual)}`);
}

function makePage(page_type: string, url: string): SitePage {
  return {
    page_type,
    url_pattern: url,
    priority: 0.85,
    changefreq: 'monthly',
    primary_cta: 'phone_call',
    contract: {
      page_type,
      url_pattern: url,
      h1_template: `${page_type} в {city}`,
      title_template: `${page_type} {service} — заказать в {city}`,
      meta_description_template: `Заказать ${page_type} в {city}.`,
      intro_answer_template: `Описание ${page_type} в городе {city}.`,
      faq_questions: [`Сколько стоит ${page_type} в {city}?`],
      required_blocks: [],
      required_commercial_signals: [],
      required_schema_graph: [],
      notes_ru: null,
    },
    reasoning: 'тест',
  };
}

const moscow = { slug: 'moskva', label: 'Москва' };
const spb = { slug: 'spb', label: 'Санкт-Петербург' };
const ekb = { slug: 'ekb', label: 'Екатеринбург' };
const kzn = { slug: 'kzn', label: 'Казань' };
const nsk = { slug: 'nsk', label: 'Новосибирск' };
const FIVE_CITIES = [moscow, spb, ekb, kzn, nsk];

// ────────── 1. Legacy: пустой контекст ──────────
{
  const base = [makePage('service-geo', '/services/{geo}/{slug}'), makePage('home', '/')];
  const out = applyPageFanout(base, {});
  expectEq(out.length, 2, 'Legacy: 2 страницы остаются 2');
  expectEq(out[0].page_instance_key, undefined, 'Legacy: page_instance_key не проставлен');
}

// ────────── 2. service-geo × 5 городов ──────────
{
  const base = [makePage('service-geo', '/services/{geo}/{slug}')];
  const out = applyPageFanout(base, { cities: FIVE_CITIES, enable_hub_pages: false });
  expectEq(out.length, 5, '5 городов: 5 экземпляров');
  // URL должны различаться.
  const urls = new Set(out.map((p) => p.url_pattern));
  expectEq(urls.size, 5, '5 городов: 5 уникальных URL');
  // Все экземпляры должны иметь kind=city.
  const allCity = out.every((p) => p.page_instance_kind === 'city');
  assert(allCity, '5 городов: все экземпляры с kind=city');
  // Не должно остаться плейсхолдеров {city}/{geo} в URL.
  const hasPlaceholders = out.some((p) => /\{[^}]+\}/.test(p.url_pattern));
  assert(!hasPlaceholders, '5 городов: плейсхолдеры конкретизированы');
  // Priority убывает.
  assert(out[0].priority >= out[4].priority, 'Priority убывает: 1-й город ≥ 5-го');
  // page_instance_label заполнен названием города.
  expectEq(out[0].page_instance_label, 'Москва', 'Первый экземпляр = Москва');
}

// ────────── 3. category × 3 направления ──────────
{
  const base = [makePage('category', '/category/{slug}')];
  const dirs = [
    { slug: 'remont', label: 'Ремонт' },
    { slug: 'ustanovka', label: 'Установка' },
    { slug: 'diagnostika', label: 'Диагностика' },
  ];
  const out = applyPageFanout(base, { service_directions: dirs, enable_hub_pages: false });
  expectEq(out.length, 3, '3 направления: 3 экземпляра');
  const allCatDir = out.every((p) => p.page_instance_kind === 'category_direction');
  assert(allCatDir, '3 направления: kind=category_direction для category');
}

// ────────── 4. dedup: одинаковые URL не дублируются ──────────
{
  const base = [
    makePage('home', '/'),
    makePage('home', '/'), // дубль
  ];
  const out = applyPageFanout(base, {});
  expectEq(out.length, 1, 'Dedup: дубли URL отсеиваются');
}

// ────────── 5. Hub-страницы из кластеров ──────────
{
  const base = [makePage('home', '/')];
  const clusters: DemandClusterV3[] = [
    { session_id: 's1', cluster_label: 'Подбор по бюджету', intent: 'commercial',
      seed_keyword: 'подбор', region_code: 'ru', total_frequency: 5000,
      keywords: [], recommended_page_type: 'category', recommended_url_pattern: '/podbor' },
    { session_id: 's1', cluster_label: 'Сравнение моделей', intent: 'commercial',
      seed_keyword: 'сравнение', region_code: 'ru', total_frequency: 3000,
      keywords: [], recommended_page_type: 'category', recommended_url_pattern: '/sravnenie' },
    { session_id: 's1', cluster_label: 'Гарантия и сервис', intent: 'informational',
      seed_keyword: 'гарантия', region_code: 'ru', total_frequency: 1500,
      keywords: [], recommended_page_type: 'article', recommended_url_pattern: '/garantiya' },
    { session_id: 's1', cluster_label: 'Низкочастотный кластер', intent: 'informational',
      seed_keyword: 'низкочастотный', region_code: 'ru', total_frequency: 100,
      keywords: [], recommended_page_type: 'article', recommended_url_pattern: '/nizkochastotny' },
  ];
  const out = applyPageFanout(base, { clusters });
  // home + 3 hub.
  expectEq(out.length, 4, 'Hub: 1 base + 3 топ-кластера = 4');
  const hubs = out.filter((p) => p.page_instance_kind === 'hub');
  expectEq(hubs.length, 3, 'Hub: ровно 3 hub-страницы');
  // Сортировка: первый hub — самый частотный (Подбор по бюджету).
  expectEq(hubs[0].page_instance_label, 'Подбор по бюджету', 'Первый hub = самый частотный кластер');
}

// ────────── 6. enable_hub_pages=false ──────────
{
  const base = [makePage('home', '/')];
  const clusters: DemandClusterV3[] = [
    { session_id: 's1', cluster_label: 'X', intent: 'commercial',
      seed_keyword: 'x', region_code: 'ru', total_frequency: 10000,
      keywords: [], recommended_page_type: 'category', recommended_url_pattern: '/x' },
  ];
  const out = applyPageFanout(base, { clusters, enable_hub_pages: false });
  expectEq(out.length, 1, 'enable_hub_pages=false: hub не создаются');
}

// ────────── 7. service-geo × 5 городов + 3 направления ──────────
// PR-11: бывшее поведение «одна ось» было дефектом. Теперь идёт cross-product
// с лимитом (по умолчанию 50). 5 городов × 3 направления = 15 посадок.
// Отключить можно флагом disable_cross_product=true.
{
  const base = [makePage('service-geo', '/services/{geo}/{slug}')];
  const out = applyPageFanout(base, {
    cities: FIVE_CITIES,
    service_directions: [
      { slug: 'a', label: 'A' },
      { slug: 'b', label: 'B' },
      { slug: 'c', label: 'C' },
    ],
    enable_hub_pages: false,
  });
  expectEq(out.length, 15, 'service-geo: PR-11 cross-product 5 городов × 3 направления → 15 посадок');

  // Проверяем, что флаг disable_cross_product=true откатывает старое поведение (только города).
  const outLegacy = applyPageFanout(base, {
    cities: FIVE_CITIES,
    service_directions: [
      { slug: 'a', label: 'A' },
      { slug: 'b', label: 'B' },
      { slug: 'c', label: 'C' },
    ],
    enable_hub_pages: false,
    disable_cross_product: true,
  });
  expectEq(outLegacy.length, 5, 'PR-11: disable_cross_product=true → только 5 городов');
}

// ────────── 8. Один город — fan-out не происходит ──────────
{
  const base = [makePage('service-geo', '/services/{geo}/{slug}')];
  const out = applyPageFanout(base, { cities: [moscow], enable_hub_pages: false });
  expectEq(out.length, 1, 'Один город: fan-out не делается');
  // URL остаётся как есть (плейсхолдеры не заменяются — это шаблон, не экземпляр).
  expectEq(out[0].page_instance_kind, undefined, 'Один город: kind не проставлен');
}

// ────────── Финал ──────────
if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error('\n❌ PR-3 регресс НЕ пройден:\n  - ' + failures.join('\n  - '));
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log('✅ PR-3 регресс: все проверки прошли');
