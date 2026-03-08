import { useState } from "react";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ToolCTA from "./ToolCTA";

type Goal = "write" | "improve" | "ai-overview";

const goalLabels: Record<Goal, string> = {
  write: "Написать текст под запрос",
  improve: "Улучшить существующую страницу",
  "ai-overview": "Попасть в AI Overviews / ответы LLM",
};

function generatePrompts(lang: string, goal: Goal, keyword: string, niche: string, url: string): string[] {
  const isRu = lang === "ru";

  if (goal === "write") {
    return [
      isRu
        ? `Ты — SEO-копирайтер. Напиши подробную, экспертную статью на тему «${keyword}» для сайта в нише «${niche}».

Требования:
— Уникальный, полезный контент без воды
— Структура: H1, минимум 4 подзаголовка H2, списки, таблицы где уместно
— В конце добавь блок FAQ (3-5 вопросов с ответами)
— Длина: 1500-2500 слов
— Тон: профессиональный, но понятный
— Оптимизируй под запрос «${keyword}», но не переспамь ключами`
        : `You are an SEO copywriter. Write a detailed, expert article on "${keyword}" for a website in the "${niche}" niche.

Requirements:
— Unique, valuable content with no fluff
— Structure: H1, at least 4 H2 subheadings, lists, tables where appropriate
— Add an FAQ block at the end (3-5 questions with answers)
— Length: 1500-2500 words
— Tone: professional yet accessible
— Optimize for "${keyword}" but avoid keyword stuffing`,

      isRu
        ? `Сгенерируй meta-данные для статьи о «${keyword}» (ниша: ${niche}):
1. Title (50-60 символов, с ключевым словом в начале)
2. Meta description (150-160 символов, с призывом к действию)
3. H1 (отличающийся от title, но содержащий ключ)
4. 5 вариантов URL-slug`
        : `Generate meta data for an article about "${keyword}" (niche: ${niche}):
1. Title tag (50-60 chars, keyword near the beginning)
2. Meta description (150-160 chars, with a call to action)
3. H1 (different from title but containing the keyword)
4. 5 URL slug variations`,
    ];
  }

  if (goal === "improve") {
    const urlPart = url ? (isRu ? `\nURL страницы: ${url}` : `\nPage URL: ${url}`) : "";
    return [
      isRu
        ? `Ты — SEO-эксперт. Проанализируй страницу и дай конкретные рекомендации по улучшению.${urlPart}
Запрос: «${keyword}»
Ниша: «${niche}»

Проверь и предложи улучшения по каждому пункту:
1. Title и meta description — переписать если нужно
2. Структура заголовков (H1-H3) — добавить недостающие
3. Контент — что добавить, что убрать, где расширить
4. Внутренняя перелинковка — какие ссылки добавить
5. Schema.org — какую разметку добавить
6. FAQ-блок — предложи 3-5 вопросов для добавления
7. E-E-A-T сигналы — что усилить`
        : `You are an SEO expert. Analyze this page and give specific improvement recommendations.${urlPart}
Target keyword: "${keyword}"
Niche: "${niche}"

Check and suggest improvements for:
1. Title & meta description — rewrite if needed
2. Heading structure (H1-H3) — add missing ones
3. Content — what to add, remove, or expand
4. Internal linking — which links to add
5. Schema.org — which markup to add
6. FAQ block — suggest 3-5 questions to add
7. E-E-A-T signals — what to strengthen`,

      isRu
        ? `Перепиши следующие элементы страницы для лучшего ранжирования по запросу «${keyword}»:
— Title (текущий слишком общий)
— Meta description (добавь призыв к действию)
— Первый абзац (включи ключевую фразу естественно)
— Добавь 3 H2 подзаголовка с LSI-ключами`
        : `Rewrite the following page elements for better ranking on "${keyword}":
— Title (current one is too generic)
— Meta description (add a call to action)
— First paragraph (include the key phrase naturally)
— Add 3 H2 subheadings with LSI keywords`,
    ];
  }

  // ai-overview
  return [
    isRu
      ? `Ты — эксперт по оптимизации контента под AI-поисковики (Google AI Overviews, Perplexity, ChatGPT).

Тема: «${keyword}»
Ниша: «${niche}»${url ? `\nURL: ${url}` : ""}

Создай контент-блок, максимально подходящий для цитирования AI-системами:
1. Краткий, точный ответ на вопрос (2-3 предложения) — идеально для featured snippet
2. Развёрнутый ответ со структурой (H2, списки, таблица)
3. FAQ-блок (5 вопросов) в формате «вопрос — короткий точный ответ»
4. Schema.org JSON-LD разметку типа FAQPage для этого FAQ

Важно: ответы должны быть фактологичными, конкретными, без воды.`
      : `You are an expert in optimizing content for AI search engines (Google AI Overviews, Perplexity, ChatGPT).

Topic: "${keyword}"
Niche: "${niche}"${url ? `\nURL: ${url}` : ""}

Create a content block maximally suited for AI citation:
1. Brief, precise answer (2-3 sentences) — ideal for featured snippets
2. Expanded answer with structure (H2, lists, table)
3. FAQ block (5 questions) in "question — short precise answer" format
4. Schema.org JSON-LD markup of type FAQPage for this FAQ

Important: answers must be factual, specific, no fluff.`,

    isRu
      ? `Какие структурированные данные (Schema.org) нужно добавить на страницу о «${keyword}» (ниша: ${niche}), чтобы максимизировать шансы попадания в AI Overviews?

Сгенерируй готовый JSON-LD код для:
1. Article или WebPage
2. FAQPage с 3-5 вопросами по теме
3. BreadcrumbList
4. Если применимо — HowTo или Product`
      : `What structured data (Schema.org) should be added to a page about "${keyword}" (niche: ${niche}) to maximize chances of appearing in AI Overviews?

Generate ready-to-use JSON-LD code for:
1. Article or WebPage
2. FAQPage with 3-5 topic questions
3. BreadcrumbList
4. If applicable — HowTo or Product`,
  ];
}

