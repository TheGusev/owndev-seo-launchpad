

## 4 точечные правки — план реализации

### 1. SiteCheckResult.tsx — null-safe breakdown (строка 108)

Заменить строку 108 на безопасный парсинг:
```ts
const breakdown = (rawScores?.breakdown || rawScores?.seoBreakdown)
  ? {
      seo: rawScores?.seoBreakdown || rawScores?.breakdown?.seo || null,
      ai: rawScores?.breakdown?.ai || null,
      direct: rawScores?.breakdown?.direct || null,
      schema: rawScores?.breakdown?.schema || null,
    }
  : undefined;
```
Если `breakdown` остаётся `undefined` — `ScoreDetailsModal` покажет "Детальная разбивка недоступна". ScoreDetailsModal не трогаем.

### 2. LlmJudgeSection.tsx + SiteCheckResult.tsx — loading/error/empty states

**LlmJudgeSection.tsx**: расширить props на `loading`, `error`, `onRetry`. Добавить:
- `loading=true` → спиннер "Опрашиваем нейросети..."
- `error` → красный блок + кнопка "Повторить"
- `data === null` или `total_prompts === 0` → empty state "AI-аудит пока недоступен"
- Никаких импортов supabase

**SiteCheckResult.tsx** (строки 227-238): заменить на единый вызов:
```tsx
<LlmJudgeSection
  data={llmJudge}
  loading={llmJudgeLoading}
  error={llmJudgeError}
  onRetry={() => triggerLlmJudge(scanId, data.url, data.theme)}
/>
```
Добавить state `llmJudgeError` и ловить ошибку в `triggerLlmJudge`.

### 3. scan.ts — проверка content-type (строки 16-30)

Порядок: **сначала `resp.ok`**, потом content-type. После существующей обработки `!resp.ok` (строки 16-29), перед финальным `return resp.json()` (строка 30) добавить:
```ts
const ct = resp.headers.get('content-type') || '';
if (!ct.includes('application/json') && !ct.includes('text/json')) {
  throw new Error('Сервер вернул не JSON, возможно он недоступен');
}
```

### 4. GeoRating.tsx — domain как основной label

**Мобайл (строка 236)**: `entry.brandName` → `entry.domain`

**Десктоп (строка 245)**: domain первый, brandName вторичный:
```tsx
<span className="truncate">
  {entry.domain}
  {entry.brandName && entry.brandName !== entry.domain && (
    <span className="text-muted-foreground/50 text-xs font-normal ml-1 max-w-[120px] truncate inline-block align-bottom">
      {entry.brandName}
    </span>
  )}
</span>
```

### Не трогаем
- ScoreDetailsModal, tools.ts, config.ts, mapDbRowToEntry, бэкенд

