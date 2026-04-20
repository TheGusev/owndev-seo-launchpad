import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Zap,
  Wrench,
  ArrowRight,
  Mail,
  FileDown,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";
import { FileText, RotateCcw } from "lucide-react";
import { apiUrl } from "@/lib/api/config";
import { startScan, getScanStatus, getFullScan } from "@/lib/api/scan";
import ResultAccordion from "@/components/site-check/ResultAccordion";
import IssueCard from "@/components/site-check/IssueCard";
import LlmJudgeSection, { type LlmJudgeData } from "@/components/site-check/LlmJudgeSection";
import type { Scan, IssueCard as IssueCardType } from "@/lib/site-check-types";
import { generatePdfReport } from "@/lib/generatePdfReport";
import { generateWordReport } from "@/lib/generateWordReport";
import type { ReportData } from "@/lib/reportHelpers";
import { useToast } from "@/hooks/use-toast";

type Goal = "calls" | "leads" | "sales";
type TrafficSource = "seo" | "direct" | "both";
type MainProblem = "no_leads" | "expensive_lead" | "no_conversion";

interface Barrier {
  category: string;
  severity: "critical" | "high" | "medium";
  title: string;
  description: string;
  fix: string;
  impact: string;
}

interface ConversionResult {
  url: string;
  domain: string;
  conversion_score: number;
  money_lost_estimate: string;
  barriers: Barrier[];
  direct_budget_waste: string;
  quick_wins: string[];
  fix_cost_estimate: {
    min: number;
    max: number;
    breakdown: string[];
    roi_months: number;
  };
  cta_recommendation: string;
}

const goalOptions: { value: Goal; label: string }[] = [
  { value: "calls", label: "Звонки" },
  { value: "leads", label: "Заявки" },
  { value: "sales", label: "Продажи" },
];
const trafficOptions: { value: TrafficSource; label: string }[] = [
  { value: "seo", label: "SEO / Яндекс" },
  { value: "direct", label: "Яндекс.Директ" },
  { value: "both", label: "Оба канала" },
];
const problemOptions: { value: MainProblem; label: string }[] = [
  { value: "no_leads", label: "Нет заявок" },
  { value: "expensive_lead", label: "Дорогой лид" },
  { value: "no_conversion", label: "Не конвертит" },
];

const formatRub = (n: number) => new Intl.NumberFormat("ru-RU").format(n) + " ₽";

const scoreCircleClass = (score: number) => {
  if (score >= 76) return "text-success border-success";
  if (score >= 51) return "text-warning border-warning";
  return "text-destructive border-destructive";
};
const severityBorder = (s: Barrier["severity"]) => {
  if (s === "critical") return "border-l-destructive";
  if (s === "high") return "border-l-warning";
  return "border-l-muted";
};

