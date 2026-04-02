import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const issuePrompts: Record<string, string> = {
  missing_meta_description:
    "Сгенерируй оптимальный meta description (140-160 символов) для этой страницы. Верни ТОЛЬКО тег <meta>.",
  short_meta_description:
    "Перепиши meta description (140-160 символов) — информативнее и с ключевыми словами. Верни ТОЛЬКО тег <meta>.",
  missing_og_tags:
    "Сгенерируй полный набор Open Graph тегов для этой страницы. Верни ТОЛЬКО HTML-теги.",
  missing_schema_org:
    "Определи тип Schema.org для этой страницы и сгенерируй JSON-LD разметку. Верни ТОЛЬКО <script type='application/ld+json'>.",
  missing_faq_schema:
    "Сгенерируй 5 FAQ вопросов и ответов на основе контента страницы в формате Schema.org FAQPage JSON-LD. Верни ТОЛЬКО <script type='application/ld+json'>.",
  missing_llms_txt:
    "Сгенерируй файл llms.txt для этого сайта в стандартном формате (# Title, > Description, ## Offered, ## Links). Верни ТОЛЬКО содержимое файла.",
  missing_h1:
    "Сгенерируй оптимальный H1 заголовок для этой страницы. Верни ТОЛЬКО тег <h1>.",
  short_title:
    "Сгенерируй оптимальный title (50-60 символов) с ключевым словом. Верни ТОЛЬКО тег <title>.",
  missing_twitter_card:
    "Сгенерируй Twitter Card мета-теги для этой страницы. Верни ТОЛЬКО HTML-теги.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { issueType, url, title, description } = await req.json();

    const promptTemplate = issuePrompts[issueType];
    if (!promptTemplate) {
      return new Response(JSON.stringify({ error: "Unknown issue type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `URL: ${url}\nTitle: ${title || "Не указан"}\nDescription: ${description || "Не указано"}\n\n${promptTemplate}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Ты — SEO-эксперт. Генерируй ТОЛЬКО готовый код (HTML/JSON-LD/текст), без пояснений, без markdown-обёрток (```). Только чистый код, который можно скопировать и вставить.",
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Payment required" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let code = data.choices?.[0]?.message?.content || "";

    // Strip markdown fences if present
    code = code.replace(/^```[\w]*\n?/gm, "").replace(/```$/gm, "").trim();

    return new Response(JSON.stringify({ code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-autofix error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
