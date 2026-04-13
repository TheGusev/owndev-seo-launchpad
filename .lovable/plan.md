

## Интеграция ЮKassa + обновление юридических документов

### Обзор

Три блока работ:
1. **Edge function для ЮKassa** — создание платежа и обработка webhook
2. **Frontend** — PaywallCTA → модал оплаты → перенаправление на ЮKassa
3. **Юридические страницы** — обновление с ИНН 511007293446, данными ИП, ShopID 1308372

### Данные продавца (используются во всех документах)

```
ИП — ИНН 511007293446
Email: west-centro@mail.ru
Телефон: +7 993 928-94-88
Telegram: @one_help
Сайт: owndev.ru
Платёжная система: ЮKassa (ShopID: 1308372)
```

---

### Backend — 2 edge functions

#### 1. `supabase/functions/yukassa-create-payment/index.ts`

Создаёт платёж через ЮKassa API:
- Принимает: `scan_id`, `email`, `url` (сайт для проверки)
- Создаёт запись в `reports` с `payment_status = 'pending'`
- Вызывает `https://api.yookassa.ru/v3/payments` с Basic Auth (ShopID + Secret Key)
- Сумма: 1490.00 RUB
- `confirmation.type = "redirect"`, `return_url` = страница результата
- `metadata`: `report_id`, `scan_id`, `email`
- Возвращает `payment_url` (confirmation.confirmation_url)

Секрет `YUKASSA_SECRET_KEY` — нужно будет добавить после получения ключа от ЮKassa. Пока функция будет готова, но вернёт ошибку если ключ не задан.

#### 2. `supabase/functions/yukassa-webhook/index.ts`

Webhook для получения уведомлений от ЮKassa:
- Принимает POST от ЮKassa (event `payment.succeeded`)
- Проверяет `payment.status === 'succeeded'`
- Обновляет `reports.payment_status = 'paid'`, `payment_id = payment.id`
- Запускает full scan для `scan_id` (если ещё не запущен)
- Отправляет уведомление в Telegram

Важно: `verify_jwt = false` для webhook (ЮKassa не шлёт JWT).

#### 3. Обновить `supabase/functions/site-check-report/index.ts`

- Убрать stub `payment_status: 'paid'`
- При создании ставить `payment_status: 'pending'`
- Вместо stub payment_url — вызывать `yukassa-create-payment`

---

### Frontend — 3 файла

#### 4. `src/components/site-check/PaymentModal.tsx` (новый)

Модал оплаты перед полным аудитом:
- Поле email (обязательное)
- Стоимость: 1 490 ₽
- Кнопка "Оплатить через ЮKassa"
- При клике: вызвать edge function `yukassa-create-payment` → редирект на `payment_url`
- Логотипы: Visa, MasterCard, МИР, SBP
- Ссылки внизу: Оферта, Политика возврата

#### 5. `src/components/site-check/PaywallCTA.tsx` (обновить)

- Изменить текст кнопки: "Получить полный аудит — 1 490 ₽"
- Убрать "Бесплатно · 30-60 сек"
- `onUnlock` теперь открывает `PaymentModal` вместо прямого перезапуска скана
- Добавить подпись: "Оплата через ЮKassa · Visa, МИР, SBP"

#### 6. `src/pages/SiteCheckResult.tsx` (обновить)

- Добавить state для PaymentModal (open/close)
- `handleUnlock` → открывать PaymentModal с `url={data.url}`, `scanId={scanId}`
- После успешной оплаты (возврат с ЮKassa) — показать full-результат

---

### Юридические страницы — 4 файла

#### 7. `src/pages/Privacy.tsx` — полная переработка

Обновить:
- Оператор: ИП, ИНН 511007293446
- Добавить раздел про обработку данных через ЮKassa (платёжные данные обрабатывает ЮKassa, не Оператор)
- Добавить раздел про cookies и аналитику (Яндекс.Метрика)
- Обновить дату вступления в силу
- Привести в соответствие с ФЗ-152

#### 8. `src/pages/Terms.tsx` — обновить реквизиты

- Раздел 13 "Реквизиты": добавить ИНН 511007293446
- Раздел 6 "Оплата": добавить оплату через ЮKassa для онлайн-услуг (полный аудит 1490 ₽)
- Обновить раздел 3 "Услуги": добавить "Полный GEO-аудит сайта (онлайн-услуга)"

#### 9. `src/pages/Offer.tsx` — обновить

- Добавить реквизиты ИП с ИНН
- Обновить пункт 3 (стоимость): 1 490 ₽, оплата через ЮKassa
- Уточнить, что платёжные данные обрабатывает ЮKassa (НБД «Банк»)
- Обновить дату

#### 10. `src/pages/Refund.tsx` — обновить

- Добавить: возврат через ЮKassa в течение 10 рабочих дней (по закону о защите прав потребителей)
- Указать ИП и ИНН
- Обновить контакты

---

### Секреты

Нужно будет добавить секрет `YUKASSA_SECRET_KEY` после получения ключа от ЮKassa. ShopID (1308372) будет захардкожен в коде edge function (это не секрет).

### Не меняем

- Backend pipeline (SiteCheckPipeline.ts, SiteCheckWorker.ts)
- API контракты существующих эндпоинтов
- Логику basic/full scan mode
- Существующие компоненты (KeywordsSection, CompetitorsTable и др.)

### Порядок реализации

1. Edge functions (yukassa-create-payment, yukassa-webhook)
2. Frontend (PaymentModal, PaywallCTA, SiteCheckResult)
3. Юридические страницы (Privacy, Terms, Offer, Refund)

