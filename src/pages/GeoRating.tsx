import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ExternalLink, Share2, Copy, Trophy, Search, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type GeoRatingRow = {
  id: string;
  domain: string;
  display_name: string;
  category: string;
  llm_score: number;
  seo_score: number;
  schema_score: number;
  direct_score: number;
  has_llms_txt: boolean;
  has_faqpage: boolean;
  has_schema: boolean;
  errors_count: number;
  top_errors: string[];
  last_checked_at: string;
};

const CATEGORIES = ["Все", "E-commerce", "Медиа", "Банки", "Сервисы", "Образование", "Госорганы", "Телеком"];
const SCORE_FILTERS = [
  { label: "Все", min: 0, max: 100 },
  { label: "80+", min: 80, max: 100 },
  { label: "60–79", min: 60, max: 79 },
  { label: "40–59", min: 40, max: 59 },
  { label: "<40", min: 0, max: 39 },
];
const SORT_OPTIONS = [
  { label: "LLM Score ↓", key: "llm_score" as const },
  { label: "SEO Score ↓", key: "seo_score" as const },
  { label: "Алфавит", key: "display_name" as const },
];

const scoreColor = (s: number) =>
  s >= 71 ? "text-emerald-400" : s >= 41 ? "text-yellow-400" : "text-red-400";
const scoreBg = (s: number) =>
  s >= 71 ? "bg-emerald-500/20 text-emerald-400" : s >= 41 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400";

