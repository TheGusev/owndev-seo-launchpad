

## Заглушка оплаты — toast вместо редиректа

### Изменение

**`src/pages/SiteCheckResult.tsx`** — заменить функцию `handlePay`:

Было: вызов `createReport` → redirect на report page (зависает)

Станет: показ toast "Скоро будет доступно" без API-вызовов и редиректов. Состояние `paying` не меняется, кнопка остаётся активной.

Также можно убрать неиспользуемые импорты (`createReport`, `navigate`, `paying`/`setPaying`).

1 файл, 1 правка.

