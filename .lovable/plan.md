

## Цель

Сделать честным эндпоинт `POST /api/v1/site-check/llm-judge`: пометить, что оценки 6 AI-систем — это эвристическая эмуляция через `gpt-4o-mini`, а не реальные запросы к ChatGPT/Perplexity/Яндексу/Gemini/GigaChat/Алисе.

## Файл

`owndev-backend/src/api/routes/siteCheck.ts` — единственная правка. Фронт (`LlmJudgeSection.tsx`) не трогаем: новые поля просто доедут в payload.

## Правки

### 1. `queryAiSystem` — успех (строка 495)

В возвращаемый объект добавить `simulated: true` и пометку в `verdict`:

```ts
return {
  id: system.id, name: system.name, icon: system.icon, color: system.color,
  score: Number(parsed.score) || 0,
  verdict: `${parsed.verdict || 'Нет данных'} (эмуляция на основе анализа сайта)`,
  reason: parsed.reason || '',
  suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  simulated: true,
};
```

### 2. `queryAiSystem` — fallback при ошибке (строка 498)

```ts
return {
  id: system.id, name: system.name, icon: system.icon, color: system.color,
  score: 0,
  verdict: 'Ошибка анализа (эмуляция на основе анализа сайта)',
  reason: 'Не удалось получить оценку',
  suggestions: [],
  simulated: true,
};
```

### 3. Финальный `payload` (строка 503)

```ts
const payload = {
  success: true,
  url, domain,
  avg_score: avgScore,
  systems: results,
  disclaimer: 'Оценки рассчитаны эвристически на основе анализа сайта. Реальные запросы к AI-системам не выполняются.',
  _pending: false,
};
```

`disclaimer` пишется в БД вместе с payload (через тот же `JSON.stringify(payload)` на строке 510) — кэшированные ответы тоже автоматически получат поле при следующем сохранении.

### 4. Кэш-хит (строка 428) — обогащаем старые записи на лету

Старые закэшированные результаты в `site_check_scans.result.llm_judge` не содержат `simulated`/`disclaimer`. Чтобы пользователь не видел «честные» и «нечестные» ответы вперемешку, добавляем поля при отдаче из кэша:

```ts
const enriched = {
  ...(cachedJudge as any),
  systems: Array.isArray((cachedJudge as any).systems)
    ? (cachedJudge as any).systems.map((s: any) => ({
        ...s,
        simulated: true,
        verdict: typeof s.verdict === 'string' && !/эмуляция/i.test(s.verdict)
          ? `${s.verdict} (эмуляция на основе анализа сайта)`
          : s.verdict,
      }))
    : (cachedJudge as any).systems,
  disclaimer: (cachedJudge as any).disclaimer
    || 'Оценки рассчитаны эвристически на основе анализа сайта. Реальные запросы к AI-системам не выполняются.',
  _cached: true,
};
return reply.send(enriched);
```

## Что НЕ трогаем

- Промпты, модель `gpt-4o-mini`, retry-логика, температура, таймаут.
- Структура `aiSystems`, парсинг JSON, кэш-запись в БД.
- Эндпоинт `/ai-boost` и любые другие роуты.
- Фронтенд (`src/components/site-check/LlmJudgeSection.tsx`) — новые поля совместимы, отображать дисклеймер можно отдельной задачей.

## Проверка

1. `cd owndev-backend && npx tsc --noEmit` — 0 ошибок.
2. `POST /api/v1/site-check/llm-judge { url: "https://example.com" }` — каждый объект в `systems[]` содержит `simulated: true`, `verdict` оканчивается на `(эмуляция…)`, в корне есть `disclaimer`.
3. Повторный запрос с тем же `scan_id` — `_cached: true`, поля `simulated`/`disclaimer` тоже на месте (даже если в БД старая запись без них).
4. Принудительный сбой OpenAI (mock 400) — fallback-объект тоже содержит `simulated: true`.

