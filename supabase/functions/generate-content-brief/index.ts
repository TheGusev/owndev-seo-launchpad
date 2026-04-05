import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_TYPES = ["article", "landing", "product", "faq"] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, url, contentType } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ error: "query is required (min 2 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ct = VALID_TYPES.includes(contentType) ? contentType : "article";

    const typeLabels: Record<string, string> = {
      article: "Информационная статья",
      landing: "Лендинг / посадочная страница",
      product: "Карточка товара / услуги",
      faq: "FAQ-страница",
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Ты — эксперт по GEO (Generative Engine Optimization) и SEO-копирайтингу на русском языке.
Твоя задача — создавать подробные контент-брифы для копирайтеров, которые помогут создать текст, 
оптимизированный для попадания в AI-ответы (ChatGPT, Perplexity, Яндекс Нейро) и топ поисковой выдачи.
Все тексты пиши на русском языке. Будь конкретным, давай точные рекомендации.`;

    const userPrompt = `Целевой запрос: "${query.trim()}"
Тип контента: ${typeLabels[ct]}
${url ? `URL сайта для анализа: ${url}` : ""}

Сгенерируй подробный контент-бриф для копирайтера.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        tools: [
          {
            type: "function",
            function: {
              name: "return_content_brief",
              description: "Return a structured content brief for a copywriter",
              parameters: {
                type: "object",
                properties: {
                  title_variants: {
                    type: "array",
                    items: { type: "string" },
                    description: "3 варианта заголовка H1 с ключевым словом",
                  },
                  meta_title: { type: "string", description: "Оптимальный title 50-60 символов" },
                  meta_description: { type: "string", description: "Оптимальный description 150-160 символов" },
                  target_word_count: { type: "number", description: "Рекомендуемый объём текста в словах" },
                  structure: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tag: { type: "string" },
                        text: { type: "string" },
                        description: { type: "string" },
                        min_words: { type: "number" },
                      },
                      required: ["tag", "text", "description", "min_words"],
                    },
                    description: "Структура статьи: массив H2/H3 секций",
                  },
                  must_include: {
                    type: "array",
                    items: { type: "string" },
                    description: "Обязательные элементы контента",
                  },
                  keywords_primary: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 основных ключевых слов",
                  },
                  keywords_secondary: {
                    type: "array",
                    items: { type: "string" },
                    description: "10-15 LSI / дополнительных ключей",
                  },
                  questions_to_answer: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-7 вопросов, на которые должен отвечать текст",
                  },
                  geo_recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "Рекомендации для GEO-оптимизации",
                  },
                  schema_suggestion: { type: "string", description: "Рекомендуемый тип Schema.org" },
                  tone: { type: "string", description: "Рекомендуемый тон текста" },
                  competitor_angles: {
                    type: "array",
                    items: { type: "string" },
                    description: "Подходы конкурентов",
                  },
                },
                required: [
                  "title_variants", "meta_title", "meta_description", "target_word_count",
                  "structure", "must_include", "keywords_primary", "keywords_secondary",
                  "questions_to_answer", "geo_recommendations", "schema_suggestion", "tone",
                  "competitor_angles",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_content_brief" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Попробуйте через минуту." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Лимит AI-запросов исчерпан." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      throw new Error(`AI error ${status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const brief = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-content-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
