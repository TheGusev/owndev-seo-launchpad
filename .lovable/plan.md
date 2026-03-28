

## Блок 4 — доделка (3 задачи)

### 1. Аналитика

**Новый файл `src/utils/analytics.ts`:**
- Функция `ymGoal(goal: string)` — вызывает `window.ym(COUNTER_ID, 'reachGoal', goal)` если доступно
- Функция `ymHit(url: string)` — для трекинга маршрутов

**`index.html`** — добавить placeholder-комментарий для счётчика ЯМ перед `</body>`.

**`src/App.tsx`** — добавить хук `useEffect` + `useLocation` для вызова `ymHit` при смене маршрута.

**Цели в компонентах:**
- `ScanForm.tsx` → `ymGoal('scan_started')` в `handleSubmit`
- `PaywallCTA.tsx` → `ymGoal('paywall_reached')` при клике "Получить полный отчёт", `ymGoal('email_submitted')` при отправке email
- `SiteCheckResult.tsx` → `ymGoal('email_submitted')` в dialog submit

### 2. Удаление мёртвого кода

**`src/components/ui/sparkles.tsx`** — удалить файл. Компонент `SparklesCore` нигде не импортируется (все `Sparkles` в проекте — это иконка из `lucide-react`, не этот файл).

### 3. Очистка зависимостей

**`package.json`** — удалить:
- `three`
- `@types/three`
- `@tsparticles/react`
- `@tsparticles/slim`

Эти пакеты используются только в удаляемом `sparkles.tsx`.

### Файлы

| Файл | Действие |
|------|----------|
| `src/utils/analytics.ts` | Новый |
| `index.html` | Placeholder ЯМ |
| `src/App.tsx` | useLocation трекинг |
| `src/components/site-check/ScanForm.tsx` | ymGoal |
| `src/components/site-check/PaywallCTA.tsx` | ymGoal |
| `src/pages/SiteCheckResult.tsx` | ymGoal |
| `src/components/ui/sparkles.tsx` | Удалить |
| `package.json` | Убрать 4 пакета |

