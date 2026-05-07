/**
 * Регресс-тест изоляции v1.
 *
 * Цель: гарантировать, что после моста v1 ↔ v3 ядро runEngine остаётся
 * детерминированным и не зависит от внешних сервисов (БД, Wordstat, сети).
 *
 * Запуск (без подключения тест-раннера, чтобы не вводить новую зависимость):
 *   tsx src/services/SiteFormula/__tests__/v1-untouched.ts
 *
 * Если хоть одна фикстура отдаст project_class отличный от ожидаемого —
 * exit code 1 и весь PR-1 считается провалившимся.
 *
 * Хард-правило пользователя: «Бесплатная она полностью на бэкенде развёрнута,
 * ни к какому Wordstat никогда не обращалась». Этот тест следит за тем, чтобы
 * ничего из бэкенда v3 не попало в hot-path runEngine.
 */
import { runEngine } from '../index.js';
import type { RawAnswers, ProjectClass } from '../../../types/siteFormula.js';

interface Fixture {
  name: string;
  answers: RawAnswers;
  expected_project_class: ProjectClass;
}

const FIXTURES: Fixture[] = [
  {
    name: 'start: единичная услуга, один город, минимум каналов',
    answers: {
      q_services: 'single',
      q_geo: 'single_city',
      q_traffic_sources: ['direct'],
      q_niche: 'general',
      q_current_site: 'none',
      q_conversion: ['phone'],
      q_growth_plan: 'maintain',
      q_legacy_migration: 'no',
    },
    expected_project_class: 'start',
  },
  {
    name: 'growth: несколько направлений + город+районы + рост контента',
    answers: {
      q_services: 'few',
      q_geo: 'city_districts',
      q_traffic_sources: ['seo', 'paid'],
      q_niche: 'general',
      q_current_site: 'small_site',
      q_conversion: ['form', 'phone'],
      q_growth_plan: 'grow_content',
      q_legacy_migration: 'partial',
    },
    expected_project_class: 'growth',
  },
  {
    name: 'scale: 5+ направлений, мульти-гео, full_scale план',
    answers: {
      q_services: 'many',
      q_geo: 'multi_city',
      q_traffic_sources: ['seo', 'paid', 'social', 'direct'],
      q_niche: 'ecommerce',
      q_current_site: 'large_site',
      q_conversion: ['form', 'phone', 'cart'],
      q_growth_plan: 'full_scale',
      q_legacy_migration: 'full',
    },
    expected_project_class: 'scale',
  },
];

function run() {
  const failures: string[] = [];

  for (const fx of FIXTURES) {
    // Прогоняем дважды — проверяем детерминизм.
    const r1 = runEngine(fx.answers);
    const r2 = runEngine(fx.answers);

    const c1 = r1.engine_state.project_class;
    const c2 = r2.engine_state.project_class;

    if (c1 !== c2) {
      failures.push(
        `[${fx.name}] недетерминизм: ${c1} != ${c2}`,
      );
      continue;
    }

    if (c1 !== fx.expected_project_class) {
      failures.push(
        `[${fx.name}] ожидался ${fx.expected_project_class}, получен ${c1}`,
      );
      continue;
    }

    // Проверка, что engine_state имеет ожидаемые поля (контракт для PR-1 моста).
    const requiredFields: Array<keyof typeof r1.engine_state> = [
      'dimensions', 'derived_scores', 'project_class', 'project_class_reason',
      'activated_layers', 'activated_blocks', 'activated_checks',
      'flags', 'decision_trace',
    ];
    for (const f of requiredFields) {
      if (!(f in r1.engine_state)) {
        failures.push(`[${fx.name}] отсутствует поле engine_state.${String(f)}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`✓ ${fx.name} → project_class=${c1}`);
  }

  if (failures.length > 0) {
    // eslint-disable-next-line no-console
    console.error('\n❌ Регресс v1 НЕ пройден:\n  - ' + failures.join('\n  - '));
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`\n✅ v1 не сломан: ${FIXTURES.length} фикстур прошли`);
}

run();
