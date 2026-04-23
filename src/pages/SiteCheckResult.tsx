import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScoreCards from "@/components/site-check/ScoreCards";
import FullReportView from "@/components/site-check/FullReportView";
import HistoryChart from "@/components/site-check/HistoryChart";
import DownloadButtons from "@/components/site-check/DownloadButtons";
import LlmJudgeSection, { type LlmJudgeData } from "@/components/site-check/LlmJudgeSection";
import AiBoostSection from "@/components/site-check/AiBoostSection";
import GeoRatingNomination from "@/components/site-check/GeoRatingNomination";
import TechPassport from "@/components/site-check/TechPassport";
import ResultAccordion from "@/components/site-check/ResultAccordion";
import RedirectChain from "@/components/site-check/RedirectChain";
import RobotsAudit from "@/components/site-check/RobotsAudit";
import CROSignals from "@/components/site-check/CROSignals";
import BenchmarkCard from "@/components/site-check/BenchmarkCard";
import { getFullScan } from "@/lib/site-check-api";
import { judgeLlm, getTechPassport, getAiBoost } from "@/lib/api/tools";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, ExternalLink, History, AlertTriangle, Bot, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SkeletonResultsGrid } from "@/components/ui/skeleton-card";
import { addToHistory, getHistory } from "@/utils/scanHistory";
import { useToast } from "@/hooks/use-toast";

