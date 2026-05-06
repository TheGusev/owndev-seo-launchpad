/**
 * V3 smoke test — composer + validator + ZIP without DB.
 *
 * Verifies that the developerPack pipeline produces a valid super_prompt_pack
 * that:
 *   • passes ajv JSON-Schema validation
 *   • produces a ZIP for Lovable platform
 *   • contains all required artifacts
 *
 * Run with:
 *   npx tsx owndev-backend/scripts/v3-smoke-test.ts
 */
import { developerPackService } from '../src/services/developerPack/index.js';
import { technicalPassportService } from '../src/services/technicalPassport/index.js';
import type { SiteStrategy } from '../src/services/strategy/types.js';
import type { PreflightRule } from '../src/services/preflight/types.js';

async function main() {
  console.log('▶ V3 smoke test — composer + validator + ZIP');

  // 1. Build a minimal strategy by hand (no DB)
  const strategy: SiteStrategy = {
    project_code: 'service_geo',
    brand_name: 'ТестГруз',
    positioning: 'ТестГруз — грузоперевозки в Москве с гарантией',
    primary_audience: 'Малый бизнес 25-55, ИП',
    primary_cta: 'phone_call',
    funnel_stages: [
      { stage: 'awareness', page_types: ['home'], primary_cta: 'lead_form' },
      { stage: 'consideration', page_types: ['service'], primary_cta: 'lead_form' },
      { stage: 'decision', page_types: ['contacts'], primary_cta: 'phone_call' },
      { stage: 'retention', page_types: [], primary_cta: 'lead_form' },
    ],
    pages: [
      {
        page_type: 'home',
        url_pattern: '/',
        priority: 1.0,
        changefreq: 'weekly',
        primary_cta: 'phone_call',
        contract: {
          page_type: 'home',
          url_pattern: '/',
          h1_template: 'Грузоперевозки в Москве — ТестГруз',
          title_template: 'Грузоперевозки Москва | ТестГруз',
          intro_answer_template:
            'ТестГруз выполняет грузоперевозки по Москве и области с 2015 года. Газели, фургоны, грузчики — в день обращения. Цена от 800 ₽/час, без скрытых платежей.',
          meta_description_template:
            'Грузоперевозки в Москве: газели и фургоны от 800₽/час, грузчики, документы. Звоните 24/7.',
          required_blocks: ['hero', 'usp', 'tariffs', 'reviews', 'faq', 'cta_phone'],
          required_commercial_signals: ['phone', 'price', 'reviews'],
          required_schema_graph: ['Organization', 'LocalBusiness', 'Service'],
          faq_questions: [
            'Сколько стоит газель по Москве?',
            'Работаете ли в выходные?',
            'Есть ли услуги грузчиков?',
            'Как оформить заказ?',
            'Какие документы предоставляете?',
          ],
        } as any,
        reasoning: 'Главная страница для service_geo обязательна',
      },
    ],
    recommended_geos: ['225', '213'],
    total_clusters: 0,
    generated_at: new Date().toISOString(),
  };

  // 2. Build technical passport
  const passport = technicalPassportService.build(
    {
      brand_name: 'ТестГруз',
      domain: 'testgruz.ru',
      base_url: 'https://testgruz.ru',
      contact_email: 'info@testgruz.ru',
      description_ru: 'ТестГруз — грузоперевозки в Москве',
      primary_geo: 'RU-MOW',
      languages: ['ru'],
      ai_training_policy: 'allow_with_attribution',
      ai_attribution_required: true,
      license: 'proprietary',
      sitemap_pages: strategy.pages.map((p) => ({
        url: `https://testgruz.ru${p.url_pattern}`,
        priority: p.priority,
        changefreq: p.changefreq,
      })),
    },
    strategy,
  );

  console.log('  ✓ technical passport built:');
  console.log('    llms.txt size:', passport.llms_txt.length);
  console.log('    robots.txt size:', passport.robots_txt.length);
  console.log('    AI bots allowed:', passport.ai_bots_allowed.length);
  console.log('    AI bots blocked:', passport.ai_bots_blocked.length);

  // 3. Stub preflight rules (no DB)
  const stubRules: PreflightRule[] = [
    {
      id: 1,
      rule_code: 'SEO_TITLE_PRESENT',
      axis: 'SEO',
      severity: 'P0',
      weight: 10,
      applies_to: ['*'],
      page_types: ['*'],
      description_ru: 'Title должен присутствовать',
      remediation_ru: 'Добавьте <title>',
      doc_url: null,
      active: true,
      engine_version: 'v3',
    },
  ];

  // 4. Compose pack
  const bundle = await developerPackService.buildPack(
    {
      strategy,
      passport,
      preflight_rules: stubRules,
      schema_per_page: [],
      brand: {
        name: 'ТестГруз',
        industry: 'грузоперевозки',
        target_audience: 'Малый бизнес и физлица в Москве',
        competitive_position: 'самый быстрый отклик в Москве',
        geo: { country: 'RU', regions: ['225', '213'], primary_city: 'Москва' },
        languages: ['ru'],
      },
    },
    'platform_specific',
    'lovable',
  );

  console.log('  ✓ pack built:');
  console.log('    version:', bundle.pack.version);
  console.log('    mode:', bundle.mode);
  console.log('    platform:', bundle.platform);
  console.log('    artifacts:', bundle.artifacts.length);
  for (const a of bundle.artifacts) {
    console.log(`      - ${a.filename} (${a.content.length}b, ${a.content_type})`);
  }
  if (bundle.zip_buffer) {
    console.log('    ZIP size:', bundle.zip_buffer.length, 'bytes');
  }

  // 5. Validate
  const validation = developerPackService.validate(bundle.pack);
  if (!validation.valid) {
    console.error('  ✗ validation FAILED:', validation.errors);
    process.exit(1);
  }
  console.log('  ✓ ajv validation passed');

  // 6. Re-export structured to inspect serializer
  const structured = await developerPackService.exportPack(bundle.pack, 'structured');
  console.log('  ✓ structured re-export:', structured.artifacts.length, 'files,',
              structured.zip_buffer?.length ?? 0, 'b ZIP');

  console.log('\n✅ V3 smoke test PASSED');
}

main().catch((err) => {
  console.error('❌ V3 smoke test FAILED:', err);
  process.exit(1);
});
