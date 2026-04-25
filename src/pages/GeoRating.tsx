import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { apiUrl, apiHeaders } from "@/lib/api/config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ChevronDown, ChevronUp, ExternalLink, Share2, Copy, Search,
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import SiteBadge from "@/components/ui/site-badge";
import { type GeoRatingEntry, SNAPSHOT_META, mapDbRowToEntry } from "@/data/geo-rating-types";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const DEFAULT_CATEGORIES = ["Все"];
const SCORE_FILTERS = [
  { label: "Все", min: 0, max: 100 },
  { label: "80+", min: 80, max: 100 },
  { label: "60–79", min: 60, max: 79 },
  { label: "40–59", min: 40, max: 59 },
  { label: "<40", min: 0, max: 39 },
];
const SORT_OPTIONS = [
  { label: "Средний ↓", key: "avgScore" as const },
  { label: "LLM ↓", key: "llmScore" as const },
  { label: "SEO ↓", key: "seoScore" as const },
  { label: "Schema ↓", key: "schemaScore" as const },
  { label: "Direct ↓", key: "directScore" as const },
  { label: "Алфавит", key: "brandName" as const },
];

type SortKey = "avgScore" | "llmScore" | "seoScore" | "schemaScore" | "directScore" | "brandName";

const computeAvg = (r: any) =>
  Math.round(((r.llm_score ?? 0) + (r.seo_score ?? 0) + (r.schema_score ?? 0) + (r.direct_score ?? 0)) / 4);

const isEmptyRow = (r: any) =>
  (r.llm_score ?? 0) === 0 && (r.seo_score ?? 0) === 0 &&
  (r.schema_score ?? 0) === 0 && (r.direct_score ?? 0) === 0;

const isStaleRow = (r: any) => {
  if (!r.last_checked_at) return true;
  const days = (Date.now() - new Date(r.last_checked_at).getTime()) / 86400000;
  return days > 7;
};

const formatLast = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return "сегодня";
  if (days < 7) return `${days}д`;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
};

const scoreColor = (s: number) =>
  s >= 71 ? "text-emerald-400" : s >= 41 ? "text-yellow-400" : "text-red-400";

const BoolIcon = ({ value }: { value: boolean }) =>
  value ? (
    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  ) : (
    <XCircle className="w-4 h-4 text-muted-foreground/40" />
  );

