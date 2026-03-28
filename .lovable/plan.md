

## БЛОК 4 — Безопасность и технический долг

### FIX 8: Безопасность админки

**Текущее состояние:** Хардкод `ADMIN_PASSWORD = "owndev2024"` в `AdminRules.tsx` (строка 13). Проверка через `localStorage("admin_auth") === "true"` — любой может вручную установить это значение и получить доступ.

**Решение:**
1. Создать Edge Function `admin-auth/index.ts`:
   - Принимает `{ password: string }`
   - Сравнивает с секретом `ADMIN_PASSWORD` из `Deno.env`
   - Возвращает `{ success: true, token: crypto.randomUUID() }` или `{ success: false }`
   - CORS headers

2. Добавить секрет `ADMIN_PASSWORD` через `add_secret`

3. В `AdminRules.tsx`:
   - Удалить `const ADMIN_PASSWORD = "owndev2024"`
   - `handleLogin` → вызов `supabase.functions.invoke('admin-auth', { body: { password } })`
   - Сохранять token в `sessionStorage` (не localStorage)
   - Проверять `sessionStorage.getItem('admin_token')` вместо `localStorage.getItem('admin_auth')`
   - Rate-limiting: state `attempts`, блокировка после 5 попыток на 60 секунд

### FIX 9: Аналитика (Яндекс.Метрика placeholder)

1. В `index.html` добавить placeholder-комментарий перед `</body>`:
   ```html
   <!-- YM_COUNTER_PLACEHOLDER -->
   ```

2. В `App.tsx` обернуть `<Routes>` в компонент `<AppRoutes>` с `useLocation` + `useEffect`:
   - При смене pathname вызывать `window.ym?.(YM_ID, 'hit', pathname)`
   - `YM_ID` = placeholder-константа (например 0), заменится позже

3. Создать утилиту `src/utils/analytics.ts`:
   ```typescript
   export const YM_ID = 0; // заменить на реальный ID
   export const ymGoal = (goal: string) => window.ym?.(YM_ID, 'reachGoal', goal);
   ```

4. Добавить вызовы `ymGoal` в:
   - `ScanForm.tsx` при submit → `ymGoal('scan_started')`
   - Все tool-компоненты при использовании → `ymGoal('tool_used')`
   - `PaywallCTA.tsx` при рендере → `ymGoal('paywall_reached')`
   - `SiteCheckResult.tsx` при отправке email → `ymGoal('email_submitted')`

### FIX 10: Мёртвый код

1. **tsparticles** — используется в `sparkles.tsx`, но `sparkles.tsx` нигде не импортируется → удалить файл `src/components/ui/sparkles.tsx`
2. **three / @types/three** — нигде не импортируются → удалить из dependencies в `package.json`
3. `meta viewport` уже есть в `index.html` (строка 5) — OK
4. Все импорты в `App.tsx` — прямые, не lazy — OK

### Файлы

| Файл | Действие |
|------|----------|
| `supabase/functions/admin-auth/index.ts` | Новый — Edge Function для проверки пароля |
| `src/pages/AdminRules.tsx` | Убрать хардкод, вызов edge function, rate-limit |
| `src/utils/analytics.ts` | Новый — YM_ID + ymGoal утилита |
| `src/App.tsx` | Хук отслеживания маршрутов для Метрики |
| `index.html` | Placeholder для счётчика ЯМ |
| `src/components/site-check/ScanForm.tsx` | ymGoal('scan_started') |
| `src/components/site-check/PaywallCTA.tsx` | ymGoal('paywall_reached') |
| `src/pages/SiteCheckResult.tsx` | ymGoal('email_submitted') |
| `src/components/ui/sparkles.tsx` | Удалить (мёртвый код) |
| `package.json` | Удалить three, @types/three |

### Секреты
- Нужно добавить `ADMIN_PASSWORD` через `add_secret`

