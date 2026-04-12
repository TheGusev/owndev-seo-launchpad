import { Brain, CheckCircle, XCircle, Users, Trophy, AlertTriangle, Info, Loader2 } from "lucide-react";
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
  _pending?: boolean;
  _status?: 'unavailable' | 'loading' | 'done';
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

const ScoreCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => {
  const numVal = typeof value === 'number' ? value : undefined;
  const animatedVal = useAnimatedCounter(numVal ?? 0, 800);
  
  return (
    <div className="glass rounded-xl p-4 text-center">
      <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
      <p className={`text-2xl font-bold font-mono score-num ${color}`}>
        {numVal !== undefined ? animatedVal : value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 leading-tight">
        {label}
      </p>
    </div>
  );
};

const LlmJudgeSection = ({ data }: LlmJudgeSectionProps) => {
  // FIX: Guard — если данные ещё грузятся (pipeline на бэкенде)
  if (data._pending && (!data.results || data.results.length === 0)) {
    return (
      <div className="glass rounded-xl p-8 text-center space-y-4">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Опрашиваем нейросети...</p>
          <p className="text-xs text-muted-foreground">Это может занять до 30 секунд. Мы проверяем упоминания вашего бренда в GPT-4, Claude и Perplexity.</p>
        </div>
      </div>
    );
  }

  // FIX: Guard — если AI анализ недоступен
  if (data._status === 'unavailable') {
    return (
      <div className="glass rounded-xl p-6 border-dashed border-2 border-muted">
        <div className="flex items-start gap-4">
          <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">AI-анализ временно недоступен</p>
            <p className="text-xs text-muted-foreground">
              Мы не смогли получить данные от поисковых нейросетей. 
              Убедитесь, что сайт доступен извне и не блокирует ботов. 
              Попробуйте запустить повторную проверку позже.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const rec = getRecommendation(data.cited_count);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          AI-видимость: что нейросети говорят о вас
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard 
          label="Упоминаний" 
          value={data.total_prompts} 
          icon={Users} 
          color="text-primary" 
        />
        <ScoreCard 
          label="Цитирований" 
          value={data.cited_count} 
          icon={data.cited_count > 0 ? CheckCircle : XCircle} 
          color={data.cited_count > 0 ? "text-success" : "text-destructive"} 
        />
        <ScoreCard 
          label="Доля цитат" 
          value={data.citation_rate} 
          icon={Trophy} 
          color="text-warning" 
        />
        <ScoreCard 
          label="LLM Score" 
          value={`${data.llm_judge_score}/100`} 
          icon={Brain} 
          color={data.llm_judge_score >= 50 ? "text-success" : data.llm_judge_score >= 20 ? "text-warning" : "text-destructive"} 
        />
      </div>

      {data.results && data.results.length > 0 && (
        <div className="glass rounded-xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-3 font-medium">Промт</th>
                  <th className="p-3 font-medium">Ответ нейросети</th>
                  <th className="p-3 font-medium">Цитирование</th>
                  <th className="p-3 font-medium">Конкуренты</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.results.map((r, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium text-xs max-w-[200px]">{r.prompt}</td>
                    <td className="p-3 text-xs text-muted-foreground leading-relaxed italic max-w-[300px]">
                      "{r.response_snippet}"
                    </td>
                    <td className="p-3">
                      {r.is_cited ? (
                        <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded-full">Да</span>
                      ) : (
                        <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full">Нет</span>
                      )}
                    </td>
                    <td className="p-3">
                      {r.competitor_mentions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.competitor_mentions.slice(0, 3).map((c, j) => (
                            <span key={j} className="text-[9px] bg-muted px-1 py-0.5 rounded text-muted-foreground">{c}</span>
                          ))}
                          {r.competitor_mentions.length > 3 && (
                            <span className="text-[9px] text-muted-foreground">+{r.competitor_mentions.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={`p-4 rounded-xl flex gap-3 items-start border ${
        rec.variant === 'success' ? 'bg-success/10 border-success/20' : 
        rec.variant === 'warning' ? 'bg-warning/10 border-warning/20' : 
        'bg-destructive/10 border-destructive/20'
      }`}>
        {rec.variant === 'success' ? <Trophy className="w-5 h-5 text-success shrink-0" /> : 
         rec.variant === 'warning' ? <AlertTriangle className="w-5 h-5 text-warning shrink-0" /> : 
         <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />}
        <p className="text-sm leading-relaxed">{rec.text}</p>
      </div>

      {data.competitors_found && data.competitors_found.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            Конкуренты в ответах нейросетей
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.competitors_found.map((c, i) => (
              <a 
                key={i} 
                href={`https://${c}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs glass px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                {c}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LlmJudgeSection;
