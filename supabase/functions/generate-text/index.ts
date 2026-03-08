const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const textTypes: Record<string, string> = {
  meta: 'Сгенерируй SEO meta title (до 60 символов) и meta description (до 160 символов) для страницы.',
  intro: 'Напиши вводный абзац для страницы (150-250 слов). Текст должен быть информативным, включать ключевые слова естественно.',
  faq: 'Сгенерируй 5 вопросов и ответов (FAQ) для страницы. Ответы должны быть конкретными, 2-3 предложения.',
  service: 'Напиши описание услуги (300-500 слов). Включи преимущества, процесс работы, для кого подходит.',
  product: 'Напиши описание товара (200-300 слов). Включи характеристики, преимущества, применение.',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { type, topic, keywords = '', language = 'ru' } = await req.json();
    if (!type || !topic) return new Response(JSON.stringify({ error: 'type and topic are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const typePrompt = textTypes[type];
    if (!typePrompt) return new Response(JSON.stringify({ error: `Invalid type. Available: ${Object.keys(textTypes).join(', ')}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const systemPrompt = `Ты — профессиональный SEO-копирайтер. Пиши на языке: ${language}.
${typePrompt}
${keywords ? `Ключевые слова для включения: ${keywords}` : ''}
Текст должен быть уникальным, полезным для читателя, оптимизированным для поисковых систем и AI-поиска.
Не используй markdown-разметку кроме случаев FAQ (там используй формат "**Вопрос:** ... **Ответ:** ...").`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Тема: ${topic}` },
        ],
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
    const text = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ text, type, topic }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('generate-text error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
