

## Цель

Дожать GEO-аудит до реальной точности ~99% **без LLM-блока** (Perplexity отложен). Фокус на детерминированных сигналах: валидация ключей через Google Suggest, история сканов с графиком, сбор signals для будущей калибровки. LLM-judge оставляем как есть (`simulated: true` уже честно помечен).

## Что делаем (3 этапа вместо 4)

### Этап 1. Валидация ключевых слов через Google Suggest

**Файл:** `owndev-backend/src/services/SiteCheckPipeline.ts`

Добавить функцию-валидатор:
```ts
async function validateKeywordsViaSuggest(
  keywords: string[]
): Promise<Array<{ keyword: string; verified: boolean; suggestions: string[] }>> {
  const out = [];
  for (const kw of keywords.slice(0, 20)) {
    try {
      const r = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(kw)}&hl=ru`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!r.ok) { out.push({ keyword: kw, verified: false, suggestions: [] }); continue; }
      const data = await r.json();
      const suggestions = Array.isArray(data?.[1]) ? data[1].slice(0, 3) : [];
      out.push({ keyword: kw, verified: suggestions.length > 0, suggestions });
    } catch {
      out.push({ keyword: kw, verified: false, suggestions: [] });
    }
    await new Promise(r => setTimeout(r, 100));
  }
  return out;
}
```

После генерации `result.keywords` LLM'ом — прогнать через валидатор, обогатить каждый ключ полями `verified: boolean` и `suggestions: string[]`. Старая структура (массив строк) превращается в массив объектов — нужна миграция формата в `result.keywords`.

**Фронт:** `src/components/site-check/KeywordsSection.tsx`
- Поддержать оба формата (string или {keyword, verified, suggestions}) для обратной совместимости со старыми скан-результатами.
- Зелёная галка ✓ если `verified: true`, серый ⚠ если `false`.
- В expandable показать `suggestions` как «реальные варианты от Google».

**Лимит:** 20 ключей × 100ms задержки = ~2.5 сек на скан. Приемлемо.

### Этап 2. История сканов и график динамики

**Бэкенд:** новый эндпоинт в `owndev-backend/src/api/routes/siteCheck.ts`:
```ts
app.get('/history/:domain', async (req, reply) => {
  const { domain } = req.params as { domain: string };
  const limit = Math.min(50, Number((req.query as any).limit) || 20);
  const rows = await sql`
    SELECT id, created_at, theme,
           scores->>'total' as total,
           scores->>'seo' as seo,
           scores->>'ai' as ai,
           scores->>'schema' as schema_score,
           scores->>'direct' as direct
    FROM site_check_scans
    WHERE url ILIKE ${'%' + domain + '%'}
      AND status = 'done'
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return reply.send({ success: true, domain, history: rows.reverse() });
});
```

**API клиент:** `src/lib/api/scan.ts` — добавить `getDomainHistory(domain: string, limit?: number)`.

**Фронт:** новый компонент `src/components/site-check/HistoryChart.tsx` на Recharts (уже в проекте):
- LineChart с 5 линиями: Total / SEO / AI / Schema / Direct.
- Подключается в `SiteCheckResult.tsx` под `ScoreCards`.
- Если `history.length < 2` → плашка «Сделайте повторный скан через 1–2 недели, чтобы увидеть динамику».
- Если динамика положительная — зелёная подпись «+N баллов за {дней}», отрицательная — красная.

### Этап 3. Сбор сигналов для будущей калибровки

**Файл:** `owndev-backend/src/services/SiteCheckPipeline.ts`

В финальный `result` добавить блок `signals` (всё уже считается, просто структурно складываем):
```ts
result.signals = {
  has_llms_txt: !hasLlmsTxtIssue,
  has_faqpage: hasFaqPage,
  has_schema_org: !hasSchemaIssue,
  has_organization_jsonld: schemaTypes.includes('Organization'),
  word_count: parsedHtml?.text?.length ?? 0,
  schema_types_count: schemaTypes.length,
  internal_links_count: internalLinksCount ?? 0,
  external_links_count: externalLinksCount ?? 0,
  has_meta_description: Boolean(seoData?.description),
  has_og_tags: Boolean(seoData?.ogTitle),
  title_length: seoData?.title?.length ?? 0,
};
```

Падает в `site_check_scans.result` JSONB. Никаких миграций. Через 2–4 недели накопления — отдельным offline-скриптом можно будет регрессировать веса.

### CHANGELOG

В `owndev-backend/CHANGELOG.md` под `## [Unreleased]` дописать:
- **Added:** валидация ключевых слов через Google Suggest API (`verified` + `suggestions` в `result.keywords`).
- **Added:** эндпоинт `GET /api/v1/site-check/history/:domain` для истории сканов по домену.
- **Added:** график динамики оценок (Recharts) в `SiteCheckResult` при ≥2 сканах.
- **Added:** блок `result.signals` со структурированными сигналами для будущей калибровки весов.

## Что НЕ трогаем

- Perplexity API — отложено по решению пользователя.
- LLM-judge блок — уже честно помечен `simulated: true`.
- `OVERALL_WEIGHTS` — не меняем, только собираем данные для будущего пересмотра.
- Миграции БД, header, навигация, эмулированные AI-системы.

## Что нужно от пользователя

Ничего перед стартом — все 3 этапа работают без новых ключей и connector'ов. После выполнения пользователь обещал прислать промпты — обработаем отдельной итерацией.

## Проверка

1. `cd owndev-backend && npx tsc --noEmit` → 0 ошибок.
2. Скан любого сайта → в `result.keywords` элементы вида `{ keyword, verified, suggestions }`; в UI зелёные/серые иконки.
3. `curl $API/api/v1/site-check/history/owndev.ru` → JSON с массивом сканов.
4. 2 скана одного домена → в отчёте появляется `HistoryChart` с 5 линиями.
5. `psql -c "SELECT result->'signals' FROM site_check_scans ORDER BY created_at DESC LIMIT 1"` → структурированный объект с 11 полями.

