/**
 * Регресс-тест PR-22 «5 page_contracts для 4 ниш».
 *
 * Цель: гарантировать, что миграция 043 добирает page_contracts до 5 страниц
 * на версии '3.0.0' для nonprofit, promo_event, personal_brand, b2b_media.
 * Закрывает H10 ASI-вердикта PR-14 («глубина роли страниц»).
 *
 * Подход: статически парсим все *.sql из owndev-backend/src/db/migrations,
 * считаем уникальные (project_type_code, page_type) с version='3.0.0' и
 * проверяем, что для каждой из 4 ниш получается ровно 5 page_type.
 * Это работает офлайн (без БД) и зеркалит поведение
 * pageContracts/repository.ts (фильтр version='3.0.0').
 *
 * Запуск: tsx src/services/pageContracts/__tests__/pr22-page-contracts-count.ts
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '../../../db/migrations');

const TARGET_NICHES = ['nonprofit', 'promo_event', 'personal_brand', 'b2b_media'] as const;
const EXPECTED_PER_NICHE = 5;

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

/**
 * Парсит .sql и извлекает все строки вида
 *   ('project_type_code','page_type','3.0.0', ...
 * с допуском к пробелам/переносам.
 */
function extractContracts(sql: string): Array<{ code: string; pageType: string }> {
  const re = /\(\s*'([a-z0-9_]+)'\s*,\s*'([a-z0-9_]+)'\s*,\s*'3\.0\.0'/gi;
  const out: Array<{ code: string; pageType: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    out.push({ code: m[1], pageType: m[2] });
  }
  return out;
}

function run() {
  // eslint-disable-next-line no-console
  console.log('\n📋 PR-22 page_contracts count (5 страниц для 4 ниш)\n');

  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  assert(files.length > 0, `migrations dir не пустой (${MIGRATIONS_DIR})`);

  // file 043 должен существовать
  const has043 = files.some((f) => f.startsWith('043_'));
  assert(has043, 'миграция 043_* присутствует в db/migrations');

  // Собираем уникальные (code, page_type) по всем миграциям на версии 3.0.0
  const byCode = new Map<string, Set<string>>();
  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    for (const { code, pageType } of extractContracts(sql)) {
      if (!byCode.has(code)) byCode.set(code, new Set());
      byCode.get(code)!.add(pageType);
    }
  }

  // Проверяем каждую из 4 целевых ниш
  for (const niche of TARGET_NICHES) {
    const pages = byCode.get(niche) ?? new Set<string>();
    const pageList = Array.from(pages).sort().join(', ');
    assert(
      pages.size === EXPECTED_PER_NICHE,
      `${niche}: ${pages.size}/${EXPECTED_PER_NICHE} страниц на v3.0.0 [${pageList}]`,
    );
  }

  // Проверяем, что 043 добавляет именно ожидаемые page_type
  const sql043 = readFileSync(
    join(MIGRATIONS_DIR, files.find((f) => f.startsWith('043_'))!),
    'utf-8',
  );
  const added = extractContracts(sql043);
  const addedByCode = new Map<string, Set<string>>();
  for (const { code, pageType } of added) {
    if (!addedByCode.has(code)) addedByCode.set(code, new Set());
    addedByCode.get(code)!.add(pageType);
  }

  const EXPECTED_NEW: Record<string, string[]> = {
    nonprofit: ['about', 'donate', 'programs', 'report'],
    promo_event: ['agenda', 'speakers', 'tickets', 'venue'],
    personal_brand: ['about', 'services', 'contact'],
    b2b_media: ['category', 'author', 'newsletter'],
  };

  for (const [code, expected] of Object.entries(EXPECTED_NEW)) {
    const actual = addedByCode.get(code) ?? new Set<string>();
    for (const pt of expected) {
      assert(actual.has(pt), `043 содержит ${code}/${pt}`);
    }
  }

  // ON CONFLICT DO NOTHING — миграция идемпотентна
  assert(
    /ON CONFLICT\s*\(\s*project_type_code\s*,\s*page_type\s*,\s*version\s*\)\s*DO NOTHING/i.test(sql043),
    '043 использует ON CONFLICT (project_type_code, page_type, version) DO NOTHING',
  );

  // eslint-disable-next-line no-console
  console.log(`\n${failed === 0 ? '✅ PR-22: все проверки пройдены' : `❌ PR-22: ${failed} провал(ов)`}\n`);
  if (failed > 0) process.exit(1);
}

run();
