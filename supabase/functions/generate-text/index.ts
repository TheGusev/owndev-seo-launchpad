import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompts: Record<string, string> = {
  "Вступление для GEO-страницы": "Ты — копирайтер. Напиши уникальное вступление (2-3 абзаца) для GEO-страницы. Текст должен упоминать город, быть полезным и SEO-оптимизированным. Не используй шаблонные фразы.",
  "FAQ под регион": "Ты — копирайтер. Сгенерируй 5-7 вопросов и ответов (FAQ) для GEO-страницы. Вопросы должны быть релевантны городу и нише. Формат: Q: ... A: ...",
  "Описание услуги": "Ты — копирайтер. Напиши описание услуги (3-4 абзаца) с упоминанием города. Текст должен быть продающим и информативным.",
  "Мета-описание": "Ты — SEO-специалист. Напиши мета-описание (description) длиной 140-160 символов для GEO-страницы. Включи город и ключевое слово.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, city, niche } = await req.json();
    if (!type || !niche) throw new Error("type and niche are required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const system = systemPrompts[type] || systemPrompts["Вступление для GEO-страницы"];
    const userPrompt = `Ниша: ${niche}${city ? `, город: ${city}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Попробуйте позже." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Недостаточно средств для AI-запроса." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI error: ${status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