const GeoRating = () => {
  const { toast } = useToast();
  const [cat, setCat] = useState("Все");
  const [scoreFi, setScoreFi] = useState(0);
  const [sortKey, setSortKey] = useState<"llm_score" | "seo_score" | "display_name">("llm_score");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["geo-rating"],
    queryFn: async () => {
      const { data, error } = await supabase.from("geo_rating").select("*");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        top_errors: typeof r.top_errors === "string" ? JSON.parse(r.top_errors) : (r.top_errors ?? []),
      })) as GeoRatingRow[];
    },
  });

  const filtered = useMemo(() => {
    const f = SCORE_FILTERS[scoreFi];
    let list = rows.filter(
      (r) =>
        (cat === "Все" || r.category === cat) &&
        r.llm_score >= f.min &&
        r.llm_score <= f.max
    );
    list.sort((a, b) => {
      if (sortKey === "display_name") return a.display_name.localeCompare(b.display_name);
      return (b as any)[sortKey] - (a as any)[sortKey];
    });
    return list;
  }, [rows, cat, scoreFi, sortKey]);

  const avgLlm = rows.length ? Math.round(rows.reduce((s, r) => s + r.llm_score, 0) / rows.length) : 0;
  const pctLlms = rows.length ? Math.round((rows.filter((r) => r.has_llms_txt).length / rows.length) * 100) : 0;
  const pctFaq = rows.length ? Math.round((rows.filter((r) => r.has_faqpage).length / rows.length) * 100) : 0;

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

  const lastUpdate = rows.length ? new Date(Math.max(...rows.map((r) => new Date(r.last_checked_at).getTime()))).toLocaleDateString("ru-RU") : "—";

  return (
    <>
      <Helmet>
        <title>GEO Рейтинг Рунета 2026 — рейтинг AI-готовности сайтов | OWNDEV</title>
        <meta name="description" content="Рейтинг AI-готовности 100 самых посещаемых сайтов России. LLM Score, Schema, llms.txt — обновляется еженедельно." />
        <link rel="canonical" href="https://owndev.ru/geo-rating" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "GEO Рейтинг Рунета 2026",
          description: "Рейтинг AI-готовности популярных сайтов России",
          url: "https://owndev.ru/geo-rating",
          creator: { "@type": "Organization", name: "OWNDEV" },
        })}</script>
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            GEO Рейтинг <span className="text-primary">Рунета 2026</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Рейтинг AI-готовности самых посещаемых сайтов России. Обновляется еженедельно.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { label: "Сайтов", value: rows.length },
              { label: "Средний LLM Score", value: avgLlm },
              { label: "С llms.txt", value: `${pctLlms}%` },
              { label: "С FAQPage", value: `${pctFaq}%` },
            ].map((s) => (
              <div key={s.label} className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl px-6 py-4 min-w-[140px]">
                <div className="text-2xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
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
              Поделиться рейтингом
            </Button>
          </div>
        </section>

        {/* Filters */}
        <section className="container mx-auto px-4 mb-6">
          <div className="flex flex-col gap-4">
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
            <div className="rounded-xl border border-border/30 overflow-hidden bg-card/30 backdrop-blur-sm">
              {/* Desktop header */}
              <div className="hidden md:grid grid-cols-[3rem_1fr_8rem_5rem_5rem_4rem_4rem_4rem_5rem] gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border/20">
                <span>#</span><span>Сайт</span><span>Категория</span><span>LLM</span><span>SEO</span>
                <span>llms.txt</span><span>Schema</span><span>FAQ</span><span>Ошибки</span>
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">Нет сайтов по выбранным фильтрам</div>
              )}
              {filtered.map((row, idx) => {
                const rank = idx + 1;
                const isOpen = expanded === row.id;
                return (
                  <div key={row.id}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : row.id)}
                      className={`w-full text-left grid grid-cols-[1fr_auto] md:grid-cols-[3rem_1fr_8rem_5rem_5rem_4rem_4rem_4rem_5rem] gap-2 px-4 py-3 items-center transition-colors hover:bg-card/60 ${
                        idx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"
                      }`}
                    >
                      {/* Mobile layout */}
                      <div className="md:hidden flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6">{rank}</span>
                        {rank <= 10 && <Trophy className="w-3.5 h-3.5 text-yellow-400" />}
                        <span className="font-medium text-sm">{row.display_name}</span>
                        <Badge className={`ml-auto text-[10px] ${scoreBg(row.llm_score)}`}>{row.llm_score}</Badge>
                      </div>
                      <div className="md:hidden flex items-center justify-end">
                        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>

                      {/* Desktop layout */}
                      <span className="hidden md:flex items-center text-sm text-muted-foreground">
                        {rank <= 10 && <Trophy className="w-3.5 h-3.5 text-yellow-400 mr-1" />}
                        {rank}
                      </span>
                      <span className="hidden md:block font-medium text-sm">{row.display_name} <span className="text-muted-foreground text-xs">({row.domain})</span></span>
                      <span className="hidden md:block text-xs text-muted-foreground">{row.category}</span>
                      <span className={`hidden md:block text-sm font-bold ${scoreColor(row.llm_score)}`}>{row.llm_score}</span>
                      <span className={`hidden md:block text-sm ${scoreColor(row.seo_score)}`}>{row.seo_score}</span>
                      <span className="hidden md:block text-sm">{row.has_llms_txt ? "✓" : "✗"}</span>
                      <span className="hidden md:block text-sm">{row.has_schema ? "✓" : "✗"}</span>
                      <span className="hidden md:block text-sm">{row.has_faqpage ? "✓" : "✗"}</span>
                      <span className="hidden md:block text-xs text-muted-foreground">{row.errors_count}</span>
                    </button>

                    {/* Details panel */}
                    {isOpen && (
                      <div className="px-4 py-4 bg-card/50 backdrop-blur-sm border-t border-border/10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {[
                            { label: "LLM Score", val: row.llm_score },
                            { label: "SEO Score", val: row.seo_score },
                            { label: "Schema", val: row.schema_score },
                            { label: "Direct", val: row.direct_score },
                          ].map((s) => (
                            <div key={s.label} className="bg-card/60 border border-border/20 rounded-lg p-3 text-center">
                              <div className={`text-xl font-bold ${scoreColor(s.val)}`}>{s.val}</div>
                              <div className="text-[10px] text-muted-foreground">{s.label}</div>
                            </div>
                          ))}
                        </div>
                        {row.top_errors.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-medium text-muted-foreground mb-2">Основные проблемы:</div>
                            <ul className="space-y-1">
                              {row.top_errors.slice(0, 3).map((e, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                                  {e}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="default">
                            <Link to={`/tools/site-check?url=${row.domain}`}>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Полный аудит
                            </Link>
                          </Button>
                          {rank <= 10 && (
                            <Button size="sm" variant="outline" onClick={() => copyBadgeCode(row.domain, rank)}>
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
          <p className="text-center text-xs text-muted-foreground mt-6">
            Данные обновлены: {lastUpdate}. Методология: 50+ параметров SEO, Schema.org, AI-готовности.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default GeoRating;
