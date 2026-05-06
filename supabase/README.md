# Supabase folder — LEGACY / DO NOT EXTEND

**Status:** архитектурно отключено. Активный backend живёт в `owndev-backend/` (Fastify + own PostgreSQL + Redis + BullMQ on Ubuntu 155.212.188.244).

## Что здесь

- `migrations/` — исторические миграции, оставлены для справки
- `functions/` — старые Supabase Edge Functions (geo-rating-cron, llm-judge, mcp-server, site-check-report, site-check-scan, tech-passport). **Не разворачиваются**, их функционал перенесён в `owndev-backend/src/services/` и `workers/`.
- `config.toml` — конфиг Supabase CLI

## Правила

1. **Не добавлять сюда новый код.** Любые новые серверные функции — только в `owndev-backend/`.
2. **Не импортировать `@/integrations/supabase/client` в новых компонентах фронта.** Все новые fetch-запросы идут в `src/lib/api/*` и бьют в свой backend.
3. Если функционал из Edge Function ещё не перенесён — переносить в `owndev-backend/src/services/` или `routes/`, а не дописывать здесь.

## Что осталось активным во фронте

`src/integrations/supabase/client.ts` создаёт Supabase-клиент при загрузке (для совместимости с уже задеплоенным кодом). При полной чистке (отдельный PR с проверкой Lovable-CI) этот файл и зависимость `@supabase/supabase-js` удаляются.

## Очистка (план отдельного PR)

```bash
# 1. Убедиться, что нет импортов Supabase в src/
grep -rn "from '@/integrations/supabase" src/

# 2. Удалить
rm -rf src/integrations/supabase
rm -rf supabase/
npm uninstall @supabase/supabase-js

# 3. Проверить build
npm run build
```
