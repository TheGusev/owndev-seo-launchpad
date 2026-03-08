import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, region } = await req.json();
    if (!query) throw new Error("query is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Ты — SEO-специалист. Пользователь даёт базовый запрос и регион. Сгенерируй семантическое ядро из 15-25 ключевых запросов, разбитых на 3 кластера по интенту. Для каждого запроса укажи примерную месячную частотность (estimatedVolume). Используй функцию suggest_keywords для ответа.`;

    const userPrompt = `Базовый запрос: "${query}"${region ? `, регион: ${region}` : ""}`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_keywords",
              description: "Return keyword clusters grouped by intent",
              parameters: {
                type: "object",
                properties: {
                  clusters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", enum: ["Информационные", "Коммерческие", "Транзакционные"] },
                        keywords: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              keyword: { type: "string" },
                              estimatedVolume: { type: "number" },
                            },
                            required: ["keyword", "estimatedVolume"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["name", "keywords"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["clusters"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_keywords" } },
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

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const clusters = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(clusters), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-semantic-core error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
