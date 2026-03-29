

## Снятие Paywall + Единый маршрут результатов

### Суть проблемы

1. `getScanPreview()` вызывает edge function `/preview/:id`, которая фильтрует issues до 5 штук (`visible_in_preview + slice(0,5)`) и не возвращает competitors/keywords/minus_words
2. `IssueCard` рендерится с `locked` prop — детали скрыты
3. `PaywallCTA` занимает место внизу результатов
4. `SiteCheckReport.tsx` — отдельный маршрут для платного отчёта, который зависит от payment token

### План (7 файлов)

#### 1. `src/lib/site-check-api.ts` — добавить `getFullScan(scanId)`

Новая функция, которая читает данные напрямую из таблицы `scans` через supabase client (RLS разрешает public SELECT):

```typescript
export async function getFullScan(scanId: string) {
  const { data, error } = await supabase
    .from('scans').select('*').eq('id', scanId).single();
  if (error || !data) throw new Error('Scan not found');
  return data;
}
```

Это обходит edge function preview-фильтр и возвращает ВСЕ данные: все issues, competitors, keywords, minus_words.

#### 2. `src/pages/SiteCheckResult.tsx` — полный рефакторинг

- Заменить `getScanPreview(scanId)` на `getFullScan(scanId)`
- Убрать импорт и рендер `PaywallCTA`
- Убрать Dialog оплаты, состояния `showPaymentModal`, `paymentEmail`, `sending`, `handlePay`, `handleNotifyMe`
- Убрать заголовок "Топ-5 критичных проблем"
- Рендерить полный отчёт: `FullReportView` (все issues), `CompetitorsTable`, `KeywordsSection`, `MinusWordsSection`
- Issues передавать без `locked` prop
- Добавить `DownloadButtons` (уже с заглушкой)

#### 3. `src/components/site-check/IssueCard.tsx`

- Убрать prop `locked` (по умолчанию всегда false)
- Удалить блок с замочком "Как исправить — в полном отчёте"
- Оставить только кнопку раскрытия "Как исправить" / "Свернуть" (которая уже работает)

#### 4. `src/pages/SiteCheckReport.tsx` — редирект

Заменить весь компонент на редирект:
```typescript
import { useParams, Navigate } from 'react-router-dom';
export default function SiteCheckReport() {
  const { reportId } = useParams();
  return <Navigate to={`/tools/site-check/result/${reportId}`} replace />;
}
```

#### 5. `src/App.tsx` — маршруты

- Маршрут `/tools/site-check/result/:scanId` → `SiteCheckResult` (без изменений)
- Маршрут `/tools/site-check/report/:reportId` → `SiteCheckReport` (теперь редирект)

#### 6. `src/pages/SiteCheck.tsx` — убрать free/locked разделение

В списке "Что проверяем" убрать иконки замков и бейджи "полный отчёт" — все пункты теперь бесплатные (зелёные галочки).

#### 7. `src/components/ErrorBoundary.tsx` — новый

Обёртка для защиты от чёрных экранов. Оборачивает маршруты site-check в App.tsx.

### Итоговый flow после правок

1. `/tools/site-check` → ввод URL → скан
2. Polling → navigate `/tools/site-check/result/:id`
3. `SiteCheckResult` загружает ВСЕ данные через `supabase.from('scans').select('*')`
4. Рендерит: ScoreCards, все Issues (без замков, раскрываемые), CompetitorsTable, KeywordsSection, MinusWordsSection
5. Никаких PaywallCTA, замков, лимитов

