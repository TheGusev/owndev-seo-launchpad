

## Две задачи

### Задача A: LLM-проверки — уже готово ✅

Все 6 новых AI-проверок **уже реализованы** в edge function `site-check-scan/index.ts` (строки 968–1073):
- ✅ `/llms.txt` (HEAD-запрос)
- ✅ FAQ-блоки + Schema FAQPage
- ✅ Schema Article / LocalBusiness / Organization
- ✅ E-E-A-T: блок автора
- ✅ E-E-A-T: дата публикации
- ✅ Списки `<ul>/<ol>`

Все ошибки попадают в модуль `ai` и отображаются в аккордеоне "AI-видимость" в `FullReportView`. Дополнительных изменений не требуется.

### Задача B: Экспорт отчёта в PDF из браузера

**Подход:** Установить `jspdf` и `jspdf-autotable`. Генерировать PDF программно из данных отчёта (без html2canvas — быстрее, чище, не зависит от рендера).

**Новый файл `src/utils/exportReportPdf.ts`:**
- Функция `exportReportPdf({ url, theme, scores, issues, competitors, keywords, minusWords })`
- Страница 1: заголовок "Отчёт SEO-аудита — {url}", дата, тема, 5 скоров в таблице
- Страница 2+: все ошибки сгруппированные по модулю — таблица (severity, title, found, how_to_fix)
- Страница 3+: конкуренты — таблица (url, total, seo, direct, schema, ai)
- Страница 4+: ключевые запросы — таблица (keyword, volume, cluster, intent)
- Страница 5: минус-слова — список
- Цвета: тёмный фон не нужен (PDF белый), но severity-маркеры сохранить (красный/оранжевый/жёлтый)

**`src/components/site-check/DownloadButtons.tsx`:**
- Принимает пропсы `data` (url, theme, scores, issues, competitors, keywords, minus_words)
- Кнопка "Скачать PDF" становится активной (убрать opacity-50, cursor-not-allowed)
- onClick вызывает `exportReportPdf(data)`
- Остальные 3 кнопки (Word, Ключевые, Минус-слова) остаются заглушками

**`src/pages/SiteCheckResult.tsx`:**
- Добавить `<DownloadButtons data={data} />` в блок результатов (передать все данные)

**`src/pages/SiteCheckReport.tsx`:**
- Аналогично передать данные в DownloadButtons

### Файлы

| Файл | Действие |
|------|----------|
| `src/utils/exportReportPdf.ts` | Новый — генерация PDF |
| `src/components/site-check/DownloadButtons.tsx` | Пропсы + активная кнопка PDF |
| `src/pages/SiteCheckResult.tsx` | Передать data в DownloadButtons |
| `src/pages/SiteCheckReport.tsx` | Передать data в DownloadButtons |
| `package.json` | +jspdf, +jspdf-autotable |

