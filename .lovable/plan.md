

## End-to-end проверка Site Formula wizard

### Что нужно сделать

Пройти весь wizard в preview, заполнив все 4 шага, и убедиться что:
- Вопросы загружаются без 429
- Ответы сохраняются
- `POST /sessions/:id/run` отрабатывает
- Происходит редирект на `/site-formula/preview?session=...`
- На preview-странице отрисовывается `PreviewCard` без ошибок

### План действий (default mode)

1. **`browser--navigate_to_sandbox`** → `/site-formula/wizard` (viewport 1325x887)
2. **`browser--screenshot`** + **`browser--read_console_logs`** — убедиться что 1-й шаг загрузился без ошибок
3. **`browser--list_network_requests`** — проверить `GET /questions` → 200, `POST /sessions` → 200
4. **`browser--observe`** — выяснить какие опции есть на 1-м шаге
5. **Шаг 1**: `browser--act` кликнуть по первому варианту каждого вопроса → нажать "Далее"
6. **Шаг 2**: `observe` → `act` (для multi выбрать минимум 1) → "Далее"
7. **Шаг 3**: `observe` → `act` → "Далее"
8. **Шаг 4**: `observe` → `act` → нажать финальную кнопку "Получить результат"/"Запустить"
9. **`browser--get_url`** — подтвердить что URL изменился на `/site-formula/preview?session=...`
10. **`browser--screenshot`** + **`browser--read_console_logs`** — финальная проверка preview-страницы
11. **`browser--list_network_requests`** — убедиться что `POST /answers` и `POST /run` вернули 200

### Реакция на проблемы

- **429 на любом запросе** → стоп, докладываю, проверяем `dist/` через `code--view`
- **401 на POST `/sessions` или `/run`** → анонимный POST блокируется auth → разбираем `authMiddleware` и whitelist
- **PreviewCard крашится** → беру стек из консоли, фиксим отдельным правкой
- **`act` не находит кнопку "Далее"** → пробую structured mode через `observe` → `click` по `backendNodeId`
- **Если 4-й шаг не запускает engine** → проверю `WizardNavigation.tsx` чтобы понять текст финальной кнопки и onSubmit

### Что НЕ трогаем

- Backend (всё задеплоено и работает)
- Frontend код (если не найдём баг — ничего не правим)
- Ничего не оплачиваем, реальных операций не совершаем (wizard — read-only по сути)

### Итог

После прохождения отчитаюсь: что нажимал, какие запросы прошли, дошёл ли до preview, есть ли ошибки в консоли. Если найду баг — стоп и фикс отдельным шагом.

