

## Скрыть кнопку «Скачать llms.txt» если файл уже есть

### Проблема
В `SiteCheckResult.tsx` (строки 276–284) кнопка-предложение «Скачать llms.txt для вашего сайта» показывается **всегда**, даже если на проверяемом сайте llms.txt уже найден. Это противоречит логике: предложение нужно только тем, у кого файла нет.

### Решение

В `src/pages/SiteCheckResult.tsx` обернуть блок кнопки в условие — показывать только если `llms.txt` отсутствует.

**Источник истины (в порядке приоритета):**
1. `data.seo_data?.hasLlmsTxt === true` → файл есть, **скрыть** кнопку
2. `data.llmsTxt?.found === true` (новое поле из Sprint 3 worker) → файл есть, **скрыть**
3. Иначе — показать кнопку (как сейчас)

**Изменение в коде:**

```tsx
{/* 11. llms.txt — показываем только если файла НЕТ */}
{!(data.seo_data?.hasLlmsTxt || data.llmsTxt?.found) && (
  <div className="flex flex-col items-start gap-1">
    <button
      onClick={() => { import('@/utils/generateLlmsTxt').then(...) }}
      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
    >
      <Bot className="w-4 h-4" /> Сгенерировать llms.txt для вашего сайта
    </button>
    <span className="text-xs text-muted-foreground ml-6">
      На вашем сайте файл не найден — создайте по стандарту llmstxt.org
    </span>
  </div>
)}
```

Дополнительно — изменить текст с «Скачать» на **«Сгенерировать»** (это честнее: мы генерим шаблон под сайт, а не скачиваем существующий).

### Бонус (если файл есть)

Когда `hasLlmsTxt === true` — вместо кнопки показать тонкую зелёную подсказку:

```tsx
{(data.seo_data?.hasLlmsTxt || data.llmsTxt?.found) && (
  <div className="inline-flex items-center gap-2 text-sm text-emerald-400/80">
    <Bot className="w-4 h-4" /> llms.txt найден на сайте — проверка пройдена ✓
  </div>
)}
```

### Технические детали

**Файл:** `src/pages/SiteCheckResult.tsx`, строки 276–284 (блок «11. llms.txt»).

**Без изменений в бэке.** `seo_data.hasLlmsTxt` уже сохраняется worker'ом в `site_check_scans.seo_data` и приходит во фронт через `getFullScan(scanId)`. Поле `llmsTxt` (top-level) тоже уже пишется (Sprint 3, см. `SiteCheckWorker.ts:104`) — используем как fallback.

**Деплой:** автоматический через GitHub Actions после пуша в `main` (только фронт).

