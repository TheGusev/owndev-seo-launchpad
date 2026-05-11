/**
 * Регресс-тест PR-19 «engine_modules whitelist гейтит стадии оркестратора».
 *
 * Цель: убедиться, что оркестратор пропускает стадии, отсутствующие в
 * engine_modules whitelist, и помечает их в decision_trace с причиной
 * 'engine_modules_disabled'. Существующие skip_* флаги остаются как user override.
 *
 * Тест НЕ ходит в БД и НЕ зависит от внешних сервисов: мы инжектируем
 * engine_modules напрямую через PipelineInput.engine_modules (override). Это
 * принимаемое тестами поле — оно перекрывает чтение из formula_project_types,
 * сохраняя поведение продакшена идентичным.
 *
 * Запуск: tsx src/services/pipeline/__tests__/pr19-engine-modules-whitelist.ts
 */

import { PipelineOrchestrator } from '../pipelineOrchestrator.js';
import type { PipelineInput } from '../types.js';

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

function makeInput(): PipelineInput {
  return {
    job_id: `pr19_test_${Date.now()}`,
    project_code: 'service_geo',
    // Без root_url — crawl/audit/preflight естественно ничего не сделают,
    // и стадии demand/pack тоже не должны фактически работать (нет seeds).
    // Нам нужно только увидеть decision_trace.
    brand: {
      name: 'Test Brand',
      industry: 'service',
      target_audience: 'b2c',
    },
    // Whitelist разрешает только preflight и demand.
    // Стадии intake/crawl/audit/pack должны быть skipped с причиной 'engine_modules_disabled'.
    engine_modules: ['preflight', 'demand'],
    // Чтобы стадия demand не уходила в Wordstat — пропустим её через user-skip.
    skip_demand: true,
    skip_crawl: true,
  };
}

async function run() {
  // eslint-disable-next-line no-console
  console.log('\n📋 PR-19 engine_modules whitelist гейтинг стадий');

  const orchestrator = new PipelineOrchestrator();
  const result = await orchestrator.run(makeInput());

  assert(Array.isArray(result.decision_trace), 'decision_trace присутствует в результате');
  const trace = result.decision_trace ?? [];

  const findStage = (stage: string) => trace.find((t) => t.stage === stage);

  // ── intake: не в whitelist → engine_modules_disabled
  const intake = findStage('intake');
  assert(intake?.status === 'skipped', 'intake — skipped (нет в whitelist)');
  assert(
    intake?.reason === 'engine_modules_disabled',
    `intake.reason === 'engine_modules_disabled' (получено: ${intake?.reason})`,
  );

  // ── crawl: не в whitelist → engine_modules_disabled (а не user_skip_flag,
  // потому что whitelist срабатывает раньше)
  const crawl = findStage('crawl');
  assert(crawl?.status === 'skipped', 'crawl — skipped');
  assert(
    crawl?.reason === 'engine_modules_disabled',
    `crawl.reason === 'engine_modules_disabled' (получено: ${crawl?.reason})`,
  );

  // ── audit: не в whitelist → engine_modules_disabled
  const audit = findStage('audit');
  assert(audit?.status === 'skipped', 'audit — skipped');
  assert(
    audit?.reason === 'engine_modules_disabled',
    `audit.reason === 'engine_modules_disabled' (получено: ${audit?.reason})`,
  );

  // ── pack: не в whitelist (developerPack отсутствует) → engine_modules_disabled
  const pack = findStage('pack');
  assert(pack?.status === 'skipped', 'pack — skipped');
  assert(
    pack?.reason === 'engine_modules_disabled',
    `pack.reason === 'engine_modules_disabled' (получено: ${pack?.reason})`,
  );

  // ── demand: разрешена whitelist'ом, но юзер выставил skip_demand=true
  // → должен быть user_skip_flag (whitelist пропускает, юзер блокирует)
  const demand = findStage('demand');
  assert(demand?.status === 'skipped', 'demand — skipped (user override)');
  assert(
    demand?.reason === 'user_skip_flag',
    `demand.reason === 'user_skip_flag' (whitelist разрешает, но skip_demand=true) (получено: ${demand?.reason})`,
  );

  // ── preflight: разрешена whitelist'ом, юзер не запретил → enabled
  const preflight = findStage('preflight');
  assert(preflight?.status === 'enabled', 'preflight — enabled (в whitelist)');
  assert(preflight?.reason === undefined, 'preflight без reason');

  // ── Стадии, помеченные engine_modules_disabled, НЕ должны попасть в stages[]
  // (timeStage запись не создаёт, потому что стадия пропущена).
  const intakeRan = result.stages.some((s) => s.stage === 'intake');
  assert(!intakeRan, 'intake не выполнялась (нет записи в stages[])');
  const packRan = result.stages.some((s) => s.stage === 'pack');
  assert(!packRan, 'pack не выполнялась (нет записи в stages[])');

  if (failed > 0) {
    // eslint-disable-next-line no-console
    console.error(`\n❌ PR-19: провалено ${failed} проверок`);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`\n✅ PR-19 регресс: все проверки прошли`);
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ PR-19 тест упал с исключением:', err);
  process.exit(1);
});
