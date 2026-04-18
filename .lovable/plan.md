

## План: фикс TS-ошибок компиляции backend

### Root cause

При прошлом рефакторинге `getLlmConfig()` в `owndev-backend/src/services/SiteCheckPipeline.ts`:

1. Удалил константу `LLM_PROVIDER`, но 4 ссылки на неё остались в `logger.error(...)` (строки 336, 342, 361, 372).
2. `getLlmConfig()` возвращает union двух объектов с разными optional-полями (`x-proxy-secret?` vs `Authorization?`). TypeScript считает что `Authorization` может быть `undefined`, а `Record<string, string>` запрещает `undefined`.

### Фикс (один файл, ~10 строк)

**`owndev-backend/src/services/SiteCheckPipeline.ts`**:

1. Вернуть константу `LLM_PROVIDER` рядом с `getLlmConfig()`:
   ```ts
   const LLM_PROVIDER = process.env.EDGE_FUNCTION_URL ? 'proxy' : 'gateway';
   ```

2. Привести return-тип `getLlmConfig()` к единой форме `Record<string, string>` для headers — явно типизировать:
   ```ts
   function getLlmConfig(apiKey: string): { url: string; headers: Record<string, string>; defaultModel: string } {
     // ... тело без изменений
   }
   ```
   Это уберёт union-проблему, потому что TypeScript перестанет выводить взаимоисключающие optional-ключи и просто увидит общий `Record<string, string>`.

### Что НЕ меняем

- Никакой бизнес-логики — ни LLM-calls, ни pipeline scoring, ни breakdown.
- Frontend не трогаем вообще.
- Engine, Site Formula, миграции — не трогаем.

### Команда деплоя (только бэк)

```bash
cd /var/www/owndev.ru && git pull origin main && \
cd /var/www/owndev.ru/owndev-backend && npm run build && pm2 restart owndev-backend && \
pm2 status && pm2 logs owndev-backend --lines 30 --nostream
```

Фронт пересобирать не нужно — он уже собрался в прошлом раунде до падения бэка.

Также хорошо бы выкинуть старый stash (если он не нужен):
```bash
cd /var/www/owndev.ru && git stash drop
```

### Self-check

- ✅ TS6 ошибок: 4 на `LLM_PROVIDER` → возвращаем константу; 2 на `config.headers` → явный тип.
- ✅ Логика LLM-calls идентична — только типы.
- ✅ Билд пройдёт, pm2 рестартанёт чисто.

