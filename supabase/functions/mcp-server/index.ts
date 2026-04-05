import { Hono } from "npm:hono@4.6.14";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < 60_000);
  if (recent.length >= 10) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

function apiHeaders() {
  return { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY };
}

const mcp = new McpServer({ name: "owndev", version: "1.0.0" });

// Tool 1: geo_audit
mcp.tool("geo_audit", {
  description: "Запускает полный GEO и AI-ready аудит сайта. Возвращает SEO Score, LLM Score, Schema Score, список ошибок и рекомендации.",
  inputSchema: {
    type: "object" as const,
    properties: {
      url: { type: "string" as const, description: "URL сайта для проверки" },
      theme: { type: "string" as const, description: "Тематика сайта (опционально)" },
    },
    required: ["url"] as const,
  },
  handler: async (args: { url: string; theme?: string }) => {
    try {
      const startResp = await fetch(`${SUPABASE_URL}/functions/v1/site-check-scan/start`, {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({ url: args.url, mode: "page" }),
      });
      if (!startResp.ok) {
        const err = await startResp.text();
        return { content: [{ type: "text" as const, text: `Ошибка: ${err}` }] };
      }
      const { scan_id } = await startResp.json();

      let elapsed = 0;
      let status = "pending";
      while (elapsed < 120_000 && status !== "done" && status !== "error") {
        await new Promise((r) => setTimeout(r, 3000));
        elapsed += 3000;
        const sr = await fetch(`${SUPABASE_URL}/functions/v1/site-check-scan/status/${scan_id}`, { headers: apiHeaders() });
        if (sr.ok) { status = (await sr.json()).status; } else { await sr.text(); }
      }

      if (status !== "done") {
        return { content: [{ type: "text" as const, text: `Не завершено за 120с. scan_id: ${scan_id}` }] };
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: scan } = await supabase.from("scans").select("*").eq("id", scan_id).maybeSingle();
      if (!scan) return { content: [{ type: "text" as const, text: "Ошибка получения результатов." }] };

      const scores = scan.scores as Record<string, number> | null;
      const issues = (scan.issues as Array<{ severity: string; title: string; how_to_fix: string }>) ?? [];
      const critical = issues.filter((i) => i.severity === "critical" || i.severity === "high");

      const text = [
        `# GEO-аудит: ${scan.url}`,
        "", "## Скоры",
        `- SEO Score: ${scores?.seo ?? "—"}/100`,
        `- LLM Score: ${scores?.ai ?? "—"}/100`,
        `- Schema Score: ${scores?.schema ?? "—"}/100`,
        `- Директ Score: ${scores?.direct ?? "—"}/100`,
        `- Общий балл: ${scores?.total ?? "—"}/100`,
        "", `## Тематика: ${scan.theme || "не определена"}`,
        "", `## Критические ошибки (${critical.length})`,
        ...critical.slice(0, 10).map((i, idx) => `${idx + 1}. ${i.title} (${i.severity}) → ${i.how_to_fix}`),
        "", `Всего ошибок: ${issues.length}`,
        `Отчёт: https://owndev.ru/site-check/result/${scan_id}`,
      ].join("\n");

      return { content: [{ type: "text" as const, text }] };
    } catch (e) {
      return { content: [{ type: "text" as const, text: `Ошибка: ${(e as Error).message}` }] };
    }
  },
});

// Tool 2: check_llms_txt
mcp.tool("check_llms_txt", {
  description: "Проверяет наличие и валидность файла llms.txt на сайте",
  inputSchema: {
    type: "object" as const,
    properties: {
      url: { type: "string" as const, description: "Домен для проверки" },
    },
    required: ["url"] as const,
  },
  handler: async (args: { url: string }) => {
    let domain: string;
    try {
      const u = new URL(args.url.startsWith("http") ? args.url : `https://${args.url}`);
      domain = u.origin;
    } catch {
      return { content: [{ type: "text" as const, text: "Некорректный URL." }] };
    }

    const results: string[] = [`# Проверка llms.txt: ${domain}`, ""];
    for (const file of ["llms.txt", "llms-full.txt"]) {
      try {
        const resp = await fetch(`${domain}/${file}`, { headers: { "User-Agent": "OWNDEV-MCP/1.0" }, redirect: "follow" });
        if (resp.ok) {
          const text = await resp.text();
          const lines = text.split("\n").filter((l) => l.trim());
          results.push(`## ✅ ${file} найден`, `- ${text.length} символов, ${lines.length} строк`, "```", ...lines.slice(0, 5), "```", "");
        } else {
          results.push(`## ❌ ${file} — HTTP ${resp.status}`);
          await resp.text();
          results.push("");
        }
      } catch (e) {
        results.push(`## ❌ ${file} — ${(e as Error).message}`, "");
      }
    }
    results.push("## Рекомендации", "- Создайте llms.txt для AI-краулеров: https://llmstxt.org/");
    return { content: [{ type: "text" as const, text: results.join("\n") }] };
  },
});

// Tool 3: generate_schema
mcp.tool("generate_schema", {
  description: "Генерирует JSON-LD Schema.org разметку для сайта",
  inputSchema: {
    type: "object" as const,
    properties: {
      url: { type: "string" as const, description: "URL страницы" },
      type: { type: "string" as const, enum: ["Organization", "LocalBusiness", "FAQPage", "Article", "Product", "SoftwareApplication"], description: "Тип схемы" },
    },
    required: ["url", "type"] as const,
  },
  handler: async (args: { url: string; type: string }) => {
    const templates: Record<string, object> = {
      Organization: { "@context": "https://schema.org", "@type": "Organization", name: "Название", url: args.url, logo: `${args.url}/logo.png`, contactPoint: { "@type": "ContactPoint", telephone: "+7-XXX-XXX-XX-XX", contactType: "customer service" } },
      LocalBusiness: { "@context": "https://schema.org", "@type": "LocalBusiness", name: "Название", url: args.url, telephone: "+7-XXX-XXX-XX-XX", address: { "@type": "PostalAddress", addressLocality: "Москва", addressCountry: "RU" } },
      FAQPage: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Вопрос?", acceptedAnswer: { "@type": "Answer", text: "Ответ." } }] },
      Article: { "@context": "https://schema.org", "@type": "Article", headline: "Заголовок", url: args.url, author: { "@type": "Person", name: "Автор" }, datePublished: new Date().toISOString().split("T")[0] },
      Product: { "@context": "https://schema.org", "@type": "Product", name: "Продукт", url: args.url, offers: { "@type": "Offer", price: "1000", priceCurrency: "RUB" } },
      SoftwareApplication: { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "Приложение", url: args.url, applicationCategory: "BusinessApplication", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } },
    };
    const schema = templates[args.type];
    if (!schema) return { content: [{ type: "text" as const, text: `Неизвестный тип: ${args.type}` }] };
    const jsonLd = JSON.stringify(schema, null, 2);
    return { content: [{ type: "text" as const, text: `# JSON-LD: ${args.type}\n\nВставьте в <head>:\n\n\`\`\`html\n<script type="application/ld+json">\n${jsonLd}\n</script>\n\`\`\`\n\nЗамените placeholder-значения. Проверка: https://search.google.com/test/rich-results` }] };
  },
});

// HTTP Transport
const transport = new StreamableHttpTransport();
const app = new Hono();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

app.all("/*", async (c) => {
  if (c.req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ip = c.req.header("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit: 10 req/min" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const response = await transport.handleRequest(c.req.raw, mcp);
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) newHeaders.set(k, v);
  return new Response(response.body, { status: response.status, headers: newHeaders });
});

Deno.serve(app.fetch);