const LLMPromptHelper = () => {
  const [lang, setLang] = useState("ru");
  const [goal, setGoal] = useState<Goal>("write");
  const [keyword, setKeyword] = useState("");
  const [niche, setNiche] = useState("");
  const [url, setUrl] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = () => {
    if (!keyword.trim() || !niche.trim()) return;
    setPrompts(generatePrompts(lang, goal, keyword.trim(), niche.trim(), url.trim()));
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast({ title: "Скопировано!" });
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Язык промтов</label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Цель</label>
            <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(goalLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Ключевой запрос *</label>
          <Input placeholder="ремонт квартир москва" className="bg-card border-border" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Ниша / описание сайта *</label>
          <Input placeholder="Строительная компания, ремонт квартир под ключ" className="bg-card border-border" value={niche} onChange={(e) => setNiche(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">URL страницы (опционально)</label>
          <Input placeholder="https://example.com/services" className="bg-card border-border" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>

        <div className="text-center">
          <GradientButton size="lg" onClick={handleGenerate} disabled={!keyword.trim() || !niche.trim()}>
            <Bot className="w-5 h-5 mr-2" />
            Сгенерировать промты
          </GradientButton>
        </div>

        {prompts.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">Готовые промты ({prompts.length})</p>
            {prompts.map((prompt, i) => (
              <div key={i} className="relative">
                <div className="glass rounded-xl p-4 pr-12">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">{prompt}</pre>
                </div>
                <button
                  onClick={() => copyToClipboard(prompt, i)}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-card hover:bg-muted transition-colors"
                  title="Скопировать"
                >
                  {copiedIdx === i ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            ))}

            <ToolCTA />
          </div>
        )}

        {prompts.length === 0 && (
          <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
            Заполните поля и нажмите кнопку — получите готовые промты для копирования в ChatGPT, Perplexity или другой LLM
          </div>
        )}
      </div>
    </div>
  );
};

export default LLMPromptHelper;
