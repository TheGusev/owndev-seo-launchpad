

## Цель
1. Заменить `window.print()` в `FullAudit.tsx` (2 места) на полноценную PDF-генерацию через расширенный `generatePdfReport`.
2. Сделать прогрессивный рендеринг: секции CRO появляются сразу как только пришёл ответ, не дожидаясь завершения GEO+SEO аудита. Секции SiteCheck — по мере их готовности.

## Объём изменений
В кодовой базе `window.print()` встречается **только в `src/pages/FullAudit.tsx`** (других мест с псевдо-PDF через печать нет). Все остальные инструменты (SiteCheck, MarketplaceAudit, SiteFormula) уже используют нормальные генераторы (`generatePdfReport`, `generateMarketplacePdf`, `generateSiteFormulaPdf`) — менять их не нужно.

## Часть 1 — Расширение `src/lib/generatePdfReport.ts`

Добавить опциональный CRO-блок в типе и в самом генераторе:

**В `src/lib/reportHelpers.ts`** — добавить опциональный тип `CroSection` и расширить `ReportData`:
```ts
export interface CroSection {
  conversion_score: number;
  money_lost_estimate: string;
  direct_budget_waste: string;
  barriers: { category: string; severity: 'critical'|'high'|'medium';
    title: string; description: string; fix: string; impact?: string }[];
  quick_wins: string[];
  fix_cost_estimate: { min: number; max: number; breakdown: string[]; roi_months: number };
  cta_recommendation: string;
}
export interface ReportData {
  /* ...existing... */
  cro?: CroSection; // NEW — опционально
}
```

**В `src/lib/generatePdfReport.ts`** — после блока «Приоритетный план действий» (строка ~624) добавить условный блок:
- `if (data.cro)` → новая страница `«CRO-АУДИТ: ПОЧЕМУ САЙТ НЕ ПРОДАЁТ»`
- Карточка conversion_score (большая, цвет по порогу)
- 2 алерт-блока: «Недополученный доход» (красный) и «Потери бюджета Директа» (оранжевый)
- Список barriers (тот же визуальный стиль что existing issues, цветная полоска по severity)
- Блок «Быстрые победы» — нумерованный список quick_wins
- Блок «Стоимость исправления» — диапазон min–max ₽, breakdown списком, окупаемость X мес
- Финальный CTA-баннер с `cta_recommendation`

Используются существующие хелперы (`drawSectionTitle`, `checkPageBreak`, `setFill`, `setTextColor`, цветовая палитра `PRINT_COLORS`).

Имя файла: `owndev_full_audit_{domain}_{date}.pdf` если есть `cro`, иначе текущее.

## Часть 2 — `src/pages/FullAudit.tsx`: PDF и прогрессивный рендер

### 2.1 Замена `window.print()` (2 места: строки 402, 585)

Заменить на единый обработчик `handleDownloadPdf()`:
```ts
const handleDownloadPdf = async () => {
  setPdfLoading(true);
  try {
    const reportData: ReportData = {
      url: siteCheckData?.url || croData?.url || url,
      domain: siteCheckData?.url ? new URL(siteCheckData.url).hostname : (croData?.domain || ''),
      theme: siteCheckData?.theme || 'Полный аудит',
      scanDate: new Date().toISOString(),
      scores: siteCheckData?.scores || { total: 0, seo: 0, direct: 0, schema: 0, ai: 0 },
      issues: siteCheckData?.issues || [],
      keywords: siteCheckData?.keywords || [],
      minusWords: (siteCheckData as any)?.minus_words || [],
      competitors: siteCheckData?.competitors || [],
      comparisonTable: (siteCheckData as any)?.comparison_table || null,
      directMeta: (siteCheckData as any)?.direct_meta || null,
      seoData: (siteCheckData as any)?.seo_data || {},
      cro: croData ? { /* mapping из ConversionResult */ } : undefined,
    };
    await generatePdfReport(reportData);
    toast({ title: '✅ PDF готов', description: 'Файл сохранён' });
  } catch (e) {
    toast({ title: 'Ошибка PDF', variant: 'destructive' });
  } finally { setPdfLoading(false); }
};
```
Импорты: `generatePdfReport`, `ReportData`, `useToast`, новый стейт `pdfLoading`. Кнопки в заголовке (стр. 402) и в CTA (стр. 585) показывают `Loader2` при загрузке.

### 2.2 Прогрессивный рендеринг

Заменить условие `showResults = bothDone && (siteCheckData || croData)` на гибкое:
- `const hasAnyResult = !!(croData || siteCheckData)` — показывать блок результатов как только пришёл первый
- Форму прятать как только начался запуск (`running || hasAnyResult`)

Каждая секция уже условна (`{croData && ...}`, `{siteCheckData && ...}`) — нужно лишь убрать ожидание `bothDone`.

Добавить «живые» индикаторы статуса вверху отчёта (когда что-то ещё грузится):
```tsx
{(running || !bothDone) && (
  <div className="flex flex-wrap gap-2 no-print">
    <StatusChip done={croDone} error={croError} label="CRO анализ" />
    <StatusChip done={siteCheckDone} error={siteCheckError} 
      label={`GEO+SEO аудит ${!siteCheckDone ? siteCheckProgress + '%' : ''}`} />
  </div>
)}
```

CRO-секции (Вердикт, Конверсионные потери, Быстрые победы, Стоимость, CTA) появятся сразу. Секции SiteCheck (Технические барьеры, AI-видимость) — по мере готовности скана. Кнопка «Скачать PDF» доступна как только пришла хоть одна часть, но disable если всё ещё `running` (в подсказке: «дождитесь завершения для полного отчёта»).

## Ограничения и контракты

- Не трогаем существующие генераторы для других страниц.
- `generatePdfReport` остаётся обратно совместимым — поле `cro` опционально, существующий `DownloadButtons.tsx` (SiteCheck) продолжит работать без изменений.
- Не трогаем backend, типы Scan, API.
- Шрифты Roboto (Cyrillic) уже подключены.

## Файлы

- **Edit** `src/lib/reportHelpers.ts` — добавить `CroSection`, расширить `ReportData.cro?`.
- **Edit** `src/lib/generatePdfReport.ts` — добавить рендер CRO-блока в конце; обновить имя файла.
- **Edit** `src/pages/FullAudit.tsx` — заменить оба `window.print()` на `handleDownloadPdf`; перейти на прогрессивный рендер; добавить статус-чипы при частичной загрузке.

## Проверка

После реализации: запустить аудит → CRO-секции видны сразу → SiteCheck-секции дорисовываются → кнопка «Скачать PDF» создаёт единый файл с обеими частями. `npm run build` без ошибок.

