import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle, TrendingDown, DollarSign, Zap, Wrench, ArrowRight, Mail, Download } from "lucide-react";
import { apiUrl } from "@/lib/api/config";
import { generatePdfReport } from "@/lib/generatePdfReport";
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
  { value: "seo", label: "SEO" },
  { value: "direct", label: "Яндекс.Директ" },
  { value: "both", label: "Оба" },
];

const problemOptions: { value: MainProblem; label: string }[] = [
  { value: "no_leads", label: "Нет заявок" },
  { value: "expensive_lead", label: "Дорогой лид" },
  { value: "no_conversion", label: "Не конвертит" },
];

const scoreColor = (score: number) => {
  if (score >= 76) return "text-success border-success";
  if (score >= 51) return "text-warning border-warning";
  return "text-destructive border-destructive";
};

const severityClass = (s: Barrier["severity"]) => {
  if (s === "critical") return "border-l-destructive";
  if (s === "high") return "border-l-warning";
  return "border-l-muted";
};

const formatRub = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(n) + " ₽";

const ChoiceGroup = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) => (
  <div>
    <p className="text-sm font-medium mb-2 text-foreground">{label}</p>
    <div className="grid grid-cols-3 gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
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

const ConversionAudit = () => {
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState<Goal | null>(null);
  const [traffic, setTraffic] = useState<TrafficSource | null>(null);
  const [problem, setProblem] = useState<MainProblem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { toast } = useToast();

  const canSubmit = !!url.trim() && !!goal && !!traffic && !!problem && !loading;

  const handleDownloadPdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      const reportData: ReportData = {
        url: result.url,
        domain: result.domain,
        theme: "CRO-аудит",
        scanDate: new Date().toISOString(),
        scores: { total: result.conversion_score, seo: 0, direct: 0, schema: 0, ai: 0 },
        issues: [],
        keywords: [],
        minusWords: [],
        competitors: [],
        comparisonTable: null,
        directMeta: null,
        seoData: {},
        cro: {
          conversion_score: result.conversion_score,
          money_lost_estimate: result.money_lost_estimate,
          direct_budget_waste: result.direct_budget_waste,
          barriers: result.barriers || [],
          quick_wins: result.quick_wins || [],
          fix_cost_estimate: result.fix_cost_estimate,
          cta_recommendation: result.cta_recommendation,
        },
      };
      await generatePdfReport(reportData);
      toast({ title: "✅ PDF готов", description: "Файл сохранён" });
    } catch (e: any) {
      toast({ title: "Ошибка PDF", description: e?.message || "", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const normalizedUrl = url.trim().startsWith("http")
        ? url.trim()
        : `https://${url.trim()}`;
      const resp = await fetch(apiUrl("/conversion-audit/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalizedUrl,
          goal,
          traffic_source: traffic,
          main_problem: problem,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || `Ошибка ${resp.status}`);
      }
      setResult(data as ConversionResult);
    } catch (err: any) {
      setError(err?.message || "Не удалось выполнить анализ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Почему ваш сайт не продаёт — CRO-аудит | OWNDEV</title>
        <meta
          name="description"
          content="Бесплатный CRO-аудит за 60 секунд: конверсионные барьеры, потери бюджета, расчёт стоимости исправления."
        />
        <link rel="canonical" href="https://owndev.ru/tools/conversion-audit" />
      </Helmet>
      <Header />

      <main className="flex-1 container px-4 md:px-6 py-10 md:py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <TrendingDown className="w-3.5 h-3.5" /> CRO-аудит
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 font-serif">
            Почему ваш сайт не продаёт?
          </h1>
          <p className="text-muted-foreground text-lg">
            Бесплатный CRO-аудит за 60 секунд
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-5 md:p-8 space-y-6 border border-border"
        >
          <div>
            <label className="text-sm font-medium mb-2 block text-foreground">
              Адрес сайта
            </label>
            <Input
              type="text"
              placeholder="https://my-site.ru"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={300}
            />
          </div>

          <ChoiceGroup<Goal>
            label="Главная цель"
            value={goal}
            options={goalOptions}
            onChange={setGoal}
          />
          <ChoiceGroup<TrafficSource>
            label="Откуда трафик"
            value={traffic}
            options={trafficOptions}
            onChange={setTraffic}
          />
          <ChoiceGroup<MainProblem>
            label="Главная проблема"
            value={problem}
            options={problemOptions}
            onChange={setProblem}
          />

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full md:w-auto"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Анализируем...
              </>
            ) : (
              <>Найти причины <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="mt-8 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Анализируем ваш сайт...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-8 flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Не удалось выполнить анализ</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="mt-10 space-y-6">
            {/* Score */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 flex items-center justify-center ${scoreColor(
                  result.conversion_score,
                )}`}
              >
                <div>
                  <div className="text-4xl md:text-5xl font-bold">
                    {result.conversion_score}
                  </div>
                  <div className="text-xs uppercase tracking-wide opacity-70">
                    из 100
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Конверсионный потенциал · {result.domain}
              </p>
            </div>

            {/* Money lost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5 border border-destructive/30 bg-destructive/10">
                <div className="flex items-center gap-2 mb-2 text-destructive">
                  <DollarSign className="w-5 h-5" />
                  <h3 className="font-semibold">Недополученный доход</h3>
                </div>
                <p className="text-sm text-foreground">
                  {result.money_lost_estimate}
                </p>
              </div>
              <div className="rounded-2xl p-5 border border-warning/30 bg-warning/10">
                <div className="flex items-center gap-2 mb-2 text-warning">
                  <TrendingDown className="w-5 h-5" />
                  <h3 className="font-semibold">Потери бюджета Директа</h3>
                </div>
                <p className="text-sm text-foreground">
                  {result.direct_budget_waste}
                </p>
              </div>
            </div>

            {/* Barriers */}
            {result.barriers?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  Конверсионные барьеры
                </h2>
                <div className="space-y-3">
                  {result.barriers.map((b, i) => (
                    <div
                      key={i}
                      className={`rounded-xl p-4 border border-border bg-card border-l-4 ${severityClass(
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
                      <h3 className="font-semibold mb-1">{b.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {b.description}
                      </p>
                      <div className="text-sm">
                        <span className="font-medium text-foreground">
                          Решение:{" "}
                        </span>
                        <span className="text-muted-foreground">{b.fix}</span>
                      </div>
                      {b.impact && (
                        <div className="text-sm mt-1 text-success">
                          Эффект: {b.impact}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick wins */}
            {result.quick_wins?.length > 0 && (
              <div className="rounded-2xl p-5 border border-success/30 bg-success/10">
                <div className="flex items-center gap-2 mb-3 text-success">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-semibold">Быстрые победы</h3>
                </div>
                <ul className="space-y-2">
                  {result.quick_wins.map((w, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-success mt-0.5">→</span>
                      <span className="text-foreground">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fix cost */}
            {result.fix_cost_estimate && (
              <div className="rounded-2xl p-5 border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Стоимость исправления</h3>
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-3">
                  {formatRub(result.fix_cost_estimate.min)} —{" "}
                  {formatRub(result.fix_cost_estimate.max)}
                </div>
                {result.fix_cost_estimate.breakdown?.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {result.fix_cost_estimate.breakdown.map((b, i) => (
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
                {result.fix_cost_estimate.roi_months > 0 && (
                  <p className="text-sm text-success font-medium">
                    Окупается за {result.fix_cost_estimate.roi_months} мес.
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="rounded-2xl p-6 border border-primary/30 bg-primary/5 text-center">
              <p className="text-base md:text-lg font-medium mb-4">
                {result.cta_recommendation}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="w-full sm:w-auto"
                >
                  {pdfLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Готовим PDF...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" />Скачать PDF</>
                  )}
                </Button>
                <a href="mailto:dpd.tuva@mail.ru?subject=Коммерческое предложение по CRO-аудиту">
                  <Button variant="default" size="lg" className="w-full sm:w-auto">
                    <Mail className="w-4 h-4 mr-2" />
                    Получить коммерческое предложение
                  </Button>
                </a>
                <Link to="/tools/site-check">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Запустить полный GEO-аудит
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ConversionAudit;
