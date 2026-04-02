import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScoreCards from "@/components/site-check/ScoreCards";
import FullReportView from "@/components/site-check/FullReportView";
import CompetitorsTable from "@/components/site-check/CompetitorsTable";

import DirectMeta from "@/components/site-check/DirectMeta";
import KeywordsSection from "@/components/site-check/KeywordsSection";
import MinusWordsSection from "@/components/site-check/MinusWordsSection";
import DownloadButtons from "@/components/site-check/DownloadButtons";
import { getFullScan } from "@/lib/site-check-api";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, ExternalLink, Loader2, History, AlertTriangle, Bot, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { addToHistory, getHistory } from "@/utils/scanHistory";
import { useToast } from "@/hooks/use-toast";

const SiteCheckResult = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const previousScores = useMemo(() => {
    if (!data?.url || !scanId) return undefined;
    const history = getHistory();
    const prev = history.find(h => h.url === data.url && h.scanId !== scanId && h.scores);
    return prev?.scores;
  }, [data?.url, scanId]);

  useEffect(() => {
    if (!scanId) {
      setError("ID скана не найден");
      setLoading(false);
      return;
    }
    getFullScan(scanId)
      .then((d) => {
        setData(d);
        if (d && scanId) {
          addToHistory({ scanId, url: d.url, date: new Date().toISOString(), scores: d.scores as any });
        }
      })
      .catch((e) => {
        setError(e.message || "Не удалось загрузить отчёт");
        toast({ title: "Ошибка", description: "Не удалось загрузить результаты", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [scanId, toast]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-4 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Не удалось загрузить отчёт</h1>
            <p className="text-muted-foreground">{error || "Данные не найдены"}</p>
            <Link to="/tools/site-check" className="text-primary inline-block mt-4">
              ← Запустить новую проверку
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const defaultScores = { total: 0, seo: 0, direct: 0, schema: 0, ai: 0 };
  const rawScores = data.scores;
  const scores = rawScores && typeof rawScores === "object" && !Array.isArray(rawScores)
    ? { ...defaultScores, ...(rawScores as any) }
    : null;

  const issues = Array.isArray(data.issues) ? data.issues : [];
  const rawCompetitors = Array.isArray(data.competitors) ? data.competitors : [];
  const competitors = rawCompetitors.filter((c: any) => c._type === 'competitor');
  const comparisonTable = rawCompetitors.find((c: any) => c._type === 'comparison_table') || null;
  const directMeta = rawCompetitors.find((c: any) => c._type === 'direct_meta') || null;
  const directAdMeta = rawCompetitors.find((c: any) => c._type === 'direct_ad_meta' || c._direct_meta);
  const keywords = (Array.isArray(data.keywords) ? data.keywords : []).map((kw: any) => ({
    keyword: kw.phrase ?? kw.keyword ?? kw.word ?? '',
    volume: kw.frequency ?? kw.volume ?? 0,
    cluster: kw.cluster ?? kw.category ?? 'Общие',
    intent: kw.intent ?? '—',
    landing_needed: kw.landing_needed ?? false,
  }));
  const minusWords = (Array.isArray(data.minus_words) ? data.minus_words : []).map((w: any) => {
    if (typeof w === 'string') return { word: w.replace(/^-/, ''), type: 'general', reason: '' };
    return {
      word: (w.word ?? w.phrase ?? w.value ?? String(w)).replace(/^-/, ''),
      type: w.type ?? w.category ?? 'general',
      reason: w.reason ?? w.description ?? '',
    };
  });

  return (
    <>
      <Helmet>
        <title>Результат проверки — {data.url} | OwnDev</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link to="/tools/site-check" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Новая проверка
              </Link>
              <span className="text-muted-foreground/40">|</span>
              <Link to="/tools/site-check#history" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <History className="w-4 h-4" />
                История проверок
              </Link>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Полный GEO‑отчёт</h1>
              {data.is_spa && <Badge variant="outline" className="text-xs border-primary/50 text-primary">SPA</Badge>}
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
                {data.url}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {data.is_spa && (
              <div className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">Обнаружен SPA-сайт. Контент проанализирован после рендеринга JavaScript.</p>
              </div>
            )}
            {data.theme && (
              <p className="text-sm text-muted-foreground mt-1">Тематика: {data.theme}</p>
            )}
          </div>

          {scores && <ScoreCards scores={scores} previousScores={previousScores} />}

          <DownloadButtons
            url={data.url}
            theme={data.theme}
            scores={scores}
            issues={issues}
            keywords={keywords}
            minusWords={minusWords}
            competitors={competitors}
            scanDate={data.created_at}
            seoData={data.seo_data}
            comparisonTable={comparisonTable}
            directMeta={directMeta}
          />

          {/* Download llms.txt button */}
          <div className="flex justify-start">
            <button
              onClick={() => {
                import('@/utils/generateLlmsTxt').then(({ downloadLlmsTxt }) => {
                  downloadLlmsTxt({ url: data.url, theme: data.theme, keywords });
                });
              }}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              <Bot className="w-4 h-4" /> Скачать llms.txt для вашего сайта
            </button>
          </div>

          {issues.length > 0 && <FullReportView issues={issues} url={data.url} />}

          {competitors.length > 0 && (
            <CompetitorsTable
              competitors={competitors}
              comparisonTable={comparisonTable}
              directMeta={directMeta}
              userUrl={data.url}
            />
          )}
          {directAdMeta && <DirectMeta data={directAdMeta} />}

          {keywords.length > 0 && <KeywordsSection keywords={keywords} />}

          {minusWords.length > 0 && <MinusWordsSection minusWords={minusWords} />}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheckResult;
