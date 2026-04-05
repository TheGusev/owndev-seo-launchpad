

## Добавить `tech_passport` в MCP Server + бейдж NEW

### Файлы

| Файл | Изменение |
|------|-----------|
| `supabase/functions/mcp-server/index.ts` | Добавить инструмент `tech_passport` — вызывает Edge Function `tech-passport` |
| `src/pages/Tools.tsx` | Добавить бейдж "NEW" рядом с MCP Server в карточке |

### 1. MCP: инструмент `tech_passport`

Новый `mcp.tool("tech_passport", ...)` между `generate_schema` и транспортом:
- **Input**: `{ url: string }` — URL сайта
- **Handler**: вызывает существующую Edge Function `tech-passport` через `fetch(SUPABASE_URL + "/functions/v1/tech-passport")` с `{ url }` в body
- **Возвращает** форматированный текст: CMS, фреймворк, сервер, CDN, рендеринг, аналитика, виджеты, WHOIS (регистратор, дата создания, срок), хостинг (IP, страна, провайдер)
- Обработка ошибок: если fetch упал — текст ошибки

### 2. Бейдж NEW на странице Tools

В `Tools.tsx`, строка ~152, после `<h3>` с названием инструмента — добавить условие:
```
{tool.slug === "mcp-server" && (
  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/20 text-primary">NEW</span>
)}
```

