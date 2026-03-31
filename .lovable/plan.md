

## Профессиональные PDF и Word экспорты для Site Check

### Обзор

Создаём 3 новых файла и обновляем 1. Устанавливаем 4 npm-зависимости. Заменяем текущий `window.print()` и текстовый отчёт на полноценные брендированные PDF (jsPDF) и DOCX (docx) генераторы.

### Зависимости

`jspdf`, `jspdf-autotable`, `docx`, `file-saver`, `@types/file-saver`

### Новые файлы

#### 1. `src/lib/reportHelpers.ts`
Общие утилиты: цветовая палитра OWNDEV, `getSeverityColor/Label`, `getCategoryLabel`, `getScoreStatus`, `calcPotentialGain`, `formatDate`, `truncate`, интерфейс `ReportData`.

#### 2. `src/lib/generatePdfReport.ts`
Полный PDF через jsPDF + autoTable. Страницы:
- Титульный лист (OWNDEV, URL, 5 карточек оценок)
- Технический паспорт (autoTable ~16 строк)
- План исправления (каждая ошибка с why_important / how_to_fix / example)
- Анализ конкурентов (summary cards + autoTable + инсайты)
- Семантическое ядро (топ-100 ключей, autoTable)
- Минус-слова по категориям
- Приоритетный план действий (топ-10)

Тёмная тема, фиолетовый акцент, колонтитулы на каждой странице.

#### 3. `src/lib/generateWordReport.ts`
DOCX через `docx` библиотеку. Та же структура, адаптированная под Word: styled tables, severity-coded borders, code blocks в Courier New, header/footer с OWNDEV и номером страницы. Сохранение через `file-saver`.

### Обновление `src/components/site-check/DownloadButtons.tsx`

- Расширить props: добавить `scanDate`, `seoData`, `comparisonTable`, `directMeta`
- Импортировать `generatePdfReport` и `generateWordReport`
- Собирать `ReportData` из props
- 4 кнопки: PDF, Word, CSV (ключи), TXT (минус-слова)
- Состояния загрузки `isGeneratingPdf` / `isGeneratingWord`
- Toast уведомления при генерации

### Обновление `src/pages/SiteCheckResult.tsx`

Прокинуть дополнительные props в `<DownloadButtons>`: `scanDate={data.created_at}`, `seoData={data.seo_data}`, `comparisonTable`, `directMeta`.

### Файлы (5)

| Файл | Действие |
|------|----------|
| `src/lib/reportHelpers.ts` | Новый — утилиты |
| `src/lib/generatePdfReport.ts` | Новый — PDF генератор |
| `src/lib/generateWordReport.ts` | Новый — Word генератор |
| `src/components/site-check/DownloadButtons.tsx` | Обновить — новые кнопки |
| `src/pages/SiteCheckResult.tsx` | Обновить — прокинуть props |