const GeoRating = () => {
  const { toast } = useToast();
  const [cat, setCat] = useState("Все");
  const [scoreFi, setScoreFi] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("avgScore");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: rawRows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["geo-rating"],
    queryFn: async () => {
      const resp = await fetch(apiUrl('/site-check/geo-rating'), { headers: apiHeaders() });
      if (!resp.ok) throw new Error('Failed to fetch geo-rating');
      return resp.json();
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Map to typed entries and apply filters/sort
  const entries = useMemo(() => {
    const f = SCORE_FILTERS[scoreFi];
    let list = rawRows
      .map((r: any) => ({
        ...r,
        top_errors:
          (() => {
            try {
              let arr: any = r.top_errors;
              if (typeof arr === "string") arr = JSON.parse(arr);
              if (!Array.isArray(arr)) return [];
              return arr.map((e: any) =>
                typeof e === 'string' ? e : (e?.title ?? String(e))
              );
            } catch { return []; }
          })(),
      }))
      .filter((r: any) => {
        const a = computeAvg(r);
        return (cat === "Все" || r.category === cat) && a >= f.min && a <= f.max;
      });

    const sortDbKey: Record<Exclude<SortKey, "brandName" | "avgScore">, string> = {
      llmScore: "llm_score",
      seoScore: "seo_score",
      schemaScore: "schema_score",
      directScore: "direct_score",
    };

    list.sort((a: any, b: any) => {
      const ae = isEmptyRow(a), be = isEmptyRow(b);
      if (ae && !be) return 1;
      if (!ae && be) return -1;
      if (sortKey === "brandName") return a.display_name.localeCompare(b.display_name);
      if (sortKey === "avgScore") return computeAvg(b) - computeAvg(a);
      const k = sortDbKey[sortKey];
      return (b[k] ?? 0) - (a[k] ?? 0);
    });

    return list.map((r: any, idx: number) => ({
      id: r.id,
      entry: mapDbRowToEntry(r, idx + 1),
      raw: r,
    }));
  }, [rawRows, cat, scoreFi, sortKey]);

  const CATEGORIES = useMemo(() => {
    const cats = Array.from(new Set(rawRows.map((r: any) => r.category as string))).sort();
    return ["Все", ...cats];
  }, [rawRows]);

  const nonEmpty = useMemo(() => rawRows.filter((r: any) => !isEmptyRow(r)), [rawRows]);
  const avgOf = (key: string) =>
    nonEmpty.length
      ? Math.round(nonEmpty.reduce((s: number, r: any) => s + (r[key] ?? 0), 0) / nonEmpty.length)
      : 0;
  const avgLlm = avgOf("llm_score");
  const avgSchema = avgOf("schema_score");
  const avgDirect = avgOf("direct_score");
  const pctLlms = rawRows.length
    ? Math.round((rawRows.filter((r: any) => r.has_llms_txt).length / rawRows.length) * 100)
    : 0;

  const lastUpdate = rawRows.length
    ? new Date(
        Math.max(...rawRows.map((r: any) => new Date(r.last_checked_at).getTime()))
      ).toLocaleDateString("ru-RU")
    : "—";

  const handleShare = () => {
    const url = `${window.location.origin}/geo-rating?utm_source=share&utm_medium=link&utm_campaign=geo_rating_2026`;
    navigator.clipboard.writeText(url);
    toast({ title: "Ссылка скопирована", description: "Поделитесь рейтингом с коллегами" });
  };

  const copyBadgeCode = (domain: string, rank: number) => {
    const code = `<a href="https://owndev.ru/geo-rating" target="_blank" rel="noopener"><img src="https://owndev.ru/badge/geo-top${rank <= 10 ? 10 : 30}.svg" alt="GEO Рейтинг Рунета — Топ-${rank <= 10 ? 10 : 30}" width="200"/></a>`;
    navigator.clipboard.writeText(code);
    toast({ title: "Код бейджа скопирован" });
  };

  return (
    <>
      <Helmet>
        <title>GEO Рейтинг Рунета 2026 — рейтинг AI-готовности сайтов | OWNDEV</title>
        <meta name="description" content="Рейтинг AI-готовности 100 самых посещаемых сайтов России. LLM Score, Schema, llms.txt — обновляется еженедельно." />
        <link rel="canonical" href="https://owndev.ru/geo-rating" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org", "@type": "Dataset",
            name: "GEO Рейтинг Рунета 2026",
            description: "Рейтинг AI-готовности популярных сайтов России",
            url: "https://owndev.ru/geo-rating",
            creator: { "@type": "Organization", name: "OWNDEV" },
          })}
        </script>
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-20 pb-16">
        {/* Compact hero */}
        <section className="container mx-auto px-4 mb-4 mt-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold leading-tight">
                GEO Рейтинг <span className="text-primary">Рунета 2026</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {rawRows.length} сайтов · обновлено {lastUpdate} ·{" "}
                <Link to="/geo-rating/methodology" className="text-primary hover:underline">
                  методология
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button asChild size="sm" variant="hero">
                <Link to="/tools/site-check">
                  <Search className="w-3.5 h-3.5 mr-1.5" />Проверить
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={handleShare} aria-label="Поделиться">
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} aria-label="Обновить">
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <Collapsible className="mt-2">
            <CollapsibleTrigger className="text-[11px] text-muted-foreground/70 hover:text-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Показать средние по выборке
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: "Сайтов", value: rawRows.length },
                  { label: "Ср. LLM", value: avgLlm },
                  { label: "Ср. Schema", value: avgSchema },
                  { label: "Ср. Direct", value: avgDirect },
                  { label: "С llms.txt", value: `${pctLlms}%` },
                ].map((s) => (
                  <div key={s.label} className="border border-border/30 rounded-md px-2 py-1.5 bg-card/40">
                    <div className="text-sm font-bold text-primary leading-none">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* Sticky filter bar — compact selects */}
        <section className="sticky top-16 z-20 bg-background/85 backdrop-blur border-b border-border/20 mb-3">
          <div className="container mx-auto px-4 py-2 flex flex-wrap items-center gap-2">
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c: string) => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(scoreFi)} onValueChange={(v) => setScoreFi(Number(v))}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Скор" />
              </SelectTrigger>
              <SelectContent>
                {SCORE_FILTERS.map((f, i) => (
                  <SelectItem key={f.label} value={String(i)} className="text-xs">
                    Скор: {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.key} value={o.key} className="text-xs">
                    Сорт: {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-[11px] text-muted-foreground ml-auto">
              {entries.length} из {rawRows.length}
            </span>
          </div>
        </section>

        <section className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Загрузка рейтинга…</div>
          ) : (
            <div className="rounded-xl border border-border/20 overflow-hidden">
              <div className="hidden md:grid grid-cols-[2.5rem_1fr_7rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_4rem] gap-2 px-4 py-2.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider border-b border-border/15 bg-card/60 sticky top-0 z-10">
                <span>#</span><span>Сайт</span><span>Категория</span>
                <span>LLM</span><span>SEO</span>
                <span className="text-center">Schema</span><span className="text-center">Direct</span>
                <span className="text-center">llms.txt</span>
                <span className="text-center">Ошибки</span>
                <span className="text-center">Last</span>
              </div>

              {entries.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">Нет сайтов по выбранным фильтрам</div>
              )}

              {entries.map(({ id, entry, raw }) => {
                const isOpen = expanded === id;
                const isTopThree = entry.rank <= 3;
                const empty = isEmptyRow(raw);
                const stale = isStaleRow(raw);
                const avg = computeAvg(raw);
                const renderScore = (s: number, extra = "") =>
                  empty ? <span className={`text-muted-foreground/50 ${extra}`}>—</span>
                        : <span className={`${scoreColor(s)} ${extra}`}>{s}</span>;
                return (
                  <div key={id}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : id)}
                      className={`w-full text-left grid grid-cols-[1fr_auto] md:grid-cols-[2.5rem_1fr_7rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_4rem] gap-2 px-4 py-2.5 items-center transition-colors hover:bg-white/[0.03] border-b border-border/10 ${isTopThree && !empty ? "border-l-2 border-l-yellow-500/40" : "border-l-2 border-l-transparent"} ${empty ? "opacity-40" : ""}`}
                    >
                      <div className="md:hidden flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground/60 w-5 text-right">{entry.rank}</span>
                        <SiteBadge domain={entry.domain} brandName={entry.brandName} size={24} />
                        <span className="font-medium text-sm truncate">{entry.domain}</span>
                        {(stale || empty) && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 ml-auto" />}
                        <Badge className={`${stale || empty ? "" : "ml-auto"} text-[10px] shrink-0 ${empty ? "bg-muted/30 text-muted-foreground" : avg >= 71 ? "bg-emerald-500/20 text-emerald-400" : avg >= 41 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{empty ? "—" : avg}</Badge>
                      </div>
                      <div className="md:hidden flex items-center justify-end">
                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground/50" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/50" />}
                      </div>
                      <span className="hidden md:block text-sm text-muted-foreground/60">{entry.rank}</span>
                      <span className="hidden md:flex items-center gap-2 font-medium text-sm">
                        <SiteBadge domain={entry.domain} brandName={entry.brandName} />
                        <span className="truncate">{entry.domain}{entry.brandName && entry.brandName !== entry.domain && <span className="text-muted-foreground/50 text-xs font-normal ml-1 max-w-[120px] truncate inline-block align-bottom">{entry.brandName}</span>}</span>
                        {stale && !empty && <AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0" aria-label="Данные устарели" />}
                      </span>
                      <span className="hidden md:block text-xs text-muted-foreground/60">{entry.category}</span>
                      <span className="hidden md:block text-sm font-bold">{renderScore(entry.llmScore)}</span>
                      <span className="hidden md:block text-sm">{renderScore(entry.seoScore)}</span>
                      <span className="hidden md:block text-sm text-center">{renderScore(entry.schemaScore)}</span>
                      <span className="hidden md:block text-sm text-center">{renderScore(entry.directScore)}</span>
                      <span className="hidden md:flex justify-center"><BoolIcon value={entry.hasLlmsTxt} /></span>
                      <span className="hidden md:block text-xs text-muted-foreground/50 text-center">{empty ? "—" : entry.issuesCount}</span>
                      <span className="hidden md:block text-[11px] text-muted-foreground/60 text-center">{formatLast(entry.verifiedAt)}</span>
                    </button>

                    {isOpen && (
                      <div className="px-4 py-4 border-b border-border/10 bg-card/30">
                        <div className="grid grid-cols-2 gap-3 mb-4 max-w-md">
                          <div className="border border-border/15 rounded-lg p-3 text-center">
                            <div className={`text-2xl font-bold ${empty ? "text-muted-foreground/50" : scoreColor(entry.llmScore)}`}>{empty ? "—" : entry.llmScore}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">LLM Score</div>
                          </div>
                          <div className="border border-border/15 rounded-lg p-3 text-center">
                            <div className={`text-2xl font-bold ${empty ? "text-muted-foreground/50" : scoreColor(entry.seoScore)}`}>{empty ? "—" : entry.seoScore}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">SEO Score</div>
                          </div>
                          <div className="border border-border/15 rounded-lg p-3 text-center">
                            <div className={`text-2xl font-bold ${empty ? "text-muted-foreground/50" : scoreColor(entry.schemaScore)}`}>{empty ? "—" : entry.schemaScore}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Schema Score</div>
                          </div>
                          <div className="border border-border/15 rounded-lg p-3 text-center">
                            <div className={`text-2xl font-bold ${empty ? "text-muted-foreground/50" : scoreColor(entry.directScore)}`}>{empty ? "—" : entry.directScore}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">Direct Score</div>
                          </div>
                        </div>
                        {entry.topErrors?.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-medium text-muted-foreground/70 mb-1.5">Основные проблемы:</div>
                            <ul className="space-y-1">
                              {(entry.topErrors ?? []).slice(0, 3).map((e: any, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />{typeof e === 'string' ? e : (e?.title ?? String(e))}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground/60 mb-3 flex items-center gap-2 flex-wrap">
                          <span>Последняя проверка: {entry.verifiedAt ? new Date(entry.verifiedAt).toLocaleDateString("ru-RU") : "—"}</span>
                          {(stale || empty) && (
                            <span className="inline-flex items-center gap-1 text-yellow-400">
                              <AlertTriangle className="w-3 h-3" /> {empty ? "Нет данных" : "Данные устарели"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <a href={`https://${entry.domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                            <ExternalLink className="w-3 h-3" />Открыть сайт
                          </a>
                          <Link to={`/tools/site-check?url=${entry.domain}`} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                            <Search className="w-3 h-3" />Проверить
                          </Link>
                          <button onClick={() => copyBadgeCode(entry.domain, entry.rank)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            <Copy className="w-3 h-3" />Бейдж
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default GeoRating;
