const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PageInput {
  city: string;
  service: string;
  slug: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { pages, niche, tone, blocks } = await req.json() as {
      pages: PageInput[];
      niche: string;
      tone: string;
      blocks: string[];
    };

    if (!pages?.length || !niche) {
      return new Response(JSON.stringify({ error: 'pages and niche are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pages.length > 10) {
      return new Response(JSON.stringify({ error: 'Max 10 pages per batch' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const toneMap: Record<string, string> = {
      commercial: 'коммерческая, продающая',
      strict: 'строгая, деловая',
      expert: 'экспертная, авторитетная',
    };
    const toneLabel = toneMap[tone] || toneMap.commercial;

    const needFaq = blocks?.includes('faq');
    const needIntro = blocks?.includes('intro');
    const needCta = blocks?.includes('cta');

    const pagesDescription = pages.map((p, i) =>
      `${i + 1}. Услуга: "${p.service}", Город: "${p.city}", slug: "${p.slug}"`
    ).join('\n');

    const systemPrompt = `Ты — SEO-копирайтер. Генерируй уникальный контент для GEO-страниц.
Ниша: ${niche}. Тональность: ${toneLabel}.
Для КАЖДОЙ страницы создай УНИКАЛЬНЫЕ тексты — не повторяй шаблоны.
Title должен быть до 60 символов, meta description до 160 символов.
Каждый текст должен содержать естественные упоминания города и услуги.
Ответь ТОЛЬКО вызовом функции.`;

    const userPrompt = `Сгенерируй уникальный SEO-контент для ${pages.length} GEO-страниц:\n\n${pagesDescription}`;

    const faqProps = needFaq ? {
      faq: {
        type: 'array' as const,
        items: {
          type: 'object' as const,
          properties: {
            q: { type: 'string' as const, description: 'Уникальный вопрос' },
            a: { type: 'string' as const, description: 'Конкретный ответ, 2-3 предложения' },
          },
          required: ['q', 'a'],
          additionalProperties: false,
        },
        description: '2 уникальных FAQ-вопроса',
      },
    } : {};

    const introProps = needIntro ? {
      intro: { type: 'string' as const, description: 'Вступительный абзац, 2-3 предложения' },
    } : {};

    const ctaProps = needCta ? {
      cta: { type: 'string' as const, description: 'Призыв к действию, 1 предложение' },
    } : {};

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'return_geo_pages',
            description: 'Возвращает массив уникального SEO-контента для GEO-страниц',
            parameters: {
              type: 'object',
              properties: {
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      slug: { type: 'string', description: 'Slug страницы (как во входных данных)' },
                      title: { type: 'string', description: 'Уникальный SEO title, до 60 символов' },
                      metaDescription: { type: 'string', description: 'Уникальный meta description, до 160 символов' },
                      h1: { type: 'string', description: 'Уникальный H1 заголовок' },
                      h2_1: { type: 'string', description: 'Первый H2 подзаголовок' },
                      h2_2: { type: 'string', description: 'Второй H2 подзаголовок' },
                      ...introProps,
                      ...faqProps,
                      ...ctaProps,
                    },
                    required: ['slug', 'title', 'metaDescription', 'h1', 'h2_1', 'h2_2'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['results'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'return_geo_pages' } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Слишком много запросов. Попробуйте через минуту.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Недостаточно кредитов AI.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error('No structured output from AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error('Failed to parse tool call arguments:', toolCall.function.arguments);
      throw new Error('Invalid AI response format');
    }

    return new Response(JSON.stringify({ results: parsed.results || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-geo-content error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
