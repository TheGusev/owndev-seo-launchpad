# Module 9 — `super_prompt_pack` v1 — Спецификация

**JSON Schema:** `docs/super_prompt_pack.schema.json` (377 строк, draft-07)
**Сервис:** `owndev-backend/src/services/developerPack/`
**Engine:** v3

## 1. Что это

`super_prompt_pack` — структурированный артефакт, который OWNDEV отдаёт
разработчику или AI-платформе (Lovable / Cursor / v0 / Claude Code) для
немедленного создания сайта, гарантированно проходящего Preflight Gate V3
(Total ≥ 90).

Пакет содержит **всю** информацию для воспроизведения сайта:
- агентскую миссию и неизменяемые правила
- бизнес-контекст (бренд, аудитория, гео)
- роутинг и контракты страниц (H1/Title/intro/FAQ/blocks/commercial signals)
- SEO/GEO/Schema контракт (`llms.txt`, `robots.txt`, `sitemap.xml`,
  `.well-known/ai.txt`, JSON-LD `@graph` per-page, dataLayer)
- UI правила (компоненты, токены, accessibility)
- acceptance criteria (4 оси preflight + smoke checks)

## 2. Структура (top-level)

```jsonc
{
  "version": "1.0",                    // semver
  "engine_version": "v3",
  "generated_at": "2026-05-07T00:00:00.000Z",
  "export_mode": "structured | full | platform_specific",
  "platform_target": "lovable | cursor | v0 | claude_code | raw",

  "agent_role": { ... },               // §3
  "mission": { ... },                  // §4
  "non_negotiable_rules": [ ... ],     // §5
  "tech_stack": { ... },               // §6
  "business_context": { ... },         // §7
  "routes": [ ... ],                   // §8
  "page_contracts": [ ... ],           // §9
  "seo_geo_schema_contract": { ... },  // §10
  "ui_component_rules": { ... },       // §11
  "acceptance_criteria": { ... }       // §12
}
```

## 3. agent_role
Кто исполняет промпт. По умолчанию `senior_fullstack_engineer`.

## 4. mission
- `goal_ru` — что нужно сделать
- `success_metric` — как мерять успех (4 оси Preflight + Total ≥ 90)
- `out_of_scope` — что **не** делать

## 5. non_negotiable_rules
Жёсткие запреты/требования (immutable):
- `no Supabase`
- `no puppeteer / no headless Chrome` (cheerio + Jina only)
- `H1 ≤ 35, Title ≤ 60, intro 40-80 words, FAQ ≥ 5`
- `все комм-сигналы (phone, price, reviews) обязательны для коммерческих страниц`

## 6. tech_stack
По умолчанию: `Next.js 14 + Tailwind CSS + shadcn/ui + RSC + zustand`,
deployment `self-hosted PM2 + Nginx`. Можно override через `ComposeInput.tech`.

## 7. business_context
- `brand_name`, `industry`, `target_audience`, `competitive_position`
- `geo` — страна, регионы (Yandex region codes), primary_city
- `languages` — `['ru']` или `['ru','en']`

## 8. routes
Список URL-паттернов. Каждый: `path`, `page_type`, `priority`,
`changefreq`, `primary_cta`.

## 9. page_contracts
Один контракт на page_type:
```jsonc
{
  "page_type": "home",
  "h1_template": "...",
  "title_template": "...",
  "intro_answer_template": "40-80 слов прямого ответа",
  "meta_description_template": "...",
  "required_blocks": ["hero","usp","tariffs","reviews","faq","cta_phone"],
  "required_commercial_signals": ["phone","price","reviews"],
  "required_schema_types": ["Organization","LocalBusiness","Service"],
  "faq_questions": ["…", "…", "…", "…", "…"]
}
```

## 10. seo_geo_schema_contract
- `global_schemas` — Organization, WebSite, BreadcrumbList (общие для всех страниц)
- `page_schemas` — JSON-LD `@graph` per page_type (готов к вставке `<script type="application/ld+json">`)
- `llms_txt` — содержимое /llms.txt
- `robots_txt` — содержимое /robots.txt с 17 AI-ботами
- `sitemap_xml` — содержимое /sitemap.xml
- `well_known_ai` — JSON для /.well-known/ai.txt
- `data_layer_events` — карта GA4 events + Yandex goals

