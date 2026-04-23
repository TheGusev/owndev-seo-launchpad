import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScanForm from "@/components/site-check/ScanForm";
import ScanProgress from "@/components/site-check/ScanProgress";
import { startScan, getScanStatus } from "@/lib/site-check-api";
import { subscribeScanEvents } from "@/lib/api/scan-events";
import type { ScanMode } from "@/lib/site-check-types";
import { ArrowRight, Globe, Trash2, Search, Brain, Target, Sparkles, Key, ShieldCheck, FileText, Download, RefreshCw, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getHistory, clearHistory, type ScanHistoryItem } from "@/utils/scanHistory";
import { clearScanSession } from "@/utils/scanSession";
import type { LucideIcon } from "lucide-react";
import { TypingCodeBlock } from "@/components/ui/typing-code-block";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { MatrixRain } from "@/components/ui/matrix-rain";

function getPollInterval(elapsedMs: number, progressPct: number): number {
  // Первые 10 секунд — 1 сек (быстрые ранние стадии 5/10/20/35)
  if (elapsedMs < 10_000) return 1000;
  // Медленные LLM-стадии (Theme≈20%, Competitors≈75%, Keywords≈85%) — 3 сек
  if ((progressPct >= 15 && progressPct < 35) || (progressPct >= 60 && progressPct < 95)) return 3000;
  // Всё остальное — 2 сек
  return 2000;
}