const ChoiceGroup = <T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) => (
  <div>
    <p className="text-sm font-medium mb-2 text-foreground">{label}</p>
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50 ${
            value === o.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border hover:border-primary/40 text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  </div>
);

const FullAudit = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [traffic, setTraffic] = useState<TrafficSource | null>(null);
  const [problem, setProblem] = useState<MainProblem | null>(null);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [siteCheckProgress, setSiteCheckProgress] = useState(0);
  const [siteCheckDone, setSiteCheckDone] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [siteCheckData, setSiteCheckData] = useState<Scan | null>(null);
  const [siteCheckError, setSiteCheckError] = useState<string | null>(null);

  const [croDone, setCroDone] = useState(false);
  const [croData, setCroData] = useState<ConversionResult | null>(null);
  const [croError, setCroError] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  useEffect(() => () => { if (pollRef.current) window.clearInterval(pollRef.current); }, []);

  const canSubmit =
    !!url.trim() && !!goal && !!traffic && !!problem && !running;

  const bothDone = siteCheckDone && croDone;
  const hasAnyResult = !!(siteCheckData || croData);
  const showResults = hasAnyResult;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setRunning(true);
    setError(null);
    setSiteCheckProgress(0);
    setSiteCheckDone(false);
    setSiteCheckData(null);
    setSiteCheckError(null);
    setScanId(null);
    setCroDone(false);
    setCroData(null);
    setCroError(null);

    const normalizedUrl = url.trim().startsWith("http")
      ? url.trim()
      : `https://${url.trim()}`;

    // Запускаем оба запроса параллельно
    const [siteCheckResp, croResp] = await Promise.allSettled([
      startScan(normalizedUrl, "page"),
      fetch(apiUrl("/conversion-audit/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizedUrl,
          goal,
          traffic_source: traffic,
          main_problem: problem,
        }),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data?.success) throw new Error(data?.error || `Ошибка ${r.status}`);
        return data as ConversionResult;
      }),
    ]);

    // CRO результат сразу
    if (croResp.status === "fulfilled") {
      setCroData(croResp.value);
    } else {
      setCroError(croResp.reason?.message || "CRO анализ не выполнен");
    }
    setCroDone(true);

    // SiteCheck — поллинг
    if (siteCheckResp.status === "fulfilled") {
      const id = siteCheckResp.value.scan_id;
      setScanId(id);
      pollRef.current = window.setInterval(async () => {
        try {
          const status = await getScanStatus(id);
          setSiteCheckProgress(status.progress_pct || 0);
          if (status.status === "done") {
            if (pollRef.current) window.clearInterval(pollRef.current);
            const result = await getFullScan(id);
            setSiteCheckData(result as Scan);
            setSiteCheckProgress(100);
            setSiteCheckDone(true);
            setRunning(false);
          } else if (status.status === "error") {
            if (pollRef.current) window.clearInterval(pollRef.current);
            setSiteCheckError("Аудит сайта завершился с ошибкой");
            setSiteCheckDone(true);
            setRunning(false);
          }
        } catch (err: any) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          setSiteCheckError(err?.message || "Не удалось получить статус");
          setSiteCheckDone(true);
          setRunning(false);
        }
      }, 3000);
    } else {
      setSiteCheckError(siteCheckResp.reason?.message || "Не удалось запустить аудит");
      setSiteCheckDone(true);
      // CRO мог уже завершиться — выключаем running
      if (croResp.status === "fulfilled" || croResp.status === "rejected") {
        setRunning(false);
      }
    }
  };

  const topIssues: IssueCardType[] = (siteCheckData?.issues || [])
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .slice(0, 5);

  const llmJudge = (siteCheckData as any)?.llm_judge as LlmJudgeData | null;

  const handleDownloadPdf = async () => {
    if (!hasAnyResult) return;
    setPdfLoading(true);
    try {
      let domain = croData?.domain || "";
      if (!domain && siteCheckData?.url) {
        try { domain = new URL(siteCheckData.url).hostname; } catch { domain = siteCheckData.url; }
      }
      if (!domain) {
        try { domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname; }
        catch { domain = url; }
      }
      const reportData: ReportData = {
        url: siteCheckData?.url || (croData?.url ?? url),
        domain,
        theme: siteCheckData?.theme || "Полный аудит сайта",
        scanDate: new Date().toISOString(),
        scores: (siteCheckData?.scores as any) || { total: 0, seo: 0, direct: 0, schema: 0, ai: 0 },
        issues: siteCheckData?.issues || [],
        keywords: siteCheckData?.keywords || [],
        minusWords: (siteCheckData as any)?.minus_words || [],
        competitors: siteCheckData?.competitors || [],
        comparisonTable: (siteCheckData as any)?.comparison_table || null,
        directMeta: (siteCheckData as any)?.direct_meta || null,
        seoData: (siteCheckData as any)?.seo_data || {},
        cro: croData
          ? {
              conversion_score: croData.conversion_score,
              money_lost_estimate: croData.money_lost_estimate,
              direct_budget_waste: croData.direct_budget_waste,
              barriers: croData.barriers || [],
              quick_wins: croData.quick_wins || [],
              fix_cost_estimate: croData.fix_cost_estimate || { min: 0, max: 0, breakdown: [], roi_months: 0 },
              cta_recommendation: croData.cta_recommendation || "",
            }
          : undefined,
      };
      await generatePdfReport(reportData);
      toast({ title: "✅ PDF готов", description: "Файл сохранён в загрузках" });
    } catch (e: any) {
      toast({ title: "Ошибка PDF", description: e?.message || "Попробуйте ещё раз", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Полный аудит сайта — GEO + SEO + CRO | OWNDEV</title>
        <meta
          name="description"
          content="Единственный бесплатный инструмент: GEO + SEO + CRO в одном отчёте. Узнайте почему сайт не работает, сколько теряете и что исправить в первую очередь."
        />
        <meta
          name="keywords"
          content="полный аудит сайта, seo geo cro аудит, почему сайт не продаёт, аудит конверсии и seo"
        />
        <link rel="canonical" href="https://owndev.ru/tools/full-audit" />
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-content { padding: 0 !important; }
            header, footer { display: none !important; }
          }
        `}</style>
      </Helmet>
      <Header />

      <main className="flex-1 container px-4 md:px-6 py-10 md:py-16 max-w-5xl mx-auto">
        {!showResults && (
          <div className="no-print">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                <LayoutDashboard className="w-3.5 h-3.5" /> Всё в одном
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3 font-serif">
                Полный аудит сайта
              </h1>
              <p className="text-muted-foreground text-lg">
                GEO + SEO + CRO — единый отчёт почему сайт не работает
                и сколько это стоит исправить
              </p>
            </div>

            <form
              onSubmit={handleStart}
              className="glass rounded-2xl p-5 md:p-8 space-y-6 border border-border"
            >
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">
                  Адрес сайта
                </label>
                <Input
                  type="text"
                  placeholder="https://your-site.ru"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  maxLength={300}
                  disabled={running}
                />
              </div>

              <ChoiceGroup<Goal>
                label="Главная цель"
                value={goal}
                options={goalOptions}
                onChange={setGoal}
                disabled={running}
              />
              <ChoiceGroup<TrafficSource>
                label="Откуда трафик"
                value={traffic}
                options={trafficOptions}
                onChange={setTraffic}
                disabled={running}
              />
              <ChoiceGroup<MainProblem>
                label="Главная проблема"
                value={problem}
                options={problemOptions}
                onChange={setProblem}
                disabled={running}
              />

              <Button
                type="submit"
                disabled={!canSubmit}
                size="lg"
                className="w-full md:w-auto"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Запускаем...
                  </>
                ) : (
                  <>Запустить полный аудит <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>

            {/* Loading dual progress */}
            {running && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 border border-border bg-card">
                  <div className="flex items-center gap-2 mb-3">
                    {siteCheckDone ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                    <h3 className="font-semibold">GEO + SEO аудит</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {siteCheckDone
                      ? siteCheckError
                        ? <span className="text-destructive">{siteCheckError}</span>
                        : "✓ Готово"
                      : `${siteCheckProgress}%...`}
                  </div>
                  {!siteCheckDone && (
                    <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${siteCheckProgress}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl p-5 border border-border bg-card">
                  <div className="flex items-center gap-2 mb-3">
                    {croDone ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                    <h3 className="font-semibold">CRO анализ</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {croDone
                      ? croError
                        ? <span className="text-destructive">{croError}</span>
                        : "✓ Готово"
                      : "Анализируем..."}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* RESULTS */}
        {showResults && (
          <div className="print-content space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 no-print">
              <h1 className="text-2xl md:text-3xl font-bold font-serif">
                Полный аудит: {croData?.domain || siteCheckData?.url}
              </h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={pdfLoading || !hasAnyResult}
                title={running ? "Можно скачать сейчас, но полный отчёт — после завершения обоих анализов" : undefined}
              >
                {pdfLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Генерация...</>
                ) : (
                  <><FileDown className="w-4 h-4 mr-2" /> Скачать PDF</>
                )}
              </Button>
            </div>

            {/* Live status chips while still loading */}
            {!bothDone && (
              <div className="flex flex-wrap gap-2 no-print">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  croDone
                    ? croError
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : "bg-success/10 border-success/30 text-success"
                    : "bg-card border-border text-muted-foreground"
                }`}>
                  {croDone ? (
                    croError ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  CRO анализ {croDone ? (croError ? "— ошибка" : "готов") : "идёт..."}
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  siteCheckDone
                    ? siteCheckError
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : "bg-success/10 border-success/30 text-success"
                    : "bg-card border-border text-muted-foreground"
                }`}>
                  {siteCheckDone ? (
                    siteCheckError ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  GEO + SEO аудит {siteCheckDone ? (siteCheckError ? "— ошибка" : "готов") : `${siteCheckProgress}%`}
                </div>
              </div>
            )}

            {/* Section 1: Verdict */}
            <ResultAccordion title="Общий вердикт" defaultOpen>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {croData && (
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${scoreCircleClass(
                        croData.conversion_score,
                      )}`}
                    >
                      <div>
                        <div className="text-3xl font-bold">
                          {croData.conversion_score}
                        </div>
                        <div className="text-[10px] uppercase opacity-70">из 100</div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Конверсионный потенциал
                    </p>
                  </div>
                )}
                {siteCheckData?.scores && (
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-28 h-28 rounded-full border-4 flex items-center justify-center ${scoreCircleClass(
                        siteCheckData.scores.total,
                      )}`}
                    >
                      <div>
                        <div className="text-3xl font-bold">
                          {siteCheckData.scores.total}
                        </div>
                        <div className="text-[10px] uppercase opacity-70">из 100</div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Общий GEO + SEO Score
                    </p>
                  </div>
                )}
              </div>

              {croData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                  <div className="rounded-xl p-4 border border-destructive/30 bg-destructive/10">
                    <div className="flex items-center gap-2 mb-1.5 text-destructive">
                      <DollarSign className="w-4 h-4" />
                      <h4 className="font-semibold text-sm">Недополученный доход</h4>
                    </div>
                    <p className="text-sm text-foreground">{croData.money_lost_estimate}</p>
                  </div>
                  <div className="rounded-xl p-4 border border-warning/30 bg-warning/10">
                    <div className="flex items-center gap-2 mb-1.5 text-warning">
                      <TrendingDown className="w-4 h-4" />
                      <h4 className="font-semibold text-sm">Потери бюджета Директа</h4>
                    </div>
                    <p className="text-sm text-foreground">{croData.direct_budget_waste}</p>
                  </div>
                </div>
              )}
            </ResultAccordion>

            {/* Section 2: Technical barriers */}
            {topIssues.length > 0 && (
              <ResultAccordion
                title={`Технические барьеры (${topIssues.length})`}
                defaultOpen
              >
                <div className="space-y-3">
                  {topIssues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      siteUrl={siteCheckData?.url}
                    />
                  ))}
                </div>
              </ResultAccordion>
            )}

            {/* Section 3: Conversion barriers */}
            {croData?.barriers && croData.barriers.length > 0 && (
              <ResultAccordion
                title={`Конверсионные потери (${croData.barriers.length})`}
                defaultOpen
              >
                <div className="space-y-3">
                  {croData.barriers.map((b, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-4 border border-border bg-card border-l-4 ${severityBorder(
                        b.severity,
                      )}`}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {b.category}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide font-semibold opacity-70">
                          {b.severity}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{b.description}</p>
                      <div className="text-sm">
                        <span className="font-medium text-foreground">Решение: </span>
                        <span className="text-muted-foreground">{b.fix}</span>
                      </div>
                      {b.impact && (
                        <div className="text-sm mt-1 text-success">Эффект: {b.impact}</div>
                      )}
                    </div>
                  ))}
                </div>
              </ResultAccordion>
            )}

            {/* Section 4: AI visibility */}
            {llmJudge && llmJudge.systems?.length > 0 && (
              <ResultAccordion title="AI-видимость в нейросетях">
                <LlmJudgeSection data={llmJudge} />
              </ResultAccordion>
            )}

            {/* Section 5: Quick wins */}
            {croData?.quick_wins && croData.quick_wins.length > 0 && (
              <ResultAccordion title="Быстрые победы" defaultOpen>
                <ul className="space-y-2">
                  {croData.quick_wins.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Zap className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span className="text-foreground">{w}</span>
                    </li>
                  ))}
                </ul>
              </ResultAccordion>
            )}

            {/* Section 6: Fix cost */}
            {croData?.fix_cost_estimate && (
              <ResultAccordion title="Стоимость исправления" defaultOpen>
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-5 h-5 text-primary" />
                  <div className="text-2xl md:text-3xl font-bold">
                    {formatRub(croData.fix_cost_estimate.min)} —{" "}
                    {formatRub(croData.fix_cost_estimate.max)}
                  </div>
                </div>
                {croData.fix_cost_estimate.breakdown?.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {croData.fix_cost_estimate.breakdown.map((b, i) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span>•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {croData.fix_cost_estimate.roi_months > 0 && (
                  <p className="text-sm text-success font-medium">
                    Окупается за {croData.fix_cost_estimate.roi_months} мес.
                  </p>
                )}
              </ResultAccordion>
            )}

            {/* Section 7: CTA */}
            <div className="rounded-2xl p-6 border border-primary/30 bg-primary/5 text-center">
              {croData?.cta_recommendation && (
                <p className="text-base md:text-lg font-medium mb-4">
                  {croData.cta_recommendation}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center no-print">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading || !hasAnyResult}
                >
                  {pdfLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Генерация PDF...</>
                  ) : (
                    <><FileDown className="w-4 h-4 mr-2" /> Скачать PDF</>
                  )}
                </Button>
                <a href="mailto:dpd.tuva@mail.ru?subject=Полный аудит сайта">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Mail className="w-4 h-4 mr-2" />
                    Получить коммерческое предложение
                  </Button>
                </a>
                {scanId && (
                  <Link to={`/tools/site-check/result/${scanId}`}>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Детальный GEO-отчёт <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FullAudit;
