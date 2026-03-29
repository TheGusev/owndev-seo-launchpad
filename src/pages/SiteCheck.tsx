import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScanForm from "@/components/site-check/ScanForm";
import ScanProgress from "@/components/site-check/ScanProgress";
import { startScan, getScanStatus } from "@/lib/site-check-api";
import type { ScanMode } from "@/lib/site-check-types";
import { Check, ArrowRight, Globe, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getHistory, clearHistory, type ScanHistoryItem } from "@/utils/scanHistory";

const checkItems = [
  "Технический SEO (скорость, код, robots, sitemap)",
  "Заголовки, Title, H1, контент",
  "Готовность к Яндекс.Директ и автотаргетингу",
  "Schema.org и AI-видимость",
  "Сравнение с топ-10 конкурентами",
  "200+ ключевых запросов",
  "Минус-слова для Директа",
];

const SiteCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [limitScanId, setLimitScanId] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleSubmit = async (url: string, mode: ScanMode) => {
    setScanning(true);
    setLimitScanId(null);
    try {
      const result = await startScan(url, mode);
      setScanId(result.scan_id);
      pollStatus(result.scan_id);
    } catch (e: any) {
      if (e.lastScanId) {
        setLimitScanId(e.lastScanId);
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
          setScanning(false);
        } else {
          setTimeout(poll, 2000);
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
        <title>Проверка сайта — SEO, Директ, конкуренты | OwnDev</title>
        <meta name="description" content="Бесплатная проверка сайта: SEO, готовность к Яндекс.Директ, Schema.org, AI-видимость. Полный отчёт с ключевыми запросами и конкурентами." />
        <link rel="canonical" href="https://owndev.ru/tools/site-check" />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Проверка сайта
            </h1>
            <p className="text-muted-foreground mt-3 text-base">
              SEO, Яндекс.Директ, конкуренты и ключевые запросы — в одном отчёте
            </p>
          </div>

          <div className="glass rounded-2xl p-5 md:p-8">
            {scanning ? (
              <ScanProgress onComplete={() => {}} realProgress={progress} />
            ) : (
              <ScanForm onSubmit={handleSubmit} />
            )}
          </div>

          {limitScanId && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <p className="text-sm text-foreground flex-1">
                Этот домен уже проверялся сегодня. Вы можете посмотреть результаты последней проверки.
              </p>
              <button
                onClick={() => navigate(`/tools/site-check/result/${limitScanId}`)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
              >
                Смотреть результаты
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Что проверяем</h2>
            <ul className="space-y-3">
              {checkItems.map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-foreground">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheck;
