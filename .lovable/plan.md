

## БЛОК 6 — UX полировка

### FIX 12: ScanProgress — расширенные этапы

**`src/components/site-check/ScanProgress.tsx`** — обновить список шагов на 7 этапов:
1. Загрузка страницы
2. Технический анализ
3. Проверка индексации
4. Анализ контента
5. Проверка конкурентов
6. Генерация рекомендаций
7. Финализация отчёта

Прогресс-бар уже имеет `transition-all duration-700 ease-out` — оставить как есть. Иконки уже работают корректно (CheckCircle2 / Loader2 / пустой круг).

### FIX 13: EmptyState компонент

**Новый файл `src/components/ui/empty-state.tsx`:**
- Принимает `message?: string`, `onRetry?: () => void`
- Рендерит AlertCircle + текст + кнопка "Повторить"

**Инструменты для интеграции** — обернуть пустые/ошибочные результаты:
- `SEOAuditor.tsx` — если `result` пустой после запроса
- `SemanticCoreGenerator.tsx` — если `result` пустой
- `AITextGenerator.tsx` — если `result` пустой
- `CompetitorAnalysis.tsx` — если `result` пустой
- `IndexationChecker.tsx` — если `result.issues` пустой
- `InternalLinksChecker.tsx` — если результат пустой

В каждом: проверить `if (data && !data.error && результат не пустой)` → показать результат, иначе EmptyState с `onRetry` = повтор запроса.

### FIX 14: 404 страница

**`src/pages/NotFound.tsx`:**
- Добавить 3 ссылки под кнопкой "На главную":
  - "Проверить сайт" → `/tools/site-check`
  - "Все инструменты" → `/tools`
  - "Главная" → `/`
- Добавить поле быстрой проверки URL: Input + GradientButton → navigate(`/tools/site-check?url=${url}`)
- tsparticles не используется — чисто

### FIX 15: SEO мета-теги

**`src/pages/ToolPage.tsx`** — уже имеет полный набор: `<title>`, `<meta description>`, `<link canonical>`, `<meta og:*>`, JSON-LD BreadcrumbList. **Никаких изменений не требуется.**

### Файлы

| Файл | Действие |
|------|----------|
| `src/components/site-check/ScanProgress.tsx` | 7 этапов вместо 5 |
| `src/components/ui/empty-state.tsx` | Новый компонент |
| `src/components/tools/SEOAuditor.tsx` | EmptyState |
| `src/components/tools/SemanticCoreGenerator.tsx` | EmptyState |
| `src/components/tools/AITextGenerator.tsx` | EmptyState |
| `src/components/tools/CompetitorAnalysis.tsx` | EmptyState |
| `src/components/tools/IndexationChecker.tsx` | EmptyState |
| `src/components/tools/InternalLinksChecker.tsx` | EmptyState |
| `src/pages/NotFound.tsx` | Ссылки + поле URL |

