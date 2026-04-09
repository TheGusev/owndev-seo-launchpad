import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Share2,
  Copy,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SiteBadge from "@/components/ui/site-badge";
import {
  type GeoRatingEntry,
  SNAPSHOT_META,
  mapDbRowToEntry,
} from "@/data/geo-rating-types";

const DEFAULT_CATEGORIES = ["Все"];
const SCORE_FILTERS = [
  { label: "Все", min: 0, max: 100 },
  { label: "80+", min: 80, max: 100 },
  { label: "60–79", min: 60, max: 79 },
  { label: "40–59", min: 40, max: 59 },
  { label: "<40", min: 0, max: 39 },
];
const SORT_OPTIONS = [
  { label: "LLM Score ↓", key: "llmScore" as const },
  { label: "SEO Score ↓", key: "seoScore" as const },
  { label: "Алфавит", key: "brandName" as const },
];

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
  const [sortKey, setSortKey] = useState<"llmScore" | "seoScore" | "brandName">("llmScore");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: rawRows = [], isLoading } = useQuery({
    queryKey: ["geo-rating"],
    queryFn: async () => {
      const { data, error } = await supabase.from("geo_rating").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Map to typed entries and apply filters/sort
  const entries = useMemo(() => {
    const f = SCORE_FILTERS[scoreFi];
    let list = rawRows
      .map((r: any) => ({
        ...r,
        top_errors:
          typeof r.top_errors === "string"
            ? JSON.parse(r.top_errors)
            : r.top_errors ?? [],
      }))
      .filter(
        (r: any) =>
          (cat === "Все" || r.category === cat) &&
          r.llm_score >= f.min &&
          r.llm_score <= f.max
      );

    // Sort by DB fields first, then map
    list.sort((a: any, b: any) => {
      if (sortKey === "brandName") return a.display_name.localeCompare(b.display_name);
      const dbKey = sortKey === "llmScore" ? "llm_score" : "seo_score";
      return b[dbKey] - a[dbKey];
    });

    return list.map((r: any, idx: number) => ({
      id: r.id,
      entry: mapDbRowToEntry(r, idx + 1),
    }));
  }, [rawRows, cat, scoreFi, sortKey]);

  const CATEGORIES = useMemo(() => {
    const cats = Array.from(new Set(rawRows.map((r: any) => r.category as string))).sort();
    return ["Все", ...cats];
  }, [rawRows]);

  const avgLlm = rawRows.length
    ? Math.round(rawRows.reduce((s: number, r: any) => s + r.llm_score, 0) / rawRows.length)
    : 0;
  const pctLlms = rawRows.length
    ? Math.round((rawRows.filter((r: any) => r.has_llms_txt).length / rawRows.length) * 100)
    : 0;
  const pctFaq = rawRows.length
    ? Math.round((rawRows.filter((r: any) => r.has_faqpage).length / rawRows.length) * 100)
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
        <meta
          name="description"
          content="Рейтинг AI-готовности 100 самых посещаемых сайтов России. LLM Score, Schema, llms.txt — обновляется еженедельно."
        />
        <link rel="canonical" href="https://owndev.ru/geo-rating" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "GEO Рейтинг Рунета 2026",
            description: "Рейтинг AI-готовности популярных сайтов России",
            url: "https://owndev.ru/geo-rating",
            creator: { "@type": "Organization", name: "OWNDEV" },
          })}
        </script>
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        {/* Hero — product, not landing */}
        <section className="container mx-auto px-4 mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              GEO Рейтинг <span className="text-primary">Рунета 2026</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto mb-6">
              AI-готовность популярных сайтов России — аналитический snapshot на основе автоматического аудита OWNDEV.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {[
                { label: "Сайтов в выборке", value: rawRows.length },
                { label: "Ср. LLM Score", value: avgLlm },
                { label: "С llms.txt", value: `${pctLlms}%` },
                { label: "С FAQPage", value: `${pctFaq}%` },
              ].map((s) => (
                <div
                  key={s.label}
                  className="border border-border/30 rounded-lg px-5 py-3 min-w-[120px] bg-card/40"
                >
                  <div className="text-xl font-bold text-primary">{s.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trust block */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-muted-foreground mb-6">
              <span>Обновлено: {lastUpdate}</span>
              <Link to="/geo-rating/methodology" className="hover:text-foreground transition-colors underline underline-offset-2">Методология: {SNAPSHOT_META.methodology}</Link>
              <span>Источник: {SNAPSHOT_META.source}</span>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/tools/site-check">
                  <Search className="w-4 h-4 mr-2" />
                  Проверить свой сайт
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Поделиться
              </Button>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="container mx-auto px-4 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-2">Категория:</span>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    cat === c
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-card/40 text-muted-foreground border-border/30 hover:bg-card/60"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-2">LLM Score:</span>
              {SCORE_FILTERS.map((f, i) => (
                <button
                  key={f.label}
                  onClick={() => setScoreFi(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    scoreFi === i
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-card/40 text-muted-foreground border-border/30 hover:bg-card/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-2">Сортировка:</span>
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setSortKey(o.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    sortKey === o.key
                      ? "bg-primary/20 text-primary border-primary/30"
                      : "bg-card/40 text-muted-foreground border-border/30 hover:bg-card/60"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Загрузка рейтинга…</div>
          ) : (
            <div className="rounded-xl border border-border/20 overflow-hidden">
              {/* Sticky desktop header */}
              <div className="hidden md:grid grid-cols-[2.5rem_1fr_7rem_4rem_4rem_3.5rem_3.5rem_3.5rem_4rem] gap-2 px-4 py-2.5 text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider border-b border-border/15 bg-card/60 sticky top-0 z-10">
                <span>#</span>
                <span>Сайт</span>
                <span>Категория</span>
                <span>LLM</span>
                <span>SEO</span>
                <span className="text-center">llms.txt</span>
                <span className="text-center">Schema</span>
                <span className="text-center">FAQ</span>
                <span className="text-center">Ошибки</span>
              </div>

              {entries.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Нет сайтов по выбранным фильтрам
                </div>
              )}

              {entries.map(({ id, entry }) => {
                const isOpen = expanded === id;
                const isTopThree = entry.rank <= 3;

                return (
                  <div key={id}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : id)}
                      className={`w-full text-left grid grid-cols-[1fr_auto] md:grid-cols-[2.5rem_1fr_7rem_4rem_4rem_3.5rem_3.5rem_3.5rem_4rem] gap-2 px-4 py-2.5 items-center transition-colors hover:bg-white/[0.03] border-b border-border/10 ${
                        isTopThree ? "border-l-2 border-l-yellow-500/40" : "border-l-2 border-l-transparent"
                      }`}
                    >
                      {/* Mobile */}
                      <div className="md:hidden flex items-center gap-2.5">
                        <span className="text-xs text-muted-foreground/60 w-5 text-right">
                          {entry.rank}
                        </span>
                        <SiteBadge domain={entry.domain} brandName={entry.brandName} size={24} />
                        <span className="font-medium text-sm truncate">{entry.brandName}</span>
                        <Badge
                          className={`ml-auto text-[10px] shrink-0 ${
                            entry.llmScore >= 71
                              ? "bg-emerald-500/20 text-emerald-400"
                              : entry.llmScore >= 41
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {entry.llmScore}
                        </Badge>
                      </div>
                      <div className="md:hidden flex items-center justify-end">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground/50" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </div>

                      {/* Desktop */}
                      <span className="hidden md:block text-sm text-muted-foreground/60">
                        {entry.rank}
                      </span>
                      <span className="hidden md:flex items-center gap-2 font-medium text-sm">
                        <SiteBadge domain={entry.domain} brandName={entry.brandName} />
                        <span className="truncate">
                          {entry.brandName}{" "}
                          <span className="text-muted-foreground/50 text-xs font-normal">
                            {entry.domain}
                          </span>
                        </span>
                      </span>
                      <span className="hidden md:block text-xs text-muted-foreground/60">
                        {entry.category}
                      </span>
                      <span className={`hidden md:block text-sm font-bold ${scoreColor(entry.llmScore)}`}>
                        {entry.llmScore}
                      </span>
                      <span className={`hidden md:block text-sm ${scoreColor(entry.seoScore)}`}>
                        {entry.seoScore}
                      </span>
                      <span className="hidden md:flex justify-center">
                        <BoolIcon value={entry.hasLlmsTxt} />
                      </span>
                      <span className="hidden md:flex justify-center">
                        <BoolIcon value={entry.hasSchema} />
                      </span>
                      <span className="hidden md:flex justify-center">
                        <BoolIcon value={entry.hasFaq} />
                      </span>
                      <span className="hidden md:block text-xs text-muted-foreground/50 text-center">
                        {entry.issuesCount}
                      </span>
                    </button>

                    {/* Expanded details */}
                    {isOpen && (
                      <div className="px-4 py-4 border-b border-border/10 bg-card/30">
                        <div className="grid grid-cols-2 gap-3 mb-4 max-w-xs">
                          <div className="border border-border/15 rounded-lg p-3 text-center">
                            <div className={`text-2xl font-bold ${scoreColor(entry.llmScore)}`}>
                              {entry.llmScore}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">LLM Score</div>
                          </div>
                          <div className="border border-border/15 rounded-lg p-3 text-center">
                            <div className={`text-2xl font-bold ${scoreColor(entry.seoScore)}`}>
                              {entry.seoScore}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">SEO Score</div>
                          </div>
                        </div>

                        {entry.topErrors.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-medium text-muted-foreground/70 mb-1.5">
                              Основные проблемы:
                            </div>
                            <ul className="space-y-1">
                              {entry.topErrors.slice(0, 3).map((e: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-xs text-muted-foreground"
                                >
                                  <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                                  {e}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground/50 mb-3">
                          <span>
                            Проверено:{" "}
                            {entry.verifiedAt
                              ? new Date(entry.verifiedAt).toLocaleDateString("ru-RU")
                              : "—"}
                          </span>
                          <span>Источник: {SNAPSHOT_META.source}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="default">
                            <Link to={`/tools/site-check?url=${entry.domain}`}>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Полный аудит
                            </Link>
                          </Button>
                          {entry.rank <= 10 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyBadgeCode(entry.domain, entry.rank)}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Код бейджа Топ-10
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
            Данные обновлены: {lastUpdate} · Методология: {SNAPSHOT_META.methodology} · Источник: {SNAPSHOT_META.source}
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default GeoRating;
