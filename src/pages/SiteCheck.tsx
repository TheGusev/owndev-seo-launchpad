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
  const [staleScanId, setStaleScanId] = useState<string | null>(null);
  const [limitScanId, setLimitScanId] = useState<string | null>(null);
  const [limitUrl, setLimitUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  // Auto-submit from query params (e.g. from homepage) OR resume an active scan from sessionStorage.
  const rescanTriggered = useRef(false);
  useEffect(() => {
    if (rescanTriggered.current) return;
    const rescanUrl = searchParams.get("url");
    if (rescanUrl) {
      rescanTriggered.current = true;
      handleSubmit(rescanUrl, "site");
      return;
    }
    // Try to resume an active scan after page reload
    try {
      const savedId = sessionStorage.getItem("owndev_active_scan");
      if (savedId) {
        rescanTriggered.current = true;
        (async () => {
          try {
            const status = await getScanStatus(savedId);
            if (status.status === "done") {
              sessionStorage.removeItem("owndev_active_scan");
              navigate(`/tools/site-check/result/${savedId}`);
            } else if (status.status === "running" || status.status === "queued") {
              setScanning(true);
              setScanId(savedId);
              setProgress(status.progress_pct ?? 0);
              pollStatus(savedId);
            } else {
              sessionStorage.removeItem("owndev_active_scan");
            }
          } catch {
            sessionStorage.removeItem("owndev_active_scan");
          }
        })();
      }
    } catch { /* sessionStorage unavailable */ }
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
    setStaleScanId(null);
    setProgress(0);
    try {
      const result = await startScan(url, mode, { force });
      setScanId(result.scan_id);
      try { sessionStorage.setItem("owndev_active_scan", result.scan_id); } catch {}
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
    const startedAt = Date.now();
    let lastProgress = -1;
    let lastProgressChangeAt = Date.now();
    const HARD_TIMEOUT_MS = 300_000; // 5 минут — реальный потолок Puppeteer + LLM
    const STALE_PROGRESS_MS = 120_000; // 2 минуты без изменения прогресса

    const finalize = (status: 'done' | 'error' | 'stale') => {
      try { sessionStorage.removeItem("owndev_active_scan"); } catch {}
      if (status === 'done') {
        navigate(`/tools/site-check/result/${id}`);
      }
    };

    const poll = async () => {
      if (!mountedRef.current) return;
      const status = await getScanStatus(id); // never throws now — returns {status:'unknown'} on net err
      if (!mountedRef.current) return;

      if (status.status === 'unknown') {
        // Network blip — keep polling, don't penalize stale window
        if (mountedRef.current) setTimeout(poll, 3000);
        return;
      }

      if (typeof status.progress_pct === 'number' && status.progress_pct !== lastProgress) {
        lastProgress = status.progress_pct;
        lastProgressChangeAt = Date.now();
        setProgress(status.progress_pct);
      }

      if (status.status === 'done') {
        finalize('done');
        return;
      }
      if (status.status === 'error') {
        try { sessionStorage.removeItem("owndev_active_scan"); } catch {}
        toast({ title: "Ошибка проверки", description: "Не удалось проанализировать сайт", variant: "destructive" });
        setScanError("Не удалось проанализировать сайт. Попробуйте ещё раз.");
        setScanning(false);
        return;
      }

      const elapsed = Date.now() - startedAt;
      const stale = Date.now() - lastProgressChangeAt;
      if (elapsed > HARD_TIMEOUT_MS || stale > STALE_PROGRESS_MS) {
        // FINAL RE-CHECK before giving up — scan may have just completed
        const finalStatus = await getScanStatus(id);
        if (!mountedRef.current) return;
        if (finalStatus.status === 'done') {
          finalize('done');
          return;
        }
        toast({
          title: "Проверка идёт дольше обычного",
          description: "Можно открыть результат вручную, когда он будет готов.",
        });
        setScanError("Проверка идёт дольше обычного. Откройте результат позже по ссылке ниже.");
        setStaleScanId(id);
        setScanning(false);
        return;
      }
      setTimeout(poll, 2000);
    };
    poll();
  }, [navigate, toast]);

  const handleCancelScan = useCallback(() => {
    setScanning(false);
    setScanError(null);
    setProgress(0);
    setScanId(null);
    try { sessionStorage.removeItem("owndev_active_scan"); } catch {}
  }, []);

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
                domain={(() => { try { return new URL(searchParams.get("url") || "").hostname; } catch { return undefined; } })()}
                onCancel={handleCancelScan}
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

          {staleScanId && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <p className="text-sm text-foreground flex-1">
                Проверка занимает больше времени, чем обычно. Результат сохранится — откройте его через минуту-две.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/tools/site-check/result/${staleScanId}`)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                >
                  Открыть результат
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
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
