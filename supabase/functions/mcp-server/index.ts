import { Hono } from "https://deno.land/x/hono@v4.4.0/mod.ts";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Rate limiting: 10 req/min per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
}

// ─── MCP Server ───────────────────────────────────────
const mcpServer = new McpServer({ name: "owndev", version: "1.0.0" });

// Tool 1: geo_audit
mcpServer.tool({
  name: "geo_audit",
  description:
    "Запускает полный GEO и AI-ready аудит сайта. Возвращает SEO Score, LLM Score, Schema Score, список ошибок и рекомендации.",
  inputSchema: {
    type: "object" as const,
    properties: {
      url: { type: "string" as const, description: "URL сайта для проверки" },
      theme: { type: "string" as const, description: "Тематика сайта (опционально)" },
    },
    required: ["url"],
  },
  handler: async (args: Record<string, unknown>) => {
    const url = args.url as string;
    try {
      // Start scan
      const startResp = await fetch(`${SUPABASE_URL}/functions/v1/site-check-scan/start`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ url, mode: "page" }),
      });
      if (!startResp.ok) {
        const err = await startResp.text();
        return { content: [{ type: "text" as const, text: `Ошибка запуска сканирования: ${err}` }] };
      }
      const { scan_id } = await startResp.json();

      // Poll status (max 120s)
      const maxWait = 120_000;
      const interval = 3_000;
      let elapsed = 0;
      let status = "pending";

      while (elapsed < maxWait && status !== "done" && status !== "error") {
        await new Promise((r) => setTimeout(r, interval));
        elapsed += interval;
        const statusResp = await fetch(
          `${SUPABASE_URL}/functions/v1/site-check-scan/status/${scan_id}`,
          { headers: headers() }
        );
        if (statusResp.ok) {
          const data = await statusResp.json();
          status = data.status;
        }
      }

      if (status !== "done") {
        return {
          content: [{ type: "text" as const, text: `Сканирование не завершено за ${maxWait / 1000}с. Статус: ${status}. scan_id: ${scan_id}` }],
        };
      }

      // Fetch full results
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: scan, error } = await supabase.from("scans").select("*").eq("id", scan_id).maybeSingle();
      if (error || !scan) {
        return { content: [{ type: "text" as const, text: "Ошибка получения результатов сканирования." }] };
      }

      const scores = scan.scores as Record<string, number> | null;
      const issues = (scan.issues as Array<{ severity: string; title: string; how_to_fix: string }>) ?? [];
      const criticalIssues = issues.filter((i) => i.severity === "critical" || i.severity === "high");

      const text = [
        `# GEO-аудит: ${scan.url}`,
        ``,
        `## Скоры`,
        `- **SEO Score**: ${scores?.seo ?? "—"}/100`,
        `- **LLM Score (AI-видимость)**: ${scores?.ai ?? "—"}/100`,
        `- **Schema Score**: ${scores?.schema ?? "—"}/100`,
        `- **Директ Score**: ${scores?.direct ?? "—"}/100`,
        `- **Общий балл**: ${scores?.total ?? "—"}/100`,
        ``,
        `## Тематика`,
        scan.theme || "Не определена",
        ``,
        `## Критические ошибки (${criticalIssues.length})`,
        ...criticalIssues.slice(0, 10).map(
          (i, idx) => `${idx + 1}. **${i.title}** (${i.severity})\n   → ${i.how_to_fix}`
        ),
        ``,
        `Всего ошибок: ${issues.length}`,
        ``,
        `Полный отчёт: https://owndev.ru/site-check/result/${scan_id}`,
      ].join("\n");

      return { content: [{ type: "text" as const, text }] };
    } catch (e) {
      return { content: [{ type: "text" as const, text: `Ошибка: ${(e as Error).message}` }] };
    }
  },
});

// Tool 2: check_llms_txt
mcpServer.tool({
  name: "check_llms_txt",
  description: "Проверяет наличие и валидность файла llms.txt на сайте",
  inputSchema: {
    type: "object" as const,
    properties: {
      url: { type: "string" as const, description: "Домен для проверки (например https://example.com)" },
    },
    required: ["url"],
  },
  handler: async (args: Record<string, unknown>) => {
    const rawUrl = args.url as string;
    let domain: string;
    try {
      const u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
      domain = u.origin;
    } catch {
      return { content: [{ type: "text" as const, text: "Некорректный URL." }] };
    }

    const results: string[] = [`# Проверка llms.txt для ${domain}`, ""];

    for (const file of ["llms.txt", "llms-full.txt"]) {
      try {
        const resp = await fetch(`${domain}/${file}`, {
          headers: { "User-Agent": "OWNDEV-MCP/1.0" },
          redirect: "follow",
        });
        if (resp.ok) {
          const text = await resp.text();
          const lines = text.split("\n").filter((l) => l.trim());
          results.push(`## ✅ ${file} — найден`);
          results.push(`- Размер: ${text.length} символов`);
          results.push(`- Строк: ${lines.length}`);
          results.push(`- Первые 5 строк:`);
          results.push("```");
          results.push(...lines.slice(0, 5));
          results.push("```");
          results.push("");
        } else {
          results.push(`## ❌ ${file} — не найден (HTTP ${resp.status})`);
          await resp.text(); // consume body
          results.push("");
        }
      } catch (e) {
        results.push(`## ❌ ${file} — ошибка: ${(e as Error).message}`);
        results.push("");
      }
    }

    results.push("## Рекомендации");
    results.push("- Создайте файл llms.txt в корне сайта для AI-краулеров (ChatGPT, Claude, Perplexity).");
    results.push("- Используйте формат: заголовок, описание, ссылки на ключевые страницы.");
    results.push("- Подробнее: https://llmstxt.org/");

    return { content: [{ type: "text" as const, text: results.join("\n") }] };
  },
});

