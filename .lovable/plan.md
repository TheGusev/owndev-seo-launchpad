

## Исправление маппинга полей keywords и minus-words

### Проблема

Edge Function сохраняет keywords как `{ phrase, cluster, intent, frequency, landing_needed }`, но фронтенд ожидает `{ keyword, volume }`:

- `KeywordsSection.tsx` — интерфейс `{ keyword, volume }`, рендерит `kw.keyword` и `kw.volume`
- `DownloadButtons.tsx` — CSV берёт `kw.query ?? kw.keyword ?? kw.word` — ни один вариант не совпадает с `phrase`
- `MinusWordsSection.tsx` — ожидает `{ word, type, reason }`, реальная структура может отличаться

### Решение

Нормализовать данные в одном месте (`SiteCheckResult.tsx`) перед передачей в компоненты.

#### 1. `src/pages/SiteCheckResult.tsx`

Добавить нормализацию keywords после получения данных:

```typescript
const keywords = (Array.isArray(data.keywords) ? data.keywords : []).map((kw: any) => ({
  keyword: kw.phrase ?? kw.keyword ?? kw.word ?? '',
  volume: kw.frequency ?? kw.volume ?? 0,
  cluster: kw.cluster ?? 'Общие',
  intent: kw.intent,
  landing_needed: kw.landing_needed,
}));
```

Аналогично для minus_words — нормализовать `word` из возможных полей.

#### 2. `src/components/site-check/DownloadButtons.tsx`

Обновить `buildKeywordsCsv` — после нормализации данные уже в формате `{ keyword, volume, cluster, intent }`, убрать fallback-цепочки:

```typescript
const query = esc(kw.keyword);
const frequency = esc(kw.volume);
```

#### 3. Без изменений в KeywordsSection и MinusWordsSection

Они уже работают с `{ keyword, volume, cluster, intent }` — после нормализации в parent всё заработает.

### Файлы

| Файл | Изменение |
|------|-----------|
| `SiteCheckResult.tsx` | Нормализация keywords и minusWords после загрузки |
| `DownloadButtons.tsx` | Упростить маппинг в CSV (убрать fallback-цепочки) |

