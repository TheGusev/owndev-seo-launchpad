

## План: Финальная сквозная проверка системы (Промт #6)

Сейчас я в режиме плана и не могу запускать браузер/curl. После одобрения переключусь в обычный режим и выполню полную проверку всех 4 модулей по чек-листу ниже.

### Что буду проверять

**1. Site Check (`/tools/site-check`)**
- `navigate_to_sandbox` → `/tools/site-check`
- Ввод `https://owndev.ru`, клик «Проверить»
- Отслеживание `POST /api/v1/site-check/start` → должен вернуть 200/202 + `scan_id`
- Polling `GET /api/v1/site-check/status/:id` до `status=done`
- Переход на `/tools/site-check/result/:id`, проверка секций: SEO, Schema.org, LLM/AI, Скорость

**2. Site Formula (`/site-formula`)**
- Клик «Начать» → `/site-formula/wizard`
- Прохождение всех 4 шагов с выбором ответов
- Финальная кнопка → ожидание `POST /sessions/:id/answers` (200) и `POST /sessions/:id/run` (200)
- Переход на `/site-formula/preview?session=...`
- Проверка отображения: класс проекта, ключевые слои, риски

**3. Marketplace Audit (`/marketplace-audit`)**
- Выбор WB, ввод тестового URL/SKU
- Запуск аудита → `POST /api/v1/marketplace-audit/...`
- Ожидание прогресса и результата
- Проверка скоров (content, search, conversion, ads) и списка проблем
- Допустимо: пустой AI Summary (если нет LLM ключа)

**4. Geo Rating (`/geo-rating`)**
- Загрузка списка сайтов (Supabase `geo_rating`)
- Проверка фильтров по категории и скору

### Чек-лист консоли/сети для каждой страницы
- Нет ошибок: `Body cannot be empty`, `Failed to fetch`, `401`, `404`, `500`
- Все POST → 200/202
- Заголовки: `x-api-key` присутствует если есть `owndev_token` в localStorage; `Content-Type: application/json` только в POST с body

### Используемые инструменты
- `browser--navigate_to_sandbox` / `browser--act` / `browser--observe` — для прохода по сценариям
- `browser--list_network_requests` + `browser--get_network_request_details` — для проверки статусов и заголовков POST
- `browser--read_console_logs` — для отлова ошибок
- `supabase--read_query` — для проверки наполненности `geo_rating`

### Формат отчёта
По каждому модулю:
- ✅/❌ статус
- Если ❌ — точный текст ошибки, endpoint, HTTP-статус, скриншот при необходимости
- Финальная сводка: что работает, что требует правки

### Ограничения
- Тесты идут на preview-окружении Lovable (`*.lovable.app`), backend — `https://owndev.ru/api`. Если backend недоступен из preview (CORS/cold-start), отмечу это и предложу проверить production напрямую.
- Marketplace Audit без LLM ключа покажет пустой AI Summary — это ожидаемо, не баг.
- Если найду баг, остановлюсь и сообщу до фиксов (по правилу из инструкций).

