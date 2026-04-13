

## Точечная зачистка legacy Supabase references

### Audit Table

| Файл | Что найдено | Runtime? | Безопасно удалить? | Чем заменить | Риск |
|---|---|---|---|---|---|
| `src/components/tools/MCPServerDocs.tsx` | `VITE_SUPABASE_PROJECT_ID`, строит URL `https://{ID}.supabase.co/functions/v1/mcp-server/mcp` | Нет, только UI-документация | ✅ Да | `VITE_API_BASE_URL` + `/mcp-server/mcp` | Нулевой |
| `src/lib/api/client.ts` | `invokeFunction()` — экспортируется, но **нигде не импортируется** | Нет (0 потребителей) | ✅ Да | Удалить функцию, оставить `request()` | Нулевой |
| `src/lib/api/client.ts` | Комментарий «invokeFunction» в JSDoc | Нет | ✅ Да | Обновить комментарий | Нулевой |
| `src/pages/Academy.tsx` | `import { supabase }` — запросы к `academy_lessons` | **Да, активный runtime** | ❌ Нельзя | — | Сломает Академию |
| `src/pages/AcademyLesson.tsx` | `import { supabase }` — запросы к `academy_lessons` | **Да, активный runtime** | ❌ Нельзя | — | Сломает урок |
| `src/integrations/supabase/client.ts` | Авто-генерируемый файл | Runtime | ❌ Нельзя | — | Запрещено редактировать |

### План изменений (3 файла)

**1. `src/components/tools/MCPServerDocs.tsx`**
- Удалить `const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID`
- Заменить `MCP_URL` на: `const MCP_URL = \`\${import.meta.env.VITE_API_BASE_URL || '/api'}/v1/mcp-server/mcp\``
- Обновить пример API-вызова в документации (POST URL)
- Логика и UI-структура не меняются

**2. `src/lib/api/client.ts`**
- Удалить функцию `invokeFunction()` (0 потребителей в кодовой базе)
- Обновить JSDoc-комментарий модуля (убрать упоминание invokeFunction)
- Оставить `request()` без изменений

**3. Не трогаем**
- `Academy.tsx`, `AcademyLesson.tsx` — активный runtime через supabase client
- `src/integrations/supabase/*` — авто-генерируемые файлы
- `owndev-backend/scripts/*` — миграционные скрипты, не frontend

