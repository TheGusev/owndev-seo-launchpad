import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

interface PromptResult {
  prompt: string;
  response_snippet: string;
  is_cited: boolean;
  brand_mentioned: boolean;
  sentiment: 'positive' | 'neutral' | 'negative' | 'none';
  competitor_mentions: string[];
}

interface LlmJudgeResult {
  total_prompts: number;
  cited_count: number;
  citation_rate: string;
  competitors_found: string[];
  llm_judge_score: number;
  results: PromptResult[];
}

function generatePrompts(theme: string, domain: string): string[] {
  const clean = theme.replace(/[«»"]/g, '').trim();
  return [
    `Какой лучший сервис для ${clean}?`,
    `Порекомендуй ${clean} в России`,
    `Какие инструменты для ${clean} ты знаешь?`,
    `Сравни сервисы ${clean}`,
    `Где можно получить ${clean} онлайн?`,
  ];
}

async function askLLM(prompt: string, apiKey: string): Promise<string> {
  const resp = await fetch(GATEWAY, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Ответь на вопрос пользователя подробно. Если знаешь конкретные сайты или сервисы — назови их с URL. Давай конкретные рекомендации.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });
  if (!resp.ok) {
    console.error(`LLM error: ${resp.status}`);
    return '';
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

function analyzeCitation(
  response: string,
  domain: string,
  brandName: string,
): { is_cited: boolean; brand_mentioned: boolean; sentiment: 'positive' | 'neutral' | 'negative' | 'none'; competitors: string[] } {
  const lower = response.toLowerCase();
  const domainClean = domain.replace(/^www\./, '').toLowerCase();
  const brandLower = brandName.toLowerCase();

  const is_cited = lower.includes(domainClean);
  const brand_mentioned = brandLower.length > 2 && lower.includes(brandLower);

  let sentiment: 'positive' | 'neutral' | 'negative' | 'none' = 'none';
  if (is_cited || brand_mentioned) {
    const positiveWords = ['лучший', 'отличный', 'рекомендую', 'популярный', 'надёжный', 'удобный', 'качественный'];
    const negativeWords = ['плохой', 'не рекомендую', 'проблемы', 'устаревший', 'ненадёжный'];
    const hasPositive = positiveWords.some(w => lower.includes(w));
    const hasNegative = negativeWords.some(w => lower.includes(w));
    sentiment = hasNegative ? 'negative' : hasPositive ? 'positive' : 'neutral';
  }

  // Extract competitor URLs
  const urlPattern = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const urls = (response.match(urlPattern) || [])
    .map(u => new URL(u).hostname.replace(/^www\./, ''))
    .filter(h => h !== domainClean);
  const competitors = [...new Set(urls)].slice(0, 10);

  return { is_cited, brand_mentioned, sentiment, competitors };
}

function calcScore(results: PromptResult[]): number {
  const total = results.length;
  if (total === 0) return 0;
  const citedCount = results.filter(r => r.is_cited).length;

  // Base: 60% weight for citation rate
  let score = (citedCount / total) * 60;

  // +20 if cited in first 2 responses
  const citedEarly = results.slice(0, 2).filter(r => r.is_cited).length;
  if (citedEarly > 0) score += 20;

  // +10 if brand mentioned (not just domain)
  if (results.some(r => r.brand_mentioned)) score += 10;

  // +10 if no negative sentiment
  if (!results.some(r => r.sentiment === 'negative')) score += 10;

  return Math.min(100, Math.round(score));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    const { scan_id, url, theme } = await req.json();
    if (!scan_id || !url) {
      return new Response(JSON.stringify({ error: 'scan_id and url required' }), { status: 400, headers: jsonHeaders });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: jsonHeaders });
    }

    let domain: string;
    let brandName: string;
    try {
      const parsed = new URL(url);
      domain = parsed.hostname.replace(/^www\./, '');
      brandName = domain.split('.')[0].toUpperCase();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers: jsonHeaders });
    }

    const effectiveTheme = theme || domain;
    const prompts = generatePrompts(effectiveTheme, domain);

    const results: PromptResult[] = [];
    for (const prompt of prompts) {
      try {
        const response = await askLLM(prompt, apiKey);
        const analysis = analyzeCitation(response, domain, brandName);
        results.push({
          prompt,
          response_snippet: response.slice(0, 300),
          is_cited: analysis.is_cited,
          brand_mentioned: analysis.brand_mentioned,
          sentiment: analysis.sentiment,
          competitor_mentions: analysis.competitors,
        });
      } catch (e) {
        console.error(`Error for prompt "${prompt}":`, e);
        results.push({
          prompt,
          response_snippet: 'Ошибка при запросе к нейросети',
          is_cited: false,
          brand_mentioned: false,
          sentiment: 'none',
          competitor_mentions: [],
        });
      }
      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    }

    const citedCount = results.filter(r => r.is_cited).length;
    const allCompetitors = [...new Set(results.flatMap(r => r.competitor_mentions))];
    const llmJudgeScore = calcScore(results);

    const judgeResult: LlmJudgeResult = {
      total_prompts: prompts.length,
      cited_count: citedCount,
      citation_rate: `${citedCount} из ${prompts.length}`,
      competitors_found: allCompetitors,
      llm_judge_score: llmJudgeScore,
      results,
    };

    // Save to scans table
    const supabase = getSupabase();
    await supabase
      .from('scans')
      .update({ llm_judge: judgeResult })
      .eq('id', scan_id);

    return new Response(JSON.stringify(judgeResult), { headers: jsonHeaders });
  } catch (e) {
    console.error('llm-judge error:', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
  }
});
