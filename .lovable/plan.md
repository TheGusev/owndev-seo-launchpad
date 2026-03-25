

## Улучшение инструментов: Core Web Vitals + общие улучшения

### Обзор текущего состояния

Все 10 инструментов работоспособны. `key={toolSlug}` уже на месте — стейл-данные исправлены. Основные области для улучшения:

### 1. Core Web Vitals в SEO Auditor

**Проблема**: CWV нельзя измерить server-side через простой fetch (LCP, CLS, INP требуют реального браузера). Но можно добавить **эвристические проверки** на факторы, влияющие на CWV:

**В edge function `seo-audit`** добавить:
- **LCP-факторы**: проверка наличия `<img>` с `fetchpriority="high"` или `preload` для hero-изображения, наличие `font-display: swap` в стилях
- **CLS-факторы**: проверка `width`/`height` атрибутов у изображений, наличие `aspect-ratio` или размеров
- **INP-факторы**: подсчёт тяжёлых inline-скриптов в `<head>`, проверка `async`/`defer`

**В UI `SEOAuditor.tsx`**: добавить секцию "Core Web Vitals (эвристика)" с тремя карточками LCP/CLS/INP — каждая показывает оценку на основе обнаруженных факторов.

### 2. Улучшения по инструментам

| Инструмент | Проблема | Решение |
|---|---|---|
| **SEO Auditor** | Нет CWV проверок | Добавить эвристические CWV-проверки (см. выше) |
| **Competitor Analysis** | Нет CWV-метрик для сравнения | Добавить `imgsWithoutDimensions`, `hasFontDisplaySwap`, `hasPreloadHero` в метрики |
| **AI Text Generator** | Нет таймстампа и "заново" | Добавить timestamp + кнопку "Сгенерировать заново" |
| **Schema Generator** | Нет валидации результата | Добавить базовую валидацию JSON-LD (проверка обязательных полей по типу) |
| **Position Monitor** | Данные хранятся в localStorage | Уже корректно работает, оставить как есть |
| **Anti-Duplicate** | Использует `toast` из `sonner` вместо проектного | Исправить импорт на `@/hooks/use-toast` |

### 3. Файлы для изменения

| Файл | Изменения |
|---|---|
| `supabase/functions/seo-audit/index.ts` | +6 CWV-эвристических проверок: img без dimensions, отсутствие preload/fetchpriority, font-display, inline scripts |
| `supabase/functions/competitor-analysis/index.ts` | Добавить CWV-метрики: `imgsWithoutDimensions`, `hasLazyImages` |
| `src/components/tools/SEOAuditor.tsx` | Добавить секцию "Core Web Vitals" с тремя индикаторами |
| `src/components/tools/CompetitorAnalysis.tsx` | Добавить CWV-строки в таблицу сравнения |
| `src/components/tools/AITextGenerator.tsx` | Добавить timestamp + кнопку "Заново" |
| `src/components/tools/AntiDuplicateChecker.tsx` | Исправить импорт toast |

### Пример новых CWV проверок в отчёте

```text
[Warning] SEO | 8 из 12 изображений без width/height атрибутов
  Примеры:
  • <img src="/hero.jpg"> — нет width/height
  • <img src="/banner.png"> — нет width/height
  → Добавьте width и height к каждому <img>
  💡 Без размеров браузер не может зарезервировать место — это вызывает CLS (сдвиг макета)

[Info] SEO | Нет <link rel="preload"> для hero-изображения
  → Добавьте preload для главного изображения первого экрана
  💡 Preload ускоряет загрузку LCP-элемента
```

