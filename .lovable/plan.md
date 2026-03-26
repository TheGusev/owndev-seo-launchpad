

## Разработка интерфейса "Проверка сайта" (`/tools/site-check`)

### Обзор

Создаём 3-страничный инструмент с отдельным роутингом (не через `ToolPage.tsx`), компонент `SiteCheckBanner` для upsell во всех инструментах.

**Пока только фронтенд** — backend (edge functions, оплата ЮKassa) будет в следующих промтах. Данные для preview будут заглушены mock-ом.

### Новые файлы

| Файл | Назначение |
|------|-----------|
| `src/pages/SiteCheck.tsx` | Стартовая страница с формой |
| `src/pages/SiteCheckResult.tsx` | Preview-результат (scores + top-5 issues) |
| `src/pages/SiteCheckReport.tsx` | Полный отчёт после оплаты |
| `src/components/site-check/ScanForm.tsx` | Форма: URL + toggle page/site + кнопка |
| `src/components/site-check/ScoreCards.tsx` | 5 score-карточек с цветовой шкалой |
| `src/components/site-check/IssueCard.tsx` | Единая карточка проблемы (формат из ПРОМТ 0) |
| `src/components/site-check/ScanProgress.tsx` | Прогресс-бар с шагами pipeline |
| `src/components/site-check/PaywallCTA.tsx` | Блок цены + email + кнопка оплаты |
| `src/components/site-check/FullReportView.tsx` | Web-версия полного отчёта (сворачиваемые секции) |
| `src/components/site-check/DownloadButtons.tsx` | 4 кнопки скачивания (PDF/DOCX/CSV) |
| `src/components/SiteCheckBanner.tsx` | Upsell-баннер для существующих инструментов |

### Изменения в существующих файлах

| Файл | Изменение |
|------|-----------|
| `src/App.tsx` | +3 маршрута: `/tools/site-check`, `/tools/site-check/result/:scanId`, `/tools/site-check/report/:reportId` (до `:toolSlug`) |
| `src/components/tools/ToolCTA.tsx` | Добавить `<SiteCheckBanner />` под существующий CTA |

### Стартовая страница `/tools/site-check`

```text
┌─────────────────────────────────────┐
│  Проверка сайта                     │
│  SEO, Яндекс.Директ, конкуренты... │
├─────────────────────────────────────┤
│  [https://yoursite.ru         ]     │
│  ○ Проверить страницу  ● Проверить сайт │
│  [ Запустить проверку ]             │
├─────────────────────────────────────┤
│  Что проверяем:                     │
│  ✓ Технический SEO                  │
│  ✓ Заголовки, Title, H1            │
│  ✓ Яндекс.Директ                   │
│  🔒 Конкуренты (полный отчёт)      │
│  🔒 200+ запросов (полный отчёт)   │
│  🔒 Минус-слова (полный отчёт)     │
│  ✓ Schema.org и AI-видимость       │
└─────────────────────────────────────┘
```

- Toggle реализован через два стилизованных radio-кнопки (не Switch)
- При нажатии "Запустить" — показываем `ScanProgress` с анимированными шагами
- После завершения — `navigate` на `/tools/site-check/result/{scan_id}`

### Preview-результат `/tools/site-check/result/:scanId`

- **ScoreCards**: 5 карточек в ряд (grid-cols-2 sm:grid-cols-3 lg:grid-cols-5), каждая с круговым прогрессом или числом + цветом (red/yellow/green)
- **Top-5 IssueCard**: severity badge (🔴🟠🟡⚪), title, found, кнопка "Как исправить" с lock-иконкой (disabled)
- **Блок "Полный отчёт включает"**: список с иконками
- **PaywallCTA**: цена 1 490 ₽, кнопка → раскрывается поле email + "Перейти к оплате"

### Полный отчёт `/tools/site-check/report/:reportId`

- Статус-бар: "Отчёт готов" или спиннер
- 4 кнопки скачивания (disabled если не paid)
- Сворачиваемые секции по модулям (Accordion): Technical, Content, Direct, Competitors, Semantics, Schema, AI
- Каждая IssueCard в полном формате: severity, title, found, location, why_it_matters, how_to_fix, example_fix
- Напоминание: "Ссылка отправлена на {email}"

### SiteCheckBanner (upsell)

Добавляется в `ToolCTA.tsx` — появится автоматически на всех инструментах:

```text
─────────────────────────────────────
Хотите проверить весь сайт сразу?
Запустите полную Проверку сайта →
─────────────────────────────────────
```

### Mock-данные

На этом этапе backend ещё не реализован. Создадим mock-функции в `src/lib/site-check-mock.ts` для имитации scan-результатов: 5 scores, 15 issues, keywords, competitors. Это позволит полностью протестировать UI до подключения реального backend.

### Технические детали

- Роуты site-check **должны** стоять в `App.tsx` ПЕРЕД `/tools/:toolSlug`, иначе `site-check` будет перехвачен как toolSlug
- Все страницы: Header + Footer, тёмная тема (уже есть), mobile-first grid
- IssueCard severity цвета: critical=`text-red-500`, high=`text-orange-500`, medium=`text-yellow-500`, low=`text-muted-foreground`
- Score цвета: 0-40=`text-red-500 border-red-500/30`, 41-70=`text-yellow-500 border-yellow-500/30`, 71-100=`text-green-500 border-green-500/30`

