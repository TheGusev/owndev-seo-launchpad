import { useState } from "react";
import { Check, Copy, Plug, Search, FileCode, Code2, Terminal, Zap, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const MCP_URL = `${import.meta.env.VITE_API_BASE_URL || '/api'}/v1/mcp-server/mcp`;

const configJson = `{
  "mcpServers": {
    "owndev": {
      "url": "${MCP_URL}",
      "description": "GEO и AI-ready аудит сайта"
    }
  }
}`;

const mcpTools = [
  {
    name: "geo_audit",
    icon: Search,
    description: "Запускает полный GEO и AI-ready аудит сайта. Возвращает SEO Score, LLM Score, Schema Score, список ошибок и рекомендации.",
    input: '{ "url": "https://example.com" }',
    prompts: [
      "Проверь GEO-готовность сайта example.com",
      "Сделай SEO-аудит mysite.ru и покажи ошибки",
      "Какой LLM Score у сайта example.com?",
    ],
  },
  {
    name: "check_llms_txt",
    icon: FileCode,
    description: "Проверяет наличие и валидность файла llms.txt на сайте. Показывает содержимое и рекомендации.",
    input: '{ "url": "https://example.com" }',
    prompts: [
      "Есть ли llms.txt на mysite.ru?",
      "Проверь файл llms.txt для example.com",
    ],
  },
  {
    name: "generate_schema",
    icon: Code2,
    description: "Генерирует JSON-LD Schema.org разметку для сайта. Поддерживает: Organization, LocalBusiness, FAQPage, Article, Product, SoftwareApplication.",
    input: '{ "url": "https://example.com", "type": "Organization" }',
    prompts: [
      "Сгенерируй FAQ Schema.org для mysite.ru",
      "Создай разметку LocalBusiness для example.com",
    ],
  },
];

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl border border-border/50 bg-muted/30 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
        <span className="text-xs font-mono text-muted-foreground">{lang}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 gap-1.5 text-xs"
        >
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Скопировано" : "Копировать"}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const MCPServerDocs = () => {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5">
          <Plug className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground font-mono">Model Context Protocol</span>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
          Подключите OWNDEV к Claude Desktop, ChatGPT или любому MCP-совместимому клиенту.
          Запускайте GEO-аудит прямо из чата с AI.
        </p>
      </motion.div>

      {/* Quick Start */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-serif text-foreground">Быстрый старт</h2>
        </div>
        <div className="glass rounded-2xl p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Добавьте в настройки Claude Desktop (<code className="text-primary font-mono text-xs">claude_desktop_config.json</code>):
          </p>
          <CodeBlock code={configJson} />
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>После добавления перезапустите Claude Desktop. Инструменты OWNDEV появятся автоматически.</span>
          </div>
        </div>
      </motion.section>

      {/* Available tools */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-serif text-foreground">Доступные инструменты</h2>
        </div>
        <div className="grid gap-4">
          {mcpTools.map((tool, i) => (
            <motion.div
              key={tool.name}
              className="glass rounded-2xl p-6 space-y-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <tool.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold font-mono text-foreground text-base">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Input</span>
                <CodeBlock code={tool.input} />
              </div>

              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Примеры промтов</span>
                <div className="flex flex-wrap gap-2">
                  {tool.prompts.map((p) => (
                    <span key={p} className="text-xs bg-muted/50 border border-border/30 rounded-full px-3 py-1.5 text-muted-foreground">
                      "{p}"
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* API endpoint */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Code2 className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-xl font-bold font-serif text-foreground">API</h2>
        </div>
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-xs font-bold">POST</span>
            <code className="font-mono text-sm text-foreground break-all">{MCP_URL}</code>
          </div>
          <p className="text-sm text-muted-foreground">
            Протокол: MCP Streamable HTTP. Rate limit: 10 запросов/мин на IP.
          </p>
          <CodeBlock
            code={`// Пример вызова
POST ${MCP_URL}
Content-Type: application/json
Accept: application/json, text/event-stream

{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "geo_audit",
    "arguments": { "url": "https://example.com" }
  },
  "id": 1
}`}
            lang="http"
          />
        </div>
      </motion.section>
    </div>
  );
};

export default MCPServerDocs;
