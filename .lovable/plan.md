

## Сохранение пароля админки и реализация Блока 4

### Шаг 1: Добавить секрет ADMIN_PASSWORD
Сохранить значение `Westmax324252` как секрет `ADMIN_PASSWORD` в backend.

### Шаг 2: Создать Edge Function `admin-auth/index.ts`
- Принимает `{ password: string }`
- Сравнивает с секретом `ADMIN_PASSWORD` из `Deno.env`
- Возвращает `{ success: true, token: randomUUID() }` или `{ success: false }`
- CORS headers

### Шаг 3: Обновить `AdminRules.tsx`
- Удалить хардкод `ADMIN_PASSWORD = "owndev2024"`
- `handleLogin` → `supabase.functions.invoke('admin-auth', { body: { password } })`
- `sessionStorage` вместо `localStorage`
- Rate-limit: 5 попыток, блокировка 60 сек

### Шаг 4: Аналитика
- Создать `src/utils/analytics.ts` с `ymGoal()`
- Placeholder счётчика в `index.html`
- Трекинг маршрутов в `App.tsx`
- Цели: `scan_started`, `tool_used`, `paywall_reached`, `email_submitted`

### Шаг 5: Очистка мёртвого кода
- Удалить `sparkles.tsx`
- Удалить `three`, `@types/three` из `package.json`

### Файлы

| Файл | Действие |
|------|----------|
| `supabase/functions/admin-auth/index.ts` | Новый |
| `src/pages/AdminRules.tsx` | Переписать авторизацию |
| `src/utils/analytics.ts` | Новый |
| `src/App.tsx` | Трекинг маршрутов |
| `index.html` | Placeholder ЯМ |
| `src/components/site-check/ScanForm.tsx` | ymGoal |
| `src/components/site-check/PaywallCTA.tsx` | ymGoal |
| `src/pages/SiteCheckResult.tsx` | ymGoal |
| `src/components/ui/sparkles.tsx` | Удалить |
| `package.json` | Убрать three, tsparticles |

