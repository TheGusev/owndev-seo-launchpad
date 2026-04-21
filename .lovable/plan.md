

## Цель
Сделать поллинг `getScanStatus` адаптивным — реже опрашивать бэкенд на медленных стадиях. Сейчас фиксированный `setTimeout(poll, 2000)` = постоянно 2 сек, на ошибке 3 сек.

## Логика интервалов

Опираемся на две метрики:
1. **Elapsed** — сколько секунд прошло с момента старта (`startedAt`).
2. **Текущая стадия** по `progress_pct` — медленные LLM-этапы это `pct ∈ [60, 85)` (Анализ конкурентов 75% и Семантическое ядро 85%) и стадия Theme detection около 20%.

```ts
function getPollInterval(elapsedMs: number, progressPct: number): number {
  // Первые 10 секунд — 1 сек (быстрые ранние стадии 5/10/20/35)
  if (elapsedMs < 10_000) return 1000;
  // Медленные LLM-стадии (Theme≈20%, Competitors≈75%, Keywords≈85%) — 3 сек
  if ((progressPct >= 15 && progressPct < 35) || (progressPct >= 60 && progressPct < 95)) return 3000;
  // Всё остальное — 2 сек
  return 2000;
}
```

После `error` в catch — оставляем 3 сек (как сейчас, временная ошибка сети не должна спамить).

## Файлы

| Файл | Действие |
|---|---|
| `src/pages/SiteCheck.tsx` | **Edit** — внутри `pollStatus` (строки 121–142) считать `elapsedMs = Date.now() - (startedAt ?? Date.now())`, передавать в `getPollInterval(elapsedMs, status.progress_pct)`, использовать результат в `setTimeout(poll, interval)`. Доступ к `startedAt` — через `useRef` (или захват через closure, так как `startedAt` стейтится в `handleSubmit`). Чтобы не было устаревшего значения в callback, используем `startedAtRef = useRef<number>()` и обновляем его в `handleSubmit` синхронно с `setStartedAt`. |

## Что НЕ трогаем
- `ScanProgress.tsx` — индикация heartbeat и стадий уже корректна.
- Backend (`/site-check/status/:id`) — никаких изменений.
- Header / Footer / маршруты.
- Поведение при `done` / `error` — переход на result / показ ошибки.

## Проверка
1. Открыть DevTools → Network, фильтр по `status/`.
2. Запустить проверку крупного сайта (например `vk.ru`).
3. Первые ~10 сек запросы каждые 1 сек.
4. На стадиях 60–95% (Анализ конкурентов / Семантика) интервал 3 сек.
5. На остальных — 2 сек.
6. Завершение и переход на `/result/:id` работает как раньше.

