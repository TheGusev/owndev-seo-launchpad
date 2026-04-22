

## Цель

Починить два места в `owndev-backend/src/workers/SiteCheckWorker.ts` для upsert в `geo_rating`:

1. `category` — больше не хардкодить `'Сервисы'` в `INSERT VALUES`. Брать из `result.theme`, fallback `'Сервисы'`.
2. `has_faqpage` — определять по реальной разметке (`result.seo_data.hasFaq` / `schemaTypes`), а не через инверсию issue.

## Файл

`owndev-backend/src/workers/SiteCheckWorker.ts` — единственная правка. Контракт `PipelineResult` (`SiteCheckPipeline.ts`) уже отдаёт нужные поля — менять пайплайн не нужно.

## Контекст из пайплайна (без правок)

В `extractSeoData` (строки 1236–1260 `SiteCheckPipeline.ts`) уже считаются:
- `seo_data.schemaTypes: string[]` — список `@type` всех JSON-LD блоков (включая `@graph`)
- `seo_data.hasFaq: boolean` — true если среди типов встречается что-либо с `faq` (case-insensitive)
- `result.theme: string` — тема сайта из пайплайна

## Правки

### 1. Category — берём из `result.theme`

Перед `INSERT` (рядом со строкой 145, где собираются `topErrors`) добавить:

```ts
// TODO: маппить result.theme в фиксированные категории каталога (Сервисы / Магазин / Медиа / B2B...)
// Сейчас сохраняем тему как есть; если темы нет — fallback 'Сервисы'.
const category = (typeof result.theme === 'string' && result.theme.trim()) ? result.theme.trim().slice(0, 80) : 'Сервисы';
```

В `INSERT … VALUES` (строка 149) заменить `${'Сервисы'}` на `${category}`. `DO UPDATE SET` не трогаем (категория обновляется только при первом INSERT — поведение по ТЗ сохраняется, потому что в `EXCLUDED` её и так нет).

### 2. has_faqpage — прямая проверка HTML/schemas

Заменить строку 141:

```ts
const hasFaqIssue = (result.issues || []).some((i: any) => /faqpage/i.test(i.found || ''));
```

на:

```ts
// Прямая проверка реальной разметки: поле hasFaq и schemaTypes приходят из extractSeoData,
// который парсит все <script type="application/ld+json"> со страницы.
const schemaTypes: string[] = Array.isArray(result.seo_data?.schemaTypes) ? result.seo_data.schemaTypes : [];
const hasFaqInSchemas = schemaTypes.some((t) => typeof t === 'string' && /faqpage/i.test(t));
const hasFaqInHtml = /FAQPage/i.test(JSON.stringify(result.blocks || []));
const hasFaqPage = Boolean(result.seo_data?.hasFaq) || hasFaqInSchemas || hasFaqInHtml;
```

В `INSERT … VALUES` заменить аргумент `${!hasFaqIssue}` на `${hasFaqPage}` (строка 149, 9-й параметр).

## Что НЕ трогаем

- `DO UPDATE SET` — структура остаётся, поле `category` намеренно не апдейтится при rescan.
- Логика `has_llms_txt` и `has_schema` (определяются через issues) — вне ТЗ.
- `CREATE TABLE IF NOT EXISTS` (строка 117) — `category` остаётся с дефолтом `'Сервисы'` на уровне DDL.
- `SiteCheckPipeline.ts` и тип `PipelineResult` — поля уже есть.
- Любые другие места в воркере и проекте.

## Проверка

1. `cd owndev-backend && npx tsc --noEmit` — 0 ошибок (используем `any`-приведение через `result.seo_data?.…`, типы совместимы).
2. Скан сайта с темой "Магазин кондиционеров" → в БД `geo_rating.category = 'Магазин кондиционеров'` для нового домена; для уже существующего — категория не меняется (как было).
3. Скан сайта с реальным `<script type="application/ld+json">{"@type":"FAQPage", …}</script>` → `has_faqpage = true`, даже если по какой-то причине issue с `faqpage` оказался в списке.
4. Скан сайта без FAQPage и без `schemaTypes` с FAQ → `has_faqpage = false`.

