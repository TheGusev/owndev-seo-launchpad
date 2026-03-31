import { useMemo, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Check, X, AlertTriangle, Lightbulb, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Competitor {
  _type: 'competitor';
  position: number;
  url: string;
  domain: string;
  title: string | null;
  h1: string | null;
  content_length_words: number;
  has_faq: boolean;
  has_price_block: boolean;
  has_reviews: boolean;
  has_schema: boolean;
  has_cta_button: boolean;
  has_video: boolean;
  has_blog: boolean;
  load_speed_sec: number | null;
  h2_count: number;
  h3_count: number;
  images_count: number;
  internal_links_count: number;
  top_phrases: string[];
  is_analyzed: boolean;
}

interface CompetitorMetrics {
  content_length_words: number;
  h2_count: number;
  images_count: number;
  has_faq: boolean;
  has_price_block: boolean;
  has_reviews: boolean;
  has_schema: boolean;
  has_video: boolean;
}

interface ComparisonTableData {
  _type: 'comparison_table';
  your_site: CompetitorMetrics;
  avg_top10: CompetitorMetrics;
  leader: CompetitorMetrics;
  leader_domain: string;
  insights: string[];
}

interface DirectMetaData {
  _type: 'direct_meta';
  query: string;
  region: string;
  serp_date: string;
  total_found: number;
}

interface CompetitorsTableProps {
  competitors: Competitor[];
  comparisonTable: ComparisonTableData | null;
  directMeta: DirectMetaData | null;
  userUrl?: string;
}

function BoolCell({ value }: { value?: boolean }) {
  return value
    ? <Check className="w-4 h-4 text-emerald-400 mx-auto" />
    : <X className="w-4 h-4 text-red-400/40 mx-auto" />;
}

function numColor(val: number, avg: number): string {
  if (avg === 0) return "text-foreground";
  if (val >= avg * 1.1) return "text-emerald-400";
  if (val >= avg * 0.9) return "text-foreground";
  return "text-red-400";
}

function insightPriority(text: string): { label: string; color: string } {
  const t = text.toLowerCase();
  if (t.includes('контент') || t.includes('faq') || t.includes('объём')) return { label: 'Высокий', color: 'text-red-400 bg-red-500/20' };
  if (t.includes('schema') || t.includes('отзыв') || t.includes('цен')) return { label: 'Средний', color: 'text-yellow-400 bg-yellow-500/20' };
  return { label: 'Низкий', color: 'text-muted-foreground bg-muted' };
}

const CompetitorsTable = ({ competitors, comparisonTable, directMeta, userUrl }: CompetitorsTableProps) => {
  const { toast } = useToast();

  // Empty state
  if (!competitors || competitors.length === 0) {
    return (
      <div className="border rounded-xl p-8 bg-card/50 backdrop-blur text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Конкуренты не найдены</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Возможные причины: очень узкая ниша без явных конкурентов или ошибка поискового запроса.
          Попробуйте запустить аудит повторно.
        </p>
      </div>
    );
  }

  const analyzed = competitors.filter(c => c.is_analyzed);
  const notAnalyzedCount = competitors.length - analyzed.length;

  // Averages for coloring
  const avgWords = analyzed.length ? Math.round(analyzed.reduce((s, c) => s + c.content_length_words, 0) / analyzed.length) : 0;
  const avgH2 = analyzed.length ? Math.round(analyzed.reduce((s, c) => s + c.h2_count, 0) / analyzed.length) : 0;

  // Tag cloud: top phrases
  const phraseFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    competitors.forEach(c => {
      (c.top_phrases || []).forEach(p => {
        const normalized = p.toLowerCase().trim();
        if (normalized.length > 3) freq[normalized] = (freq[normalized] || 0) + 1;
      });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
  }, [competitors]);

  const ct = comparisonTable;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Анализ конкурентов</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Топ-{competitors.length} сайтов в нише
          {directMeta?.query ? ` · ${directMeta.query}` : ''}
          {directMeta?.region ? ` · ${directMeta.region}` : ''}
        </p>
      </div>

      {/* Warning if many not analyzed */}
      {notAnalyzedCount >= 8 && (
        <div className="flex items-start gap-3 border border-yellow-500/30 rounded-xl p-4 bg-yellow-500/5">
          <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-300">
            ⚠️ Часть сайтов не удалось проанализировать (защита от ботов). Данные могут быть неполными.
          </p>
        </div>
      )}

      {/* BLOCK B: Summary Cards */}
      {ct && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-5 bg-card/50 backdrop-blur space-y-1">
            <p className="text-xs text-muted-foreground">Средний контент у конкурентов</p>
            <p className="text-2xl font-bold text-foreground">{ct.avg_top10.content_length_words} слов</p>
            <p className="text-xs text-muted-foreground">H2: {ct.avg_top10.h2_count} · Изобр: {ct.avg_top10.images_count}</p>
          </div>
          <div className="border rounded-xl p-5 bg-card/50 backdrop-blur space-y-1">
            <p className="text-xs text-muted-foreground">Лидер по контенту</p>
            <p className="text-2xl font-bold text-foreground">{ct.leader.content_length_words} слов</p>
            <p className="text-xs text-muted-foreground">{ct.leader_domain || 'Лидер'}</p>
          </div>
          <div className="border rounded-xl p-5 bg-card/50 backdrop-blur space-y-1">
            <p className="text-xs text-muted-foreground">Ваш контент vs конкуренты</p>
            <p className="text-2xl font-bold text-foreground">{ct.your_site.content_length_words} слов</p>
            {(() => {
              const diff = ct.your_site.content_length_words - ct.avg_top10.content_length_words;
              if (ct.your_site.content_length_words >= ct.avg_top10.content_length_words) {
                return <p className="text-xs text-emerald-400">✅ Выше среднего (+{diff})</p>;
              }
              if (ct.your_site.content_length_words >= ct.avg_top10.content_length_words * 0.8) {
                return <p className="text-xs text-yellow-400">⚠️ Немного ниже ({diff})</p>;
              }
              return <p className="text-xs text-red-400">❌ Ниже среднего ({diff})</p>;
            })()}
          </div>
        </div>
      )}

      {/* BLOCK C: Main Table - Mobile */}
      <div className="md:hidden space-y-3">
        {competitors.map((c, i) => (
          <div
            key={i}
            className={`border rounded-xl p-4 space-y-2 backdrop-blur ${
              !c.is_analyzed ? 'opacity-50 bg-muted/20' : 'bg-card/50'
            }`}
          >
            {!c.is_analyzed ? (
              <p className="text-sm text-muted-foreground">#{c.position} {c.domain} — не удалось проанализировать</p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground/50">#{c.position}</span>
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors">
                    {c.domain}
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>Слов: <span className={`font-medium ${numColor(c.content_length_words, avgWords)}`}>{c.content_length_words}</span></div>
                  <div>H2: <span className={`font-medium ${numColor(c.h2_count, avgH2)}`}>{c.h2_count}</span></div>
                  <div className="flex items-center gap-1">FAQ: <BoolCell value={c.has_faq} /></div>
                  <div className="flex items-center gap-1">Цены: <BoolCell value={c.has_price_block} /></div>
                  <div className="flex items-center gap-1">Отзывы: <BoolCell value={c.has_reviews} /></div>
                  <div className="flex items-center gap-1">Schema: <BoolCell value={c.has_schema} /></div>
                  <div className="flex items-center gap-1">Видео: <BoolCell value={c.has_video} /></div>
                </div>
                {c.top_phrases && c.top_phrases.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.top_phrases.slice(0, 2).map((p, j) => (
                      <span key={j} className="text-xs bg-white/5 px-1.5 py-0.5 rounded">{p}</span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* BLOCK C: Main Table - Desktop */}
      <div className="hidden md:block border rounded-xl overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Сайт</TableHead>
              <TableHead className="text-center w-20">Слов</TableHead>
              <TableHead className="text-center w-14">H2</TableHead>
              <TableHead className="text-center w-14">FAQ</TableHead>
              <TableHead className="text-center w-14">Цены</TableHead>
              <TableHead className="text-center w-16">Отзывы</TableHead>
              <TableHead className="text-center w-16">Schema</TableHead>
              <TableHead className="text-center w-14">Видео</TableHead>
              <TableHead className="min-w-[160px]">Фразы</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* YOUR SITE row */}
            {ct && (
              <TableRow className="border border-purple-500/40 bg-purple-500/10">
                <TableCell className="font-bold text-foreground">
                  ⭐ ВАШ САЙТ
                </TableCell>
                <TableCell className={`text-center font-bold ${numColor(ct.your_site.content_length_words, avgWords)}`}>{ct.your_site.content_length_words}</TableCell>
                <TableCell className={`text-center font-bold ${numColor(ct.your_site.h2_count, avgH2)}`}>{ct.your_site.h2_count}</TableCell>
                <TableCell className="text-center"><BoolCell value={ct.your_site.has_faq} /></TableCell>
                <TableCell className="text-center"><BoolCell value={ct.your_site.has_price_block} /></TableCell>
                <TableCell className="text-center"><BoolCell value={ct.your_site.has_reviews} /></TableCell>
                <TableCell className="text-center"><BoolCell value={ct.your_site.has_schema} /></TableCell>
                <TableCell className="text-center"><BoolCell value={ct.your_site.has_video} /></TableCell>
                <TableCell className="text-muted-foreground text-xs">—</TableCell>
              </TableRow>
            )}
            {/* Competitor rows */}
            {competitors.map((c, i) => (
              <TableRow key={i} className={!c.is_analyzed ? 'opacity-40' : ''}>
                <TableCell className="text-foreground">
                  {c.is_analyzed ? (
                    <div className="flex items-center gap-1.5">
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[160px] hover:text-primary transition-colors">
                        {c.domain}
                      </a>
                      <span className="text-xs text-muted-foreground/30">#{c.position}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">{c.domain} — не проанализирован</span>
                  )}
                </TableCell>
                <TableCell className={`text-center ${c.is_analyzed ? numColor(c.content_length_words, avgWords) : ''}`}>{c.is_analyzed ? c.content_length_words : '—'}</TableCell>
                <TableCell className={`text-center ${c.is_analyzed ? numColor(c.h2_count, avgH2) : ''}`}>{c.is_analyzed ? c.h2_count : '—'}</TableCell>
                <TableCell className="text-center">{c.is_analyzed ? <BoolCell value={c.has_faq} /> : '—'}</TableCell>
                <TableCell className="text-center">{c.is_analyzed ? <BoolCell value={c.has_price_block} /> : '—'}</TableCell>
                <TableCell className="text-center">{c.is_analyzed ? <BoolCell value={c.has_reviews} /> : '—'}</TableCell>
                <TableCell className="text-center">{c.is_analyzed ? <BoolCell value={c.has_schema} /> : '—'}</TableCell>
                <TableCell className="text-center">{c.is_analyzed ? <BoolCell value={c.has_video} /> : '—'}</TableCell>
                <TableCell>
                  {c.is_analyzed && c.top_phrases?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {c.top_phrases.slice(0, 2).map((p, j) => (
                        <span key={j} className="text-xs bg-white/5 px-1.5 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  ) : '—'}
                </TableCell>
              </TableRow>
            ))}
            {/* Average row */}
            {ct && (
              <TableRow className="bg-blue-500/10 font-medium">
                <TableCell className="text-blue-300">СРЕДНЕЕ</TableCell>
                <TableCell className="text-center text-blue-300">{ct.avg_top10.content_length_words}</TableCell>
                <TableCell className="text-center text-blue-300">{ct.avg_top10.h2_count}</TableCell>
                <TableCell className="text-center"><BoolCell value={ct.avg_top10.has_faq} /></TableCell>
                <TableCell className="text-center"><BoolCell value={ct.avg_top10.has_price_block} /></TableCell>
                <TableCell className="text-center"><BoolCell value={ct.avg_top10.has_reviews} /></TableCell>
                <TableCell className="text-center"><BoolCell value={ct.avg_top10.has_schema} /></TableCell>
                <TableCell className="text-center"><BoolCell value={ct.avg_top10.has_video} /></TableCell>
                <TableCell className="text-blue-300 text-xs">—</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* BLOCK D: Insights */}
      {ct && ct.insights && ct.insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Что взять у конкурентов
          </h3>
          <div className="grid gap-3">
            {ct.insights.map((insight, i) => {
              const priority = insightPriority(insight);
              return (
                <div key={i} className="border rounded-xl p-4 bg-card/50 backdrop-blur flex items-start gap-3">
                  <span className="text-lg">💡</span>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground">{insight}</p>
                    <Badge className={`text-xs ${priority.color}`}>{priority.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BLOCK E: Tag Cloud */}
      {phraseFreq.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Ключевые фразы из заголовков конкурентов</h3>
            <p className="text-xs text-muted-foreground mt-1">Проанализированы H1 и H2 конкурентов в выдаче</p>
          </div>
          <div className="flex flex-wrap gap-2 border rounded-xl p-5 bg-card/50 backdrop-blur">
            {phraseFreq.map(([phrase, count], i) => {
              const sizeClass = count >= 3 ? 'text-base opacity-100 text-purple-300 font-medium' : count >= 2 ? 'text-sm opacity-80' : 'text-xs opacity-60';
              return (
                <button
                  key={i}
                  onClick={() => {
                    navigator.clipboard.writeText(phrase);
                    toast({ title: "Скопировано!", description: phrase });
                  }}
                  className={`${sizeClass} bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer`}
                >
                  {phrase} {count > 1 && <span className="text-xs text-muted-foreground">×{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorsTable;
