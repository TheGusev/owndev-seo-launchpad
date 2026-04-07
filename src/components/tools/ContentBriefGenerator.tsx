import { useState } from "react";
import { generateContentBrief } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Loader2, Copy, CheckCircle2, AlertTriangle, Download, FileText,
  Hash, BookOpen, Target, Brain, Search, ChevronRight,
} from "lucide-react";

interface BriefStructureItem {
  tag: string;
  text: string;
  description: string;
  min_words: number;
}

interface ContentBrief {
  title_variants: string[];
  meta_title: string;
  meta_description: string;
  target_word_count: number;
  structure: BriefStructureItem[];
  must_include: string[];
  keywords_primary: string[];
  keywords_secondary: string[];
  questions_to_answer: string[];
  geo_recommendations: string[];
  schema_suggestion: string;
  tone: string;
  competitor_angles: string[];
}

const CONTENT_TYPES = [
  { value: "article", label: "Статья" },
  { value: "landing", label: "Лендинг" },
  { value: "product", label: "Карточка товара" },
  { value: "faq", label: "FAQ-страница" },
];

const copyText = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Скопировано");
};

const ContentBriefGenerator = () => {
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState("article");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<ContentBrief | null>(null);

  const generate = async () => {
    if (!query.trim()) { toast.error("Введите целевой запрос"); return; }
    setLoading(true);
    setBrief(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content-brief", {
        body: { query: query.trim(), url: url.trim() || undefined, contentType },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setBrief(data.brief);
    } catch (e: any) {
      toast.error(e?.message || "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const buildTxtContent = (b: ContentBrief) => {
    const lines: string[] = [];
    lines.push(`КОНТЕНТ-БРИФ: ${query}`, `Тип: ${CONTENT_TYPES.find(c => c.value === contentType)?.label}`, "");
    lines.push("=== ЗАГОЛОВКИ ===");
    b.title_variants.forEach((v, i) => lines.push(`H1 вариант ${i + 1}: ${v}`));
    lines.push(`\nMeta Title: ${b.meta_title}`, `Meta Description: ${b.meta_description}`, "");
    lines.push(`Объём: ~${b.target_word_count} слов | Schema: ${b.schema_suggestion} | Тон: ${b.tone}`, "");
    lines.push("=== СТРУКТУРА ===");
    b.structure.forEach(s => lines.push(`[${s.tag}] ${s.text} (мин. ${s.min_words} слов)`, `  ${s.description}`, ""));
    lines.push("=== ОСНОВНЫЕ КЛЮЧИ ===", b.keywords_primary.join(", "), "");
    lines.push("=== ДОПОЛНИТЕЛЬНЫЕ КЛЮЧИ ===", b.keywords_secondary.join(", "), "");
    lines.push("=== ВОПРОСЫ ДЛЯ AI-ЦИТИРОВАНИЯ ===");
    b.questions_to_answer.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    lines.push("", "=== GEO-РЕКОМЕНДАЦИИ ===");
    b.geo_recommendations.forEach(r => lines.push(`• ${r}`));
    lines.push("", "=== ОБЯЗАТЕЛЬНЫЕ ЭЛЕМЕНТЫ ===");
    b.must_include.forEach(m => lines.push(`✓ ${m}`));
    if (b.competitor_angles.length) {
      lines.push("", "=== ПОДХОДЫ КОНКУРЕНТОВ ===");
      b.competitor_angles.forEach(a => lines.push(`• ${a}`));
    }
    return lines.join("\n");
  };

  const downloadTxt = () => {
    if (!brief) return;
    const blob = new Blob([buildTxtContent(brief)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `brief-${query.trim().slice(0, 30).replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const metaTitleLen = brief?.meta_title?.length ?? 0;
  const metaDescLen = brief?.meta_description?.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="glass rounded-2xl p-6 md:p-8 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Целевой запрос *</label>
          <Input
            placeholder="Например: geo аудит сайта"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-background/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">URL вашего сайта <span className="text-muted-foreground">(опционально)</span></label>
          <Input
            placeholder="https://example.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="bg-background/50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Тип контента</label>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map(ct => (
                <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <GradientButton onClick={generate} disabled={loading} className="w-full sm:w-auto">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Генерация...</> : <>Сгенерировать бриф<ChevronRight className="w-4 h-4 ml-1" /></>}
        </GradientButton>
      </div>

      {/* Results */}
      {brief && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-sm">
              <FileText className="w-3.5 h-3.5 text-primary" /> ~{brief.target_word_count} слов
            </span>
            <span className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-sm">
              <Hash className="w-3.5 h-3.5 text-primary" /> {brief.schema_suggestion}
            </span>
            <span className="inline-flex items-center gap-1.5 glass px-3 py-1.5 rounded-full text-sm">
              <BookOpen className="w-3.5 h-3.5 text-primary" /> {brief.tone}
            </span>
          </div>

          {/* Title variants */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold font-serif text-foreground">Варианты заголовка H1</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {brief.title_variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => copyText(v)}
                  className="glass rounded-xl p-4 text-left hover:border-primary/40 transition-all group"
                >
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{v}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Copy className="w-3 h-3" /> Копировать
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Meta tags */}
          <section className="glass rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-semibold font-serif text-foreground">Мета-теги</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Title ({metaTitleLen} символов)</span>
                  <span className={`text-xs font-mono ${metaTitleLen >= 50 && metaTitleLen <= 60 ? "text-success" : "text-warning"}`}>
                    {metaTitleLen >= 50 && metaTitleLen <= 60 ? "✓ OK" : metaTitleLen < 50 ? "Короткий" : "Длинный"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm text-foreground bg-background/40 rounded-lg px-3 py-2">{brief.meta_title}</p>
                  <button onClick={() => copyText(brief.meta_title)} className="shrink-0 p-2 hover:text-primary transition-colors"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Description ({metaDescLen} символов)</span>
                  <span className={`text-xs font-mono ${metaDescLen >= 150 && metaDescLen <= 160 ? "text-success" : "text-warning"}`}>
                    {metaDescLen >= 150 && metaDescLen <= 160 ? "✓ OK" : metaDescLen < 150 ? "Короткий" : "Длинный"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm text-foreground bg-background/40 rounded-lg px-3 py-2">{brief.meta_description}</p>
                  <button onClick={() => copyText(brief.meta_description)} className="shrink-0 p-2 hover:text-primary transition-colors"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </section>

          {/* Structure */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold font-serif text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Структура статьи
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {brief.structure.map((s, i) => (
                <AccordionItem key={i} value={`s-${i}`} className="glass rounded-xl border-none px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{s.tag}</span>
                      <span className="text-sm font-medium text-foreground">{s.text}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">мин. {s.min_words} сл.</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Keywords */}
          <section className="glass rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold font-serif text-foreground flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" /> Ключевые слова
              </h3>
              <button
                onClick={() => copyText([...brief.keywords_primary, ...brief.keywords_secondary].join(", "))}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3 h-3" /> Копировать все
              </button>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Основные</p>
              <div className="flex flex-wrap gap-2">
                {brief.keywords_primary.map((k, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">{k}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Дополнительные (LSI)</p>
              <div className="flex flex-wrap gap-1.5">
                {brief.keywords_secondary.map((k, i) => (
                  <span key={i} className="px-2 py-1 rounded-md bg-muted/50 text-muted-foreground text-xs">{k}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Questions */}
          <section className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-lg font-semibold font-serif text-foreground flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> Вопросы для AI-цитирования
            </h3>
            <p className="text-xs text-muted-foreground">Ответьте на каждый вопрос в тексте — это увеличит шанс попадания в AI-ответы</p>
            <ol className="space-y-2 list-decimal list-inside">
              {brief.questions_to_answer.map((q, i) => (
                <li key={i} className="text-sm text-foreground">{q}</li>
              ))}
            </ol>
          </section>

          {/* GEO Recommendations */}
          <section className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-lg font-semibold font-serif text-foreground">GEO-рекомендации</h3>
            <ul className="space-y-2">
              {brief.geo_recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span className="text-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Must include */}
          {brief.must_include.length > 0 && (
            <section className="glass rounded-xl p-5 space-y-3">
              <h3 className="text-lg font-semibold font-serif text-foreground">Обязательные элементы</h3>
              <ul className="space-y-1.5">
                {brief.must_include.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <span className="text-foreground">{m}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Competitor angles */}
          {brief.competitor_angles.length > 0 && (
            <section className="glass rounded-xl p-5 space-y-3">
              <h3 className="text-lg font-semibold font-serif text-foreground">Подходы конкурентов</h3>
              <ul className="space-y-1.5">
                {brief.competitor_angles.map((a, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {a}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Export */}
          <div className="flex flex-wrap gap-3">
            <GradientButton variant="variant" size="sm" onClick={downloadTxt}>
              <Download className="w-4 h-4 mr-2" /> Скачать бриф (TXT)
            </GradientButton>
            <GradientButton variant="variant" size="sm" onClick={() => { copyText(buildTxtContent(brief)); }}>
              <Copy className="w-4 h-4 mr-2" /> Копировать бриф
            </GradientButton>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ContentBriefGenerator;