const SiteCheckResult = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [llmJudge, setLlmJudge] = useState<LlmJudgeData | null>(null);
  const [llmJudgeLoading, setLlmJudgeLoading] = useState(false);
  const [llmJudgeError, setLlmJudgeError] = useState<string | null>(null);
  const [techPassport, setTechPassport] = useState<any>(null);
  const [techPassportLoading, setTechPassportLoading] = useState(false);
  const [aiBoost, setAiBoost] = useState<any[] | null>(null);
  const [aiBoostLoading, setAiBoostLoading] = useState(false);
  const [aiBoostError, setAiBoostError] = useState<string | null>(null);

  const previousScores = useMemo(() => {
    if (!data?.url || !scanId) return undefined;
    const history = getHistory();
    const prev = history.find(h => h.url === data.url && h.scanId !== scanId && h.scores);
    return prev?.scores;
  }, [data?.url, scanId]);

  useEffect(() => {
    if (!scanId) { setError("ID скана не найден"); setLoading(false); return; }
    getFullScan(scanId)
      .then((d) => {
        setData(d);
        if (d && scanId) addToHistory({ scanId, url: d.url, date: new Date().toISOString(), scores: d.scores as any });
        if (d?.llm_judge) setLlmJudge(d.llm_judge as any);
        else if (d?.url && d?.status === 'done') triggerLlmJudge(scanId, d.url, d.theme);
        if ((d?.ai_boost as any)?.items) setAiBoost((d.ai_boost as any).items);
        if (d?.url) triggerTechPassport(d.url);
      })
      .catch((e) => {
        setError(e.message || "Не удалось загрузить отчёт");
        toast({ title: "Ошибка", description: "Не удалось загрузить результаты", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [scanId, toast]);

  const triggerLlmJudge = async (id: string, url: string, theme?: string) => {
    setLlmJudgeLoading(true);
    setLlmJudgeError(null);
    try {
      const result = await judgeLlm(id, url, theme);
      if (result) setLlmJudge(result);
    } catch (e: any) {
      console.error('LLM Judge error:', e);
      setLlmJudgeError(e?.message || 'Не удалось запустить AI-аудит');
    }
    finally { setLlmJudgeLoading(false); }
  };

  const triggerAiBoost = async () => {
    if (!data?.url) return;
    setAiBoostLoading(true);
    setAiBoostError(null);
    try {
      const result = await getAiBoost(data.url, data.theme, data.scores, data.issues, scanId);
      if (result?.items) setAiBoost(result.items);
      else setAiBoostError('Не удалось получить план');
    } catch (e: any) {
      setAiBoostError(e?.message || 'Ошибка');
    } finally {
      setAiBoostLoading(false);
    }
  };

  const triggerTechPassport = async (url: string) => {
    setTechPassportLoading(true);
    try {
      const result = await getTechPassport(url);
      if (result?.tech) setTechPassport(result);
    } catch (e) { console.error('Tech passport error:', e); }
    finally { setTechPassportLoading(false); }
  };

  if (loading) return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-5xl mx-auto px-4"><SkeletonResultsGrid /></div>
      </main>
      <Footer />
    </>
  );

  if (error || !data) return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Не удалось загрузить отчёт</h1>
          <p className="text-muted-foreground">{error || "Данные не найдены"}</p>
          <Link to="/tools/site-check" className="text-primary inline-block mt-4">← Запустить новую проверку</Link>
        </div>
      </main>
      <Footer />
    </>
  );

  const defaultScores = { total: 0, seo: 0, direct: 0, schema: 0, ai: 0, geo: 0, cro: 0 };
  const rawScores = data.scores;
  // Sprint 7 — мерджим top-level geoScore/seoScore/croScore с объектом scores,
  // чтобы ScoreCards увидел триаду даже если бэк отдал старый формат.
  const scores = rawScores && typeof rawScores === "object" && !Array.isArray(rawScores)
    ? {
        ...defaultScores,
        ...(rawScores as any),
        ...(typeof data.geoScore === "number" ? { geo: data.geoScore } : {}),
        ...(typeof data.seoScore === "number" ? { seo: data.seoScore } : {}),
        ...(typeof data.croScore === "number" ? { cro: data.croScore } : {}),
      }
    : null;
  const breakdown = (rawScores?.breakdown || rawScores?.seoBreakdown)
    ? {
        seo: rawScores?.seoBreakdown || rawScores?.breakdown?.seo || null,
        ai: rawScores?.breakdown?.ai || null,
        direct: rawScores?.breakdown?.direct || null,
        schema: rawScores?.breakdown?.schema || null,
      }
    : undefined;

  const issues = Array.isArray(data.issues) ? data.issues : [];
  // Sprint 2: competitors / keywords / minus_words / Direct ad — moved out of site-check

  // Tech passport summary badges for accordion header
  const techBadges = techPassport ? (
    <div className="flex items-center gap-1.5 flex-wrap">
      {techPassport.tech?.cms && <Badge variant="outline" className="text-[10px]">{techPassport.tech.cms}</Badge>}
      {techPassport.geoip?.country_flag && <Badge variant="outline" className="text-[10px]">{techPassport.geoip.country_flag} {techPassport.geoip.country_code}</Badge>}
    </div>
  ) : null;

  return (
    <>
      <Helmet>
        <title>{`Результат проверки - ${data.url} | OwnDev`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 space-y-4">
          {/* 1. Header */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Link to="/tools/site-check" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Новая проверка
              </Link>
              <span className="text-muted-foreground/40">|</span>
              <Link to="/tools/site-check#history" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <History className="w-4 h-4" /> История
              </Link>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Полный GEO-отчёт</h1>
              {data.is_spa && <Badge variant="outline" className="text-xs border-primary/50 text-primary">SPA</Badge>}
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
                {data.url} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {data.is_spa && (
              <div className="flex items-start gap-2 mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Обнаружен SPA-сайт. Контент проанализирован после рендеринга JavaScript.</p>
              </div>
            )}
            {data.theme && <p className="text-xs text-muted-foreground mt-1">Тематика: {data.theme}</p>}
          </div>

          {/* 2. Scores */}
          {scores && <ScoreCards scores={scores} previousScores={previousScores} breakdown={breakdown} />}

          {/* 2b. History trend chart */}
          {data?.url && <HistoryChart url={data.url} />}

          {/* 4. Tech Passport — full width */}
          {techPassport && (
            <div className="rounded-xl border border-border/50 bg-card/40 p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-foreground">Технический паспорт</h2>
                {techBadges}
              </div>
              <TechPassport data={techPassport} />
              {/* Sprint 5 — Redirects + headers */}
              {data.stage0 && (
                <div className="pt-2 border-t border-border/30">
                  <RedirectChain stage0={data.stage0} finalUrl={data.url} />
                </div>
              )}
            </div>
          )}

          {/* Sprint 5 — Sprint 3 detector outputs (показываются только если бэк прислал данные) */}
          {data.robots && (
            <ResultAccordion title="Доступ AI-ботов (robots.txt)" defaultOpen={false}>
              <RobotsAudit robots={data.robots} />
            </ResultAccordion>
          )}
          {data.cro && (
            <ResultAccordion title="CRO-сигналы: доверие, CTA, формы" defaultOpen={false}>
              <CROSignals cro={data.cro} />
            </ResultAccordion>
          )}
          {data.benchmark && (
            <ResultAccordion title={`Эталон категории «${data.benchmark.category}»`} defaultOpen={false}>
              <BenchmarkCard benchmark={data.benchmark} />
            </ResultAccordion>
          )}

          {techPassportLoading && !techPassport && (
            <div className="rounded-xl border border-border/50 bg-card/50 p-4 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Определяем технический стек...</p>
            </div>
          )}

          {/* 5. Issues / Fix plan */}
          {issues.length > 0 && (
            <ResultAccordion title={`План исправления (${issues.length})`} defaultOpen={true}>
              <FullReportView issues={issues} url={data.url} />
            </ResultAccordion>
          )}

          {/* 6. AI-видимость */}
          <ResultAccordion title="AI-видимость: проверка нейросетями" defaultOpen={false}>
            <LlmJudgeSection
              data={llmJudge}
              loading={llmJudgeLoading}
              error={llmJudgeError}
              onRetry={() => scanId && data?.url && triggerLlmJudge(scanId, data.url, data.theme)}
            />
          </ResultAccordion>

          {/* AI Boost */}
          <ResultAccordion title="AI Boost — план попадания в нейросети" defaultOpen={false}>
            <AiBoostSection
              items={aiBoost}
              loading={aiBoostLoading}
              error={aiBoostError}
              onRetry={triggerAiBoost}
              scanId={scanId}
            />
          </ResultAccordion>

          {/* 10. GEO Rating */}
          {scores && <GeoRatingNomination totalScore={scores.total} url={data.url} scanId={scanId} />}

          {/* 11. llms.txt */}
          <div className="flex justify-start">
            <button
              onClick={() => { import('@/utils/generateLlmsTxt').then(({ downloadLlmsTxt }) => { downloadLlmsTxt({ url: data.url, theme: data.theme, keywords: [] }); }); }}
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              <Bot className="w-4 h-4" /> Скачать llms.txt для вашего сайта
            </button>
          </div>

          {/* 12. Export */}
          <DownloadButtons
            url={data.url} theme={data.theme} scores={scores} issues={issues}
            scanDate={data.created_at} seoData={data.seo_data}
          />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheckResult;
