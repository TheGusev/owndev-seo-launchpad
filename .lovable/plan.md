

## Сохранение флага SPA и отображение в UI

### Текущее состояние
SPA-детекция и двухэтапное сканирование через Jina Reader **уже полностью реализованы** в Edge Function:
- `isSpaPage()` определяет SPA (строка 47)
- `fetchRenderedContent()` получает рендеренный контент через Jina Reader (строка 64)
- `buildEnrichedHtml()` объединяет серверный `<head>` с рендеренным контентом (строка 88)
- Переменная `isSpa` устанавливается (строка 2080), но **не сохраняется** в БД

### Что нужно доделать

#### 1. Миграция: колонка `is_spa` в таблице `scans`
```sql
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS is_spa boolean DEFAULT false;
```

#### 2. `supabase/functions/site-check-scan/index.ts` — сохранить флаг
В финальном `updateScan` (строка 2211) добавить `is_spa: isSpa`. Также в промежуточный `updateScan` после SPA-детекции (строка 2077) добавить `is_spa: isSpa`.

#### 3. `src/pages/SiteCheckResult.tsx` — бейдж SPA + уведомление
Рядом с URL (строка 133-139) показать бейдж если `data.is_spa === true`:
- Бейдж: `<Badge variant="outline">SPA</Badge>` рядом со ссылкой на сайт
- Информационное уведомление под заголовком: «Обнаружен SPA-сайт. Контент проанализирован после рендеринга JavaScript.»

### Файлы

| Файл | Действие |
|------|----------|
| Миграция SQL | Колонка `is_spa boolean` |
| `supabase/functions/site-check-scan/index.ts` | Сохранить `is_spa` в updateScan |
| `src/pages/SiteCheckResult.tsx` | Бейдж SPA + уведомление |

