import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BrandResult {
  prompt: string;
  aiSystem: string;
  mentioned: boolean;
  sentiment: "positive" | "neutral" | "negative" | null;
  position: number | null;
  competitors: string[];
  fullResponse: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand, prompts, aiSystems } = await req.json();

    if (!brand || !prompts?.length || !aiSystems?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: BrandResult[] = [];

    for (const prompt of prompts.slice(0, 10)) {
      for (const aiSystem of aiSystems.slice(0, 4)) {
        try {
          const llmPrompt = `Ты имитируешь ответ ${aiSystem} на вопрос пользователя.
Пользователь спрашивает: "${prompt}"

Ответь как бы ответила ${aiSystem}, развёрнуто, с рекомендациями инструментов и сервисов.

После ответа проанализируй:
1. Упомянут ли бренд "${brand}" в ответе? (да/нет)
2. Если да — в каком контексте и тональности? (positive/neutral/negative)
3. Какие конкуренты/альтернативы упомянуты? (список)
4. На какой позиции бренд "${brand}" в списке рекомендаций? (число или null)

Верни JSON:
{
  "response": "полный текст ответа от AI",
  "mentioned": true/false,
  "sentiment": "positive"|"neutral"|"negative"|null,
  "position": число|null,
  "competitors": ["конкурент1", "конкурент2"]
}

Только JSON, без markdown.`;

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
                  content: "Ты AI-аналитик, который имитирует ответы различных AI-систем и анализирует упоминание брендов. Всегда отвечай валидным JSON.",
                },
                { role: "user", content: llmPrompt },
              ],
            }),
          });

          if (response.status === 429) {
            results.push({
              prompt,
              aiSystem,
              mentioned: false,
              sentiment: null,
              position: null,
              competitors: [],
              fullResponse: "Rate limit exceeded. Try again later.",
            });
            continue;
          }

          if (!response.ok) {
            const t = await response.text();
            console.error(`AI error for ${aiSystem}/${prompt}:`, response.status, t);
            continue;
          }

          const data = await response.json();
          let content = data.choices?.[0]?.message?.content || "";
          content = content.replace(/^```[\w]*\n?/gm, "").replace(/```$/gm, "").trim();

          try {
            const parsed = JSON.parse(content);
            results.push({
              prompt,
              aiSystem,
              mentioned: !!parsed.mentioned,
              sentiment: parsed.sentiment || null,
              position: parsed.position || null,
              competitors: Array.isArray(parsed.competitors) ? parsed.competitors : [],
              fullResponse: parsed.response || content,
            });
          } catch {
            // Fallback: check if brand is mentioned in raw text
            const mentioned = content.toLowerCase().includes(brand.toLowerCase());
            results.push({
              prompt,
              aiSystem,
              mentioned,
              sentiment: mentioned ? "neutral" : null,
              position: null,
              competitors: [],
              fullResponse: content,
            });
          }
        } catch (e) {
          console.error(`Error processing ${aiSystem}/${prompt}:`, e);
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("brand-tracker error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
