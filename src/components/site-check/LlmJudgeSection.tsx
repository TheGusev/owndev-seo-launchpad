import { Brain, CheckCircle, XCircle, Users, Trophy, AlertTriangle, Info } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface PromptResult {
  prompt: string;
  response_snippet: string;
  is_cited: boolean;
  brand_mentioned: boolean;
  sentiment: 'positive' | 'neutral' | 'negative' | 'none';
  competitor_mentions: string[];
}

interface LlmJudgeData {
  total_prompts: number;
  cited_count: number;
  citation_rate: string;
  competitors_found: string[];
  llm_judge_score: number;
  results: PromptResult[];
}

interface LlmJudgeSectionProps {
  data: LlmJudgeData;
}

function getRecommendation(citedCount: number): { text: string; variant: 'success' | 'warning' | 'destructive' } {
  if (citedCount === 0) {
    return {
      text: "Ваш сайт не упоминается нейросетями. Рекомендуем: добавить llms.txt, улучшить E-E-A-T, создать FAQ-контент и публиковать экспертные материалы.",
      variant: 'destructive',
    };
  }
  if (citedCount < 3) {
    return {
      text: "Сайт частично виден нейросетям. Усильте контент-стратегию, добавьте Schema.org разметку и регулярно обновляйте экспертный контент.",
      variant: 'warning',
    };
  }
  return {
    text: "Отличная AI-видимость! Продолжайте публиковать экспертный контент и поддерживать структурированные данные.",
    variant: 'success',
  };
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  if (sentiment === 'positive') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success">Позитивно</span>;
  if (sentiment === 'negative') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">Негативно</span>;
  if (sentiment === 'neutral') return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Нейтрально</span>;
  return null;
}

const ScoreCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => {
  const numVal = typeof value === 'number' ? value : undefined;
  const animatedVal = useAnimatedCounter(numVal ?? 0, 800);

  return (
    <div className="glass rounded-xl p-4 text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <p className={`text-2xl font-bold font-mono score-num ${color}`}>
        {numVal !== undefined ? animatedVal : value}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
};

const LlmJudgeSection = ({ data }: LlmJudgeSectionProps) => {
  const rec = getRecommendation(data.cited_count);

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-bold text-foreground">AI-видимость: что нейросети говорят о вас</h2>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-3 gap-3">
        <ScoreCard
          label="Упоминаний"
          value={data.citation_rate}
          icon={data.cited_count > 0 ? CheckCircle : XCircle}
          color={data.cited_count > 0 ? "text-success" : "text-destructive"}
        />
        <ScoreCard
          label="LLM Judge Score"
          value={data.llm_judge_score}
          icon={Trophy}
          color={data.llm_judge_score >= 50 ? "text-success" : data.llm_judge_score >= 20 ? "text-warning" : "text-destructive"}
        />
        <ScoreCard
          label="Конкурентов найдено"
          value={data.competitors_found.length}
          icon={Users}
          color="text-primary"
        />
      </div>

      {/* Results table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Промт</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ответ нейросети</th>
              <th className="text-center py-2 px-3 text-muted-foreground font-medium">Цитирование</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Конкуренты</th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((r, i) => (
              <tr key={i} className={`border-b border-border/50 ${r.is_cited ? 'bg-success/5' : 'bg-destructive/5'}`}>
                <td className="py-3 px-3 font-medium text-foreground max-w-[200px]">
                  <p className="line-clamp-2">{r.prompt}</p>
                </td>
                <td className="py-3 px-3 text-muted-foreground max-w-[300px]">
                  <p className="line-clamp-3 text-xs">{r.response_snippet}</p>
                  <SentimentBadge sentiment={r.sentiment} />
                </td>
                <td className="py-3 px-3 text-center">
                  {r.is_cited ? (
                    <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Да
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                      <XCircle className="w-3.5 h-3.5" /> Нет
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 max-w-[200px]">
                  {r.competitor_mentions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {r.competitor_mentions.slice(0, 3).map((c, j) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {c}
                        </span>
                      ))}
                      {r.competitor_mentions.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{r.competitor_mentions.length - 3}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recommendation */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
        rec.variant === 'success' ? 'border-success/20 bg-success/5' :
        rec.variant === 'warning' ? 'border-warning/20 bg-warning/5' :
        'border-destructive/20 bg-destructive/5'
      }`}>
        {rec.variant === 'success' ? <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" /> :
         rec.variant === 'warning' ? <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" /> :
         <Info className="w-5 h-5 text-destructive shrink-0 mt-0.5" />}
        <p className="text-sm text-foreground">{rec.text}</p>
      </div>

      {/* Competitors summary */}
      {data.competitors_found.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Конкуренты в ответах нейросетей</h3>
          <div className="flex flex-wrap gap-2">
            {data.competitors_found.map((c, i) => (
              <a
                key={i}
                href={`https://${c}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:border-primary/30 border border-transparent transition-colors"
              >
                {c}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default LlmJudgeSection;
