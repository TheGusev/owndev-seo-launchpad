import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScoreCards from "@/components/site-check/ScoreCards";
import FullReportView from "@/components/site-check/FullReportView";
import CompetitorsTable from "@/components/site-check/CompetitorsTable";
import KeywordsSection from "@/components/site-check/KeywordsSection";
import MinusWordsSection from "@/components/site-check/MinusWordsSection";
import DownloadButtons from "@/components/site-check/DownloadButtons";
import { getFullScan } from "@/lib/site-check-api";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, ExternalLink, Loader2, History, AlertTriangle } from "lucide-react";
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

  const issues = Array.isArray(data.issues) ? data.issues : [];
  const competitors = Array.isArray(data.competitors) ? data.competitors : [];
  const keywords = Array.isArray(data.keywords) ? data.keywords : [];
  const minusWords = Array.isArray(data.minus_words) ? data.minus_words : [];

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
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Полный отчёт</h1>
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
                {data.url}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {data.theme && (
              <p className="text-sm text-muted-foreground mt-1">Тематика: {data.theme}</p>
            )}
          </div>

          {data.scores && <ScoreCards scores={data.scores} previousScores={previousScores} />}

          <DownloadButtons />

          {issues.length > 0 && <FullReportView issues={issues} url={data.url} />}

          {competitors.length > 0 && (
            <CompetitorsTable
              competitors={competitors}
              userUrl={data.url}
              userScores={data.scores}
            />
          )}

          {keywords.length > 0 && <KeywordsSection keywords={keywords} />}

          {minusWords.length > 0 && <MinusWordsSection minusWords={minusWords} />}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheckResult;
