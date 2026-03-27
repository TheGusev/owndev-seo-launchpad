

## Заглушки для ЮKassa — подготовка к проверке

Сейчас оплата не подключена: `createReport` возвращает `payment_url: null`, а фронт показывает toast. Нужно сделать полный flow со заглушкой: пользователь вводит email → создаётся report → имитируется "оплата" → redirect на страницу отчёта с данными из БД.

### Что будет сделано

**1. Edge function `site-check-report` — stub-режим оплаты**
- При создании report: сразу ставить `payment_status = 'paid'` (заглушка)
- Возвращать `payment_url` как ссылку на report-страницу: `/tools/site-check/report/{report_id}?token={download_token}`
- Добавить комментарий `// TODO: заменить на ЮKassa createPayment после прохождения проверки`

**2. Frontend `SiteCheckResult.tsx` — redirect после "оплаты"**
- После `createReport()` — делать `navigate()` на `/tools/site-check/report/{report_id}?token={download_token}` вместо toast

**3. Frontend `SiteCheckReport.tsx` — реальные данные из БД**
- Убрать mock-данные, заменить на `getReport(reportId, token)` из API
- Показывать загрузку, ошибку, или полный отчёт
- Если `payment_status === 'pending'` — показывать "Ожидаем подтверждение оплаты..." с auto-refresh (для будущей ЮKassa)
- Если token невалиден — "Неверная ссылка"

**4. `DownloadButtons` — заглушки кнопок**
- При клике показывать toast "Генерация файлов будет доступна после подключения ЮKassa"
- Кнопки активны при `paid=true`, но скачивание пока stub

### Файлы

| Файл | Изменение |
|------|-----------|
| `supabase/functions/site-check-report/index.ts` | Stub: `payment_status='paid'`, return redirect URL |
| `src/pages/SiteCheckResult.tsx` | Navigate to report page after createReport |
| `src/pages/SiteCheckReport.tsx` | Fetch real data via API, remove mocks |
| `src/components/site-check/DownloadButtons.tsx` | Add onClick toast stubs |
| `src/lib/site-check-api.ts` | Без изменений, API уже готов |

### Что останется для ЮKassa (после проверки)
- Добавить секреты `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY`
- Создать edge function `yookassa-webhook`
- В `site-check-report`: заменить stub на реальный `createPayment`
- В report page: включить polling для `pending` статуса

