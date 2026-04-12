const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { topic, language = 'ru' } = await req.json();
    if (!topic) return new Response(JSON.stringify({ error: 'Topic is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const systemPrompt = `Ты — SEO-специалист. Генерируй семантическое ядро для заданной темы. Язык: ${language}.

Верни результат СТРОГО в формате JSON через tool call. Кластеры должны быть разделены по интенту: informational, commercial, transactional, navigational.
Каждый кластер содержит: name (название кластера), intent (тип интента), keywords (массив ключевых слов, 5-10 на кластер).
Сгенерируй 4-6 кластеров, всего 30-50 ключевых слов.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Тема: ${topic}` },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_semantic_core',
            description: 'Return the semantic core clusters',
            parameters: {
              type: 'object',
              properties: {
                clusters: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      intent: { type: 'string', enum: ['informational', 'commercial', 'transactional', 'navigational'] },
                      keywords: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['name', 'intent', 'keywords'],
                  },
                },
              },
              required: ['clusters'],
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_semantic_core' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Слишком много запросов. Попробуйте через минуту.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Недостаточно кредитов AI.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const t = await response.text();
      console.error('AI error:', response.status, t);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call in response');

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('generate-semantic-core error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