## 11. ui_component_rules
- `framework` (UI kit), `accessibility_level` (WCAG AA/AAA)
- `tokens` — design tokens (цвета, типографика, spacing)
- `components` — компоненты с required props (например `Hero` должен иметь `h1`, `intro_answer`, `primary_cta`)

## 12. acceptance_criteria
- `preflight` — 4 оси с порогами (SEO≥85, Direct≥90, Schema=100, AI/LLM≥85, Total≥90)
- `smoke_checks` — `Lighthouse mobile`, `<title>`, `<h1>`, `JSON-LD presence`, …
- `manual_qa` — список ручных проверок (например, «телефон в hero кликабелен»)

## 13. Режимы экспорта

| Режим | Артефакты |
|-------|-----------|
| `full` | один файл `super_prompt_pack.json` |
| `structured` (default) | JSON + per-section .md (`mission.md`, `routes.md`, `page_contracts/*.md`, `seo_geo_schema/*.md`, `acceptance.md`) + `public/llms.txt`, `public/robots.txt`, `public/sitemap.xml`, `public/.well-known/ai.txt` |
| `platform_specific` | сериалайзер платформы — см. §14 |

## 14. Платформенные сериалайзеры

### lovable.ts → `PROMPT.md`
Один markdown-файл, прямо вставляется в Lovable: миссия → правила →
acceptance → routes → page contracts → SEO/Schema контракт.
ZIP включает `public/llms.txt`, `public/robots.txt`, `public/sitemap.xml`,
`public/.well-known/ai.txt`, `routes.csv`, `super_prompt_pack.json`.

### cursor.ts → `.cursor/rules/*.mdc` + `TASKS.md`
- `.cursor/rules/00-mission.mdc`
- `.cursor/rules/10-non-negotiable.mdc`
- `.cursor/rules/20-page-contracts.mdc`
- `.cursor/rules/30-seo-schema.mdc`
- `TASKS.md` — пошаговый чек-лист

### v0.ts → `prompt.txt`
Plain text, заточен под v0.dev (без markdown headings, плотный).

### claude_code.ts → `CLAUDE.md` + `specs/*.md`
- `CLAUDE.md` — главный контекст (миссия, правила, tech_stack)
- `specs/page-contracts.md`, `specs/seo-schema.md`, `specs/acceptance.md`

### raw → fallback на `structured`

## 15. Валидация (ajv)

```ts
import { validatePack } from 'services/developerPack';
const r = validatePack(pack);
// { valid: boolean, errors: AjvError[] | null }
```

CommonJS interop fix:
```ts
const Ajv: any = (AjvModule as any).default ?? AjvModule;
const addFormats: any = (addFormatsModule as any).default ?? addFormatsModule;
```

`composer.assertValidPack` бросает исключение если пак невалиден —
`developerPackService.buildPack` валидирует автоматически перед сериализацией.

## 16. Хранение

Таблица `pack_artifacts` (миграция 034):
- `formula_job_id` (FK)
- `version`, `engine_version`, `generated_at`
- `mode`, `platform_target`
- `pack_json` (JSONB)
- `zip_size_bytes`, `zip_storage_key`

Таблица `pack_export_modes` — справочник режимов.

## 17. API

| Метод | URL | |
|-------|-----|---|
| POST  | `/api/v3/pipeline/run` | возвращает pack в результате |
| GET   | `/api/v3/pack/:job_id` | JSON |
| GET   | `/api/v3/pack/:job_id.zip` | ZIP-скачивание |
| POST  | `/api/v3/pack/export` | реэкспорт пака (другой mode/platform) |
| GET   | `/api/v3/pack/:job_id/validate` | ajv-проверка |

## 18. Smoke test

`scripts/v3-smoke-test.ts` — без БД проверяет full pipeline composer →
validator → ZIP. Должен закончиться `✅ V3 smoke test PASSED`.
