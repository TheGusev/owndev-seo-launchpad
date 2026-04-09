

## Frontend-only патч: 4 задачи

**Важно**: `src/lib/api/tools.ts` НЕ трогаем. `audit.status === 'done'` уже корректный.

---

### Задача 1 — Placeholder без протокола + ensureProtocol везде

Заменить `placeholder="https://..."` → `placeholder="example.com"` / `"ваш-сайт.ru"` в **13 файлах**:

| Файл | Placeholder |
|------|-------------|
| `Hero.tsx` | `yoursite.ru` |
| `ScanForm.tsx` | `ваш-сайт.ru` |
| `SEOAuditor.tsx` | `example.com` |
| `IndexationChecker.tsx` | `example.com/page` |
| `InternalLinksChecker.tsx` | `example.com` |
| `CompetitorAnalysis.tsx` | `example.com` / `competitor.com` |
| `ContentBriefGenerator.tsx` | `example.com` |
| `LLMPromptHelper.tsx` | `example.com/services` |
| `SitemapGenerator.tsx` | `example.com/sitemap.xml` |
| `GeoAudit.tsx` | `yoursite.ru` |
| `NotFound.tsx` | `example.com` |
| `ScenarioDemoForm.tsx` (AiVisibility, Monitoring) | `ваш-сайт.ru` |

Также: убрать `type="url"` из Hero input (браузер блокирует submit без протокола).

Добавить `ensureProtocol()` в submit-хэндлеры, где его ещё нет:
- `Hero.tsx` — `handleQuickCheck`
- `GeoAudit.tsx`
- `NotFound.tsx`
- `ScenarioDemoForm.tsx`
- `IndexationChecker.tsx`
- `InternalLinksChecker.tsx`
- `CompetitorAnalysis.tsx`
- `ContentBriefGenerator.tsx`
- `LLMPromptHelper.tsx`
- `SitemapGenerator.tsx`

Импортировать `ensureProtocol` из `@/lib/api`.

---

### Задача 2 — Главная → auto-submit аудита

**Hero.tsx**: навигация уже идёт на `/tools/site-check?url=...` — корректно, протокол добавить через `ensureProtocol`.

**SiteCheck.tsx**: уже есть `useEffect` с `searchParams.get("url")` + auto-rescan. Нужно убрать требование `rescan === "true"` — запускать автоматически если есть `?url=`:
```
if (rescanUrl && !rescanTriggered.current) {
  rescanTriggered.current = true;
  handleSubmit(rescanUrl, "site");
}
```

**ScanForm.tsx**: уже подставляет URL из `?url=` — оставить как есть.

---

### Задача 3 — Убрать "Проверить страницу" из ScanForm

В `ScanForm.tsx`:
- Удалить блок с двумя кнопками mode toggle (строки 51-76)
- Убрать state `mode` — всегда передавать `"site"`
- В `handleSubmit`: `onSubmit(cleanUrl, "site")`
- Убрать импорт `FileText`, `Globe`, тип `ScanMode` (если не нужен в props)
- Props `onSubmit` сигнатура сохраняется `(url: string, mode: ScanMode)` для совместимости

---

### Задача 4 — Новый экран загрузки аудита

Полная переработка `ScanProgress.tsx`:

**Новая структура:**
- Принимает доп-проп `domain?: string` (для заголовка "Анализируем domain...")
- 6 шагов вместо 4, вертикальный список (не горизонтальный stepper)
- Каждый шаг: иконка + название + статус (ожидание / spinner / галочка + мини-результат)
- Прогресс-бар внизу

**Шаги:**
1. `Search` — Краулинг страницы
2. `FileText` — Индексируемость
3. `AlignLeft` — Структура контента
4. `Bot` — AI-готовность
5. `Code` — Schema.org разметка
6. `Star` — E-E-A-T сигналы

**Анимация:**
- Шаги появляются stagger (delay 100ms каждый)
- Симуляция: каждые 2-4 секунды следующий шаг завершается (независимо от API)
- Завершённый шаг: зелёная галочка + текст результата, opacity-70
- Активный шаг: `Loader2` spinner + пульсация
- При `realProgress >= 100` или `status === 'done'` — все шаги мгновенно done
- При `error` — красная иконка на текущем шаге

**В `SiteCheck.tsx`**: передать `domain` в ScanProgress (парсить из URL).

---

### Файлы и объём

| Файл | Действие | Строк |
|------|----------|-------|
| `src/components/Hero.tsx` | placeholder, type, ensureProtocol | ~3 |
| `src/components/site-check/ScanForm.tsx` | placeholder, убрать mode toggle | ~-25 |
| `src/components/site-check/ScanProgress.tsx` | Полная переработка | ~120 |
| `src/pages/SiteCheck.tsx` | auto-submit без rescan, передать domain | ~5 |
| `src/components/tools/SEOAuditor.tsx` | placeholder | ~1 |
| `src/components/tools/IndexationChecker.tsx` | placeholder + ensureProtocol | ~3 |
| `src/components/tools/InternalLinksChecker.tsx` | placeholder + ensureProtocol | ~3 |
| `src/components/tools/CompetitorAnalysis.tsx` | placeholder + ensureProtocol | ~4 |
| `src/components/tools/ContentBriefGenerator.tsx` | placeholder + ensureProtocol | ~3 |
| `src/components/tools/LLMPromptHelper.tsx` | placeholder + ensureProtocol | ~3 |
| `src/components/tools/SitemapGenerator.tsx` | placeholder | ~1 |
| `src/pages/GeoAudit.tsx` | placeholder + ensureProtocol | ~3 |
| `src/pages/NotFound.tsx` | placeholder + ensureProtocol | ~3 |
| `src/components/scenarios/ScenarioDemoForm.tsx` | placeholder + ensureProtocol | ~3 |

### Что НЕ трогаем
- `src/lib/api/tools.ts` — 0 изменений, `audit.status === 'done'` не трогаем
- Backend, workers, BullMQ, auth — 0 изменений
- Роутинг (react-router routes) — 0 изменений
- Результирующий экран после done — 0 изменений
- `useAudit` hook — 0 изменений