const checkItems: { icon: LucideIcon; text: string }[] = [
  { icon: Brain,        text: "GEO Score — AI-видимость (Schema, llms.txt, контент)" },
  { icon: Search,       text: "SEO Score — title/meta/H1/canonical/OG/robots" },
  { icon: Target,       text: "CRO Score — формы, CTA, контакты, доверие" },
  { icon: FileText,     text: "robots.txt + AI-боты (GPTBot, Claude, Perplexity)" },
  { icon: Globe,        text: "sitemap.xml + редиректы + HTTPS / HSTS" },
  { icon: ShieldCheck,  text: "llms.txt / llms-full.txt / security.txt" },
  { icon: Cpu,          text: "Schema.org (Organization, Product, FAQ, Article)" },
  { icon: Sparkles,     text: "Глубокий анализ HTML: ресурсы, GEO-сигналы (E-E-A-T)" },
  { icon: Key,          text: "Сравнение с эталоном категории (бенчмарк)" },
  { icon: Download,     text: "Экспорт PDF / Word" },
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
      <ul ref={listRef} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {checkItems.map((item, i) => (
          <li
            key={i}
            className={`group flex items-center gap-2.5 text-[13px] font-mono rounded-lg px-3 py-2 border border-primary/10 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={visible ? { animationDelay: `${i * 80}ms`, animationFillMode: 'forwards', opacity: 0 } : undefined}
          >
            <span className="text-muted-foreground/70 select-none shrink-0">&gt; check:</span>
            <item.icon className="w-3.5 h-3.5 text-primary shrink-0 drop-shadow-[0_0_6px_hsl(var(--primary)/0.55)]" />
            <span className="text-foreground/90 truncate">{item.text}</span>
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
  const [fromCache, setFromCache] = useState(false);
  const [limitScanId, setLimitScanId] = useState<string | null>(null);
  const [limitUrl, setLimitUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [startedAt, setStartedAt] = useState<number | undefined>(undefined);
  const mountedRef = useRef(true);
  const startedAtRef = useRef<number | undefined>(undefined);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // При входе на страницу сканера — всегда чистим "висящий" scan_id
  // (из localStorage и URL ?scan_id=), чтобы новый запуск всегда стартовал с нуля.
  // Прямые ссылки на /tools/site-check/result/:id используют pathname, их это не затрагивает.
  useEffect(() => {
    clearScanSession();
  }, []);

  // Auto-submit from query params (e.g. from homepage)
  const rescanTriggered = useRef(false);
  useEffect(() => {
    const rescanUrl = searchParams.get("url");
    const forceParam = searchParams.get("force") === "1";
    if (rescanUrl && !rescanTriggered.current) {
      rescanTriggered.current = true;
      // Перед автозапуском по ?url=... тоже вычищаем любой остаточный scan_id.
      clearScanSession();
      handleSubmit(rescanUrl, "site", forceParam);
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
    setFromCache(false);
    const now = Date.now();
    startedAtRef.current = now;
    setStartedAt(now);
    try {
      const result = await startScan(url, mode, { force });
      setScanId(result.scan_id);
      if (result.cached) {
        // Honest fast-path: skip the multi-stage animation, jump straight to result.
        setFromCache(true);
        setProgress(100);
        setTimeout(() => navigate(`/tools/site-check/result/${result.scan_id}?cached=1`), 600);
      } else {
        startTracking(result.scan_id);
      }
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
    const BACKOFF_STEPS = [3000, 5000, 10000];
    let errorCount = 0;
    let warnedDisconnected = false;
    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const status = await getScanStatus(id);
        if (!mountedRef.current) return;
        if (errorCount > 0 && warnedDisconnected) {
          warnedDisconnected = false;
          toast({ title: "Связь восстановлена" });
        }
        errorCount = 0;
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
        if (!mountedRef.current) return;
        errorCount++;
        if (errorCount === 10 && !warnedDisconnected) {
          warnedDisconnected = true;
          toast({
            title: "Связь с сервером потеряна",
            description: "Переподключаемся…",
            variant: "destructive",
          });
        }
        const backoff = BACKOFF_STEPS[Math.min(errorCount - 1, BACKOFF_STEPS.length - 1)];
        setTimeout(poll, backoff);
      }
    };
    poll();
  }, [navigate, toast]);

  const startTracking = useCallback((id: string) => {
    let pollFallbackStarted = false;
    const startPollFallback = () => {
      if (pollFallbackStarted) return;
      pollFallbackStarted = true;
      pollStatus(id);
    };

    const cleanup = subscribeScanEvents(
      id,
      (ev) => {
        if (!mountedRef.current) return;
        if (ev.type === 'progress') {
          setProgress(ev.progress_pct);
        } else if (ev.type === 'done') {
          navigate(`/tools/site-check/result/${id}`);
        } else if (ev.type === 'error') {
          toast({
            title: "Ошибка проверки",
            description: "Не удалось проанализировать сайт",
            variant: "destructive",
          });
          setScanError("Не удалось проанализировать сайт. Попробуйте ещё раз.");
          setScanning(false);
        }
      },
      startPollFallback,
    );

    cleanupRef.current = cleanup;
  }, [navigate, pollStatus, toast]);

  return (
    <>
      <Helmet>
        <title>Полный GEO и AI-ready аудит сайта — бесплатно | OWNDEV</title>
        <meta name="description" content="Проверьте GEO Score, SEO Score и CRO Score сайта бесплатно. Schema.org, llms.txt, robots.txt, бенчмарк по категории. PDF и Word отчёт за 60 секунд." />
        <link rel="canonical" href="https://owndev.ru/tools/site-check" />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16 relative overflow-hidden">
        <AuroraBackground className="z-0 opacity-50" intensity="subtle" />
        <MatrixRain className="z-0" density="low" opacity={0.15} />
        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
            <div>
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
                cached={fromCache}
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

          {/* Mobile typing block (the aside one is desktop-only) */}
          <div className="mt-8 lg:hidden">
            <TypingCodeBlock
              title="owndev ~ scanner"
              language="bash"
              speed={22}
              lineDelay={180}
              variant="ide"
              mobileVariant="compact"
              lines={[
                "$ owndev scan --url example.ru",
                "→ Fetching HTML…",
                "✓ HTTP 200, 84.2 KB",
                "→ Parsing meta tags",
                "✓ Schema.org: Organization, FAQ",
                "→ Computing LLM Score…",
                "✓ Report ready in 47s",
              ]}
            />
          </div>
            </div>

            <aside className="hidden lg:block sticky top-24">
              <TypingCodeBlock
                title="owndev ~ scanner"
                language="bash"
                speed={22}
                lineDelay={180}
                lines={[
                  "$ owndev scan --url example.ru",
                  "→ Fetching HTML…",
                  "✓ HTTP 200, 84.2 KB",
                  "→ Parsing meta tags",
                  "✓ title, description OK",
                  "→ Checking Schema.org",
                  "✓ Organization, FAQPage",
                  "→ AI-ready check (llms.txt)",
                  "✓ Found, 12 sections",
                  "→ Computing SEO Score…",
                  "→ Computing LLM Score…",
                  "✓ Report ready in 47s",
                ]}
              />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheck;
