

## Исправление определения llms.txt в GEO Рейтинге

### Проблема
Для owndev.ru и goruslugimsk.ru (и всех остальных сайтов) в рейтинге показывается «llms.txt отсутствует», хотя файл есть. Причина:

- `site-check-scan` сохраняет `hasLlmsTxt: true` в поле `seo_data`
- Но `geo-rating-cron` ищет `has_llms_txt` в поле `llm_judge`, которое заполняется отдельной функцией LLM Judge и **никогда не содержит** это поле
- Результат: `llmJudge?.has_llms_txt` всегда `undefined` → fallback `false`

Данные в базе подтверждают: `seo_data.hasLlmsTxt = true`, `llm_judge = null`.

### Решение

Одно изменение в `supabase/functions/geo-rating-cron/index.ts`, строка 185:

**Было:**
```typescript
const hasLlmsTxt = llmJudge?.has_llms_txt ?? false;
```

**Станет:**
```typescript
const hasLlmsTxt = seoData?.hasLlmsTxt ?? llmJudge?.has_llms_txt ?? false;
```

Теперь `has_llms_txt` берётся из `seo_data.hasLlmsTxt` (где оно реально хранится), с fallback на `llm_judge` для обратной совместимости.

### После деплоя
Перепрогнать хотя бы owndev.ru и goruslugimsk.ru через `geo-rating-cron`, чтобы обновить значение в таблице.

