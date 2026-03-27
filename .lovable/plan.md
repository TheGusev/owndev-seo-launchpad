

## Проверка ПРОМТ 7 — статус выполнения

### Что реализовано (stub-режим)

| Требование | Статус | Комментарий |
|---|---|---|
| PaywallCTA с email, "1 490 ₽", кнопка "Получить полный отчёт" | ✅ | |
| POST /create → report + payment_status='paid' (stub) | ✅ | |
| Возврат report_id, download_token, payment_url | ✅ | |
| Фронт redirect на report page | ✅ | |
| Report page: fetch данных через getReport(id, token) | ✅ | |
| Pending state с auto-refresh каждые 3 сек | ✅ | |
| Невалидный token → "Неверная ссылка" | ✅ | |
| 4 кнопки скачивания (PDF, DOCX, Keywords CSV, Minus CSV) | ✅ | |
| Кнопки disabled если не paid, stub toast при клике | ✅ | |
| Роуты site-check перед `:toolSlug` | ✅ | |
| API функции в site-check-api.ts | ✅ | |

### Что НЕ реализовано (но указано как "после подключения ЮKassa")

| Требование | Статус | Пояснение |
|---|---|---|
| Реальный платёж ЮKassa (createPayment) | ⏳ Stub | Ожидаемо — нужны секреты YOOKASSA_SHOP_ID/SECRET_KEY |
| Edge function `yookassa-webhook` (HMAC, payment.succeeded) | ⏳ Не создан | Будет при подключении ЮKassa |
| Генерация файлов (PDF, DOCX, CSV) и upload в Storage | ⏳ Stub | Кнопки показывают toast |
| Отправка email с ссылкой на отчёт | ⏳ Не реализовано | Будет после подключения ЮKassa |
| Rate limiting (3 req/hour на /create, 60/hour на GET) | ❌ Не реализовано | Нужно добавить |
| "Формируется... подождите" состояние кнопок при generating | ❌ Не реализовано | Нет поля статуса генерации файлов |

### Мелкие расхождения с промтом

1. **Лейблы кнопок**: промт указывает "↓ Ключевые слова" и "↓ Минус-слова", в коде — "Ключи CSV" и "Минус-слова CSV". Мелочь, но стоит привести к формату промта.
2. **Report page не показывает keywords, competitors, minus_words** — `FullReportView` отображает только issues. Полный отчёт должен также содержать секции: сравнительная таблица конкурентов, список ключевых запросов (по секциям SEO/Директ/Инфо), минус-слова.
3. **Email уведомление** отображается как "Ссылка на отчёт отправлена на email", но фактически email не отправляется.

### Вывод

**Stub-режим реализован корректно на ~85%.** Основные пробелы:
- Report page не отображает keywords/competitors/minus_words (только issues)
- Нет rate limiting
- Нет статуса генерации файлов

### План доработки

**1. Расширить Report page — показать все секции полного отчёта**
- Добавить компонент `KeywordsSection` — отображение ключей по 4 секциям (SEO, Директ, Инфо, Таблица)
- Добавить компонент `MinusWordsSection` — общие + тематические
- Добавить компонент `CompetitorsTable` — сравнительная таблица
- В `SiteCheckReport.tsx` передавать `scan.keywords`, `scan.competitors`, `scan.minus_words` в новые компоненты

**2. Исправить лейблы кнопок**
- "Скачать PDF" → "↓ Скачать PDF"
- "Скачать DOCX" → "↓ Скачать Word"  
- "Ключи CSV" → "↓ Ключевые слова"
- "Минус-слова CSV" → "↓ Минус-слова"

**3. Убрать ложное сообщение об отправке email**
- Пока email не отправляется — не показывать блок "Ссылка отправлена на email"

### Файлы

| Файл | Изменение |
|---|---|
| `src/components/site-check/KeywordsSection.tsx` | Новый — отображение ключей по секциям |
| `src/components/site-check/MinusWordsSection.tsx` | Новый — отображение минус-слов |
| `src/components/site-check/CompetitorsTable.tsx` | Новый — сравнительная таблица |
| `src/pages/SiteCheckReport.tsx` | Добавить 3 новые секции, убрать ложный email блок |
| `src/components/site-check/DownloadButtons.tsx` | Обновить лейблы кнопок |

