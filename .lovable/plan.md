

## MCP Server для OWNDEV — подключение к AI-агентам

### Обзор

Создать MCP-совместимый сервер как Supabase Edge Function + документационную страницу. AI-агенты (Claude Desktop, ChatGPT) смогут программно запускать аудит через OWNDEV.

### Файлы

| Файл | Действие |
|------|----------|
| `supabase/functions/mcp-server/index.ts` | Новая Edge Function — MCP Streamable HTTP сервер через mcp-lite + Hono |
| `src/components/tools/MCPServerDocs.tsx` | Новый компонент — документация с примерами и блоками кода |
| `src/data/tools-registry.ts` | Добавить запись `mcp-server` |
| `src/pages/Tools.tsx` | Добавить `mcp-server` в `TECHNICAL_SLUGS` |

### 1. Edge Function `mcp-server` (mcp-lite)

Используем **mcp-lite** (npm:mcp-lite@^0.10.0) + Hono для создания MCP Streamable HTTP сервера. Три инструмента:

**geo_audit** — запускает сканирование через существующую логику `site-check-scan`:
- Вызывает `site-check-scan/start` внутренне (fetch к самому себе через SUPABASE_URL)
- Поллит `site-check-scan/status` каждые 3с до завершения
- Возвращает полные результаты из таблицы `scans`

**check_llms_txt** — проверяет наличие и валидность `llms.txt`:
- Fetch `{domain}/llms.txt` и `{domain}/llms-full.txt`
- Парсит содержимое, проверяет структуру
- Возвращает статус, содержимое, рекомендации

**generate_schema** — генерирует JSON-LD разметку:
- Принимает URL + тип Schema.org
- Генерирует шаблон разметки на основе типа
- Возвращает готовый JSON-LD код

**Rate limiting**: In-memory Map по IP, 10 запросов/минуту, 429 при превышении.

**Конфигурация**: Добавить `deno.json` рядом с `index.ts` для import map mcp-lite. Или использовать inline import из npm.

### 2. MCPServerDocs.tsx (~300 строк)

Документационная страница в стиле developer docs:

**Hero**: "MCP Server — подключите OWNDEV к AI-агентам" + подзаголовок

**Быстрый старт**: Блок кода `claude_desktop_config.json` с кнопкой "Копировать":
```json
{
  "mcpServers": {
    "owndev": {
      "url": "https://chrsibijgyihualqlabm.supabase.co/functions/v1/mcp-server",
      "description": "GEO и AI-ready аудит сайта"
    }
  }
}
```

**Доступные инструменты**: 3 glass-карточки с описанием, inputSchema и примером промта

**Примеры промтов**: Список готовых фраз для Claude/ChatGPT

**Стиль**: Dark theme, моноширинный шрифт для кода, подсветка синтаксиса через `<pre><code>` с ручной стилизацией (cyan для ключей, green для строк). Кнопки копирования с бирюзовым акцентом.

### 3. Registry + роутинг

- Новая запись в `tools-registry.ts`: `id: "mcp-server"`, slug `mcp-server`, category `"webmaster"`, icon `Plug` (lucide-react)
- SEO поля: title, description, h1
- Добавить в `TECHNICAL_SLUGS` на странице Tools

### Детали Edge Function

```typescript
import { Hono } from "https://deno.land/x/hono@v4.4.0/mod.ts";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";

const app = new Hono();
const rateLimitMap = new Map<string, number[]>();

const mcpServer = new McpServer({ name: "owndev", version: "1.0.0" });

mcpServer.tool({
  name: "geo_audit",
  description: "Запускает полный GEO и AI-ready аудит сайта...",
  inputSchema: { type: "object", properties: { url: { type: "string" }, theme: { type: "string" } }, required: ["url"] },
  handler: async ({ url, theme }) => {
    // 1. Call site-check-scan/start internally
    // 2. Poll status every 3s (max 120s)
    // 3. Fetch full results from scans table
    // Return structured text result
  }
});

// Similar for check_llms_txt, generate_schema

const transport = new StreamableHttpTransport();
app.all("/*", async (c) => {
  // Rate limit check
  return await transport.handleRequest(c.req.raw, mcpServer);
});

Deno.serve(app.fetch);
```