// Tool 3: generate_schema
mcpServer.tool({
  name: "generate_schema",
  description: "Генерирует JSON-LD Schema.org разметку для сайта",
  inputSchema: {
    type: "object" as const,
    properties: {
      url: { type: "string" as const, description: "URL страницы" },
      type: {
        type: "string" as const,
        enum: ["Organization", "LocalBusiness", "FAQPage", "Article", "Product", "SoftwareApplication"],
        description: "Тип схемы",
      },
    },
    required: ["url", "type"],
  },
  handler: async (args: Record<string, unknown>) => {
    const url = args.url as string;
    const type = args.type as string;

    const templates: Record<string, object> = {
      Organization: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Название компании",
        url,
        logo: `${url}/logo.png`,
        description: "Описание компании",
        sameAs: ["https://vk.com/company", "https://t.me/company"],
        contactPoint: { "@type": "ContactPoint", telephone: "+7-XXX-XXX-XX-XX", contactType: "customer service" },
      },
      LocalBusiness: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Название бизнеса",
        url,
        image: `${url}/photo.jpg`,
        telephone: "+7-XXX-XXX-XX-XX",
        address: { "@type": "PostalAddress", streetAddress: "ул. Примерная, 1", addressLocality: "Москва", postalCode: "101000", addressCountry: "RU" },
        openingHoursSpecification: { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "18:00" },
      },
      FAQPage: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Вопрос 1?", acceptedAnswer: { "@type": "Answer", text: "Ответ на вопрос 1." } },
          { "@type": "Question", name: "Вопрос 2?", acceptedAnswer: { "@type": "Answer", text: "Ответ на вопрос 2." } },
        ],
      },
      Article: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Заголовок статьи",
        url,
        image: `${url}/article-image.jpg`,
        author: { "@type": "Person", name: "Имя автора" },
        publisher: { "@type": "Organization", name: "Издатель", logo: { "@type": "ImageObject", url: `${url}/logo.png` } },
        datePublished: new Date().toISOString().split("T")[0],
        dateModified: new Date().toISOString().split("T")[0],
        description: "Краткое описание статьи",
      },
      Product: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Название продукта",
        url,
        image: `${url}/product.jpg`,
        description: "Описание продукта",
        brand: { "@type": "Brand", name: "Бренд" },
        offers: { "@type": "Offer", price: "1000", priceCurrency: "RUB", availability: "https://schema.org/InStock" },
      },
      SoftwareApplication: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Название приложения",
        url,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
        aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "150" },
      },
    };

    const schema = templates[type];
    if (!schema) {
      return { content: [{ type: "text" as const, text: `Неизвестный тип схемы: ${type}` }] };
    }

    const jsonLd = JSON.stringify(schema, null, 2);
    const text = [
      `# JSON-LD разметка: ${type}`,
      "",
      "Вставьте этот код в `<head>` вашей страницы:",
      "",
      "```html",
      `<script type="application/ld+json">`,
      jsonLd,
      `</script>`,
      "```",
      "",
      "## Рекомендации",
      "- Замените placeholder-значения на реальные данные",
      "- Проверьте разметку: https://search.google.com/test/rich-results",
      "- JSON-LD помогает поисковикам и AI-системам лучше понимать ваш контент",
    ].join("\n");

    return { content: [{ type: "text" as const, text }] };
  },
});

// ─── HTTP Transport ───────────────────────────────────
const transport = new StreamableHttpTransport();
const app = new Hono();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

app.all("/*", async (c) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ip = c.req.header("x-forwarded-for") ?? c.req.header("cf-connecting-ip") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Max 10 requests per minute." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const response = await transport.handleRequest(c.req.raw, mcpServer);

  // Add CORS headers to response
  const newHeaders = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders)) {
    newHeaders.set(k, v);
  }

  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
});

Deno.serve(app.fetch);
