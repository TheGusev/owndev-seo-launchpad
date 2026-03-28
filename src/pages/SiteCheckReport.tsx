import { useParams, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScoreCards from "@/components/site-check/ScoreCards";
import DownloadButtons from "@/components/site-check/DownloadButtons";
import FullReportView from "@/components/site-check/FullReportView";
import KeywordsSection from "@/components/site-check/KeywordsSection";
import MinusWordsSection from "@/components/site-check/MinusWordsSection";
import CompetitorsTable from "@/components/site-check/CompetitorsTable";
import { getReport } from "@/lib/site-check-api";
import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Loader2, AlertTriangle, Clock } from "lucide-react";

const SiteCheckReport = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    if (!reportId) return;
    try {
      const result = await getReport(reportId, token || undefined);
      setData(result);
      setError(null);
      return result;
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить отчёт");
      return null;
    } finally {
      setLoading(false);
    }
  }, [reportId, token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Auto-refresh while pending (for future ЮKassa integration)
  useEffect(() => {
    if (!data || data.payment_status !== "pending") return;
    const interval = setInterval(async () => {
      const result = await fetchReport();
      if (result && result.payment_status === "paid") {
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [data?.payment_status, fetchReport]);

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

  // Invalid token or not found
  if (error || !data) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-4 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Неверная ссылка</h1>
            <p className="text-muted-foreground">{error || "Отчёт не найден или ссылка недействительна"}</p>
            <Link to="/tools/site-check" className="text-primary inline-block mt-4">
              Запустить новую проверку
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Pending payment (for future ЮKassa)
  if (data.payment_status === "pending") {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-4 text-center space-y-4">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto animate-pulse" />
            <h1 className="text-xl font-bold text-foreground">Ожидаем подтверждение оплаты...</h1>
            <p className="text-muted-foreground">Обычно это занимает 3–10 секунд</p>
            <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // No scan data means token was invalid (limited response)
  if (!data.scan) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-4 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Неверная ссылка</h1>
            <p className="text-muted-foreground">Токен доступа недействителен или не совпадает с отчётом</p>
            <Link to="/tools/site-check" className="text-primary inline-block mt-4">
              Запустить новую проверку
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const scan = data.scan;
  const paid = data.payment_status === "paid";

  return (
    <>
      <Helmet>
        <title>Полный отчёт — {scan.url} | OwnDev</title>
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4 space-y-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Отчёт готов</h1>
          </div>

          <DownloadButtons />

          {scan.scores && <ScoreCards scores={scan.scores} />}

          {scan.issues && <FullReportView issues={scan.issues} />}

          {scan.competitors && (
            <CompetitorsTable
              competitors={scan.competitors}
              userUrl={scan.url}
              userScores={scan.scores}
            />
          )}

          {scan.keywords && <KeywordsSection keywords={scan.keywords} />}

          {scan.minus_words && <MinusWordsSection minusWords={scan.minus_words} />}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheckReport;
