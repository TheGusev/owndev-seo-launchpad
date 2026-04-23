

## Авто-очистка `scan_id` перед новым аудитом

### Цель
При каждом новом запуске аудита из формы — гарантированно стартовать «с нуля». Никогда не подцеплять старый `scan_id` из `localStorage` или URL.

### Что меняю

**1. `src/components/site-check/ScanForm.tsx` — точка входа**

В `handleSubmit`, перед вызовом `onSubmit(...)`, добавить блок очистки:
- `localStorage.removeItem('owndev_scan_id')` (и любые `*scan_id*` ключи — пройду по `Object.keys(localStorage)` и удалю всё, что матчит `/scan_id$/i`)
- Очистить query-параметр `?scan_id=` через `URLSearchParams` + `window.history.replaceState` (без перезагрузки страницы)
- `localStorage.removeItem('owndev_last_scan_url')` — если такой ключ используется для автодокачки старого результата

Это происходит **только** при ручном сабмите формы. Прямые ссылки `/site-check/result/:id` продолжают работать — они используют `:id` из URL pathname, а не query.

**2. `src/pages/SiteCheck.tsx` — страница со сканером**

В `useEffect` инициализации:
- Если в URL есть `?scan_id=` **И** пользователь пришёл «свежим» (нет `state.fromResult` в `location.state`), параметр игнорируется и удаляется из URL.
- Авто-сабмит по `?url=...&force=1` (уже работает) — оставляю, но перед ним точно так же чищу `scan_id`.

**3. Утилита `src/utils/lastUrl.ts` (или новый `src/utils/scanSession.ts`)**

Добавить функцию `clearScanSession()`:
```ts
export function clearScanSession() {
  // localStorage: всё, что заканчивается на scan_id
  Object.keys(localStorage)
    .filter(k => /scan_?id$/i.test(k))
    .forEach(k => localStorage.removeItem(k));

  // URL: вычистить ?scan_id=
  const url = new URL(window.location.href);
  if (url.searchParams.has('scan_id')) {
    url.searchParams.delete('scan_id');
    window.history.replaceState({}, '', url.toString());
  }
}
```

Использовать её в обоих местах выше — единая точка правды, легко расширить.

### Что НЕ трогаю

- **`SiteCheckResult.tsx`** — туда заходят либо по прямой ссылке `/result/:id` (нужен этот id), либо после успешного `POST /start` (получают новый id). Логику не меняю.
- **`scanHistory`** (`src/utils/scanHistory.ts`) — это история для UI «недавно проверял», не источник «зомби» сканов. Оставляю.
- **react-query кэш** — он привязан к `scan_id`, а раз id всегда новый, старые результаты сами «протухнут».

### Файлы

- `src/utils/scanSession.ts` — **новый**, экспорт `clearScanSession()`.
- `src/components/site-check/ScanForm.tsx` — вызов `clearScanSession()` в начале `handleSubmit`.
- `src/pages/SiteCheck.tsx` — вызов `clearScanSession()` при инициализации, если нет явного намерения открыть конкретный scan.

### Проверка
1. Запустить аудит `example.ru` → запомнить `scan_id` в URL/localStorage.
2. Не закрывая страницу, ввести `another.ru` → сабмит.
3. Убедиться: `?scan_id=` исчез из URL до запроса, в Network видно свежий `POST /start`, в результате — данные `another.ru`, не `example.ru`.

