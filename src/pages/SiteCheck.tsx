import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScanForm from "@/components/site-check/ScanForm";
import ScanProgress from "@/components/site-check/ScanProgress";
import { startScan, getScanStatus } from "@/lib/site-check-api";
import type { ScanMode } from "@/lib/site-check-types";
import { ArrowRight, Globe, Trash2, Search, BrainCircuit, Target, Sparkles, Users, Key, Ban, ShieldCheck, FileText, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getHistory, clearHistory, type ScanHistoryItem } from "@/utils/scanHistory";
import type { LucideIcon } from "lucide-react";

function getPollInterval(elapsedMs: number, progressPct: number): number {
  // Первые 10 секунд — 1 сек (быстрые ранние стадии 5/10/20/35)
  if (elapsedMs < 10_000) return 1000;
  // Медленные LLM-стадии (Theme≈20%, Competitors≈75%, Keywords≈85%) — 3 сек
  if ((progressPct >= 15 && progressPct < 35) || (progressPct >= 60 && progressPct < 95)) return 3000;
  // Всё остальное — 2 сек
  return 2000;
}

const checkItems: { icon: LucideIcon; text: string }[] = [
  { icon: Search, text: "SEO Score (20+ параметров)" },
  { icon: BrainCircuit, text: "LLM Score (AI-готовность)" },
  { icon: Target, text: "Direct Readiness Score" },
  { icon: Sparkles, text: "AI-генерация объявления Директа" },
  { icon: Users, text: "Топ-10 конкурентов" },
  { icon: Key, text: "200+ ключевых слов" },
  { icon: Ban, text: "Минус-слова для Директа" },
  { icon: ShieldCheck, text: "E-E-A-T и Schema.org" },
  { icon: FileText, text: "llms.txt проверка и генерация" },
  { icon: Download, text: "Экспорт PDF / Word / CSV" },
];

const CheckList = () => {
  const listRef = useRef<HTMLUListElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-foreground mb-4">Что проверяем</h2>
      <ul ref={listRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {checkItems.map((item, i) => (
          <li
            key={i}
            className={`flex items-center gap-3 text-sm transition-all ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={visible ? { animationDelay: `${i * 100}ms`, animationFillMode: 'forwards', opacity: 0 } : undefined}
          >
            <item.icon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-foreground">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SiteCheck = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [limitScanId, setLimitScanId] = useState<string | null>(null);
  const [limitUrl, setLimitUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);
  const mountedRef = useRef(true);
  const startedAtRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Auto-submit from query params (e.g. from homepage)
  const rescanTriggered = useRef(false);
  useEffect(() => {
    const rescanUrl = searchParams.get("url");
    if (rescanUrl && !rescanTriggered.current) {
      rescanTriggered.current = true;
      handleSubmit(rescanUrl, "site");
    }
  }, [searchParams]);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleSubmit = async (url: string, mode: ScanMode, force?: boolean) => {
    setScanning(true);
    setLimitScanId(null);
    setLimitUrl(null);
    setScanError(null);
    setProgress(0);
    const now = Date.now();
    startedAtRef.current = now;
    setStartedAt(now);
    try {
      const result = await startScan(url, mode, { force });
      setScanId(result.scan_id);
      pollStatus(result.scan_id);
    } catch (e: any) {
      if (e.lastScanId) {
        setLimitScanId(e.lastScanId);
        setLimitUrl(url);
      } else {
        toast({ title: "Ошибка", description: e.message, variant: "destructive" });
      }
      setScanning(false);
    }
  };

  const pollStatus = useCallback(async (id: string) => {
    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const status = await getScanStatus(id);
        if (!mountedRef.current) return;
        setProgress(status.progress_pct);
        if (status.status === 'done') {
          navigate(`/tools/site-check/result/${id}`);
        } else if (status.status === 'error') {
          toast({ title: "Ошибка проверки", description: "Не удалось проанализировать сайт", variant: "destructive" });
          setScanError("Не удалось проанализировать сайт. Попробуйте ещё раз.");
          setScanning(false);
        } else {
          const elapsedMs = Date.now() - (startedAtRef.current ?? Date.now());
          const interval = getPollInterval(elapsedMs, status.progress_pct);
          setTimeout(poll, interval);
        }
      } catch {
        if (mountedRef.current) setTimeout(poll, 3000);
      }
    };
    poll();
  }, [navigate, toast]);

  return (
    <>
      <Helmet>
        <title>Полный GEO и AI-ready аудит сайта — бесплатно | OWNDEV</title>
        <meta name="description" content="Проверьте SEO Score и LLM Score сайта бесплатно. Конкуренты, 200+ ключей, минус-слова, E-E-A-T, Schema и экспорт — за 60 секунд." />
        <link rel="canonical" href="https://owndev.ru/tools/site-check" />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Полный GEO и AI‑ready аудит сайта
            </h1>
            <p className="text-muted-foreground mt-3 text-base">
              Проверьте SEO Score и LLM Score сайта бесплатно. Результат — через 60 секунд.
            </p>
          </div>

          <div className="glass rounded-2xl p-5 md:p-8">
            {scanning ? (
              <ScanProgress
                onComplete={() => {}}
                realProgress={progress}
                error={scanError}
                startedAt={startedAt}
                domain={(() => { try { return new URL(searchParams.get("url") || "").hostname; } catch { return undefined; } })()}
              />
            ) : (
              <ScanForm onSubmit={handleSubmit} />
            )}
          </div>

          {limitScanId && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <p className="text-sm text-foreground flex-1">
                Этот домен уже проверялся сегодня. Вы можете посмотреть результаты последней проверки или запустить новую.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/tools/site-check/result/${limitScanId}`)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                >
                  Смотреть результаты
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {limitUrl && (
                  <button
                    onClick={() => handleSubmit(limitUrl, "site", true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Перепроверить
                  </button>
                )}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-8" id="history">
              <h2 className="text-lg font-semibold text-foreground mb-4">Последние проверки</h2>
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <div
                    key={item.scanId}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 text-sm"
                  >
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate flex-1">{item.url}</span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString("ru-RU")}
                    </span>
                    <button
                      onClick={() => navigate(`/tools/site-check/result/${item.scanId}`)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                    >
                      Открыть
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleClearHistory}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Очистить историю
              </button>
            </div>
          )}

          <CheckList />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheck;
