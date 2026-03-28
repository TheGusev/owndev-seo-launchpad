import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScoreCards from "@/components/site-check/ScoreCards";
import IssueCardComponent from "@/components/site-check/IssueCard";
import PaywallCTA from "@/components/site-check/PaywallCTA";
import { getScanPreview } from "@/lib/site-check-api";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SiteCheckResult = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scanId) return;
    getScanPreview(scanId)
      .then(setData)
      .catch(() => toast({ title: "Ошибка", description: "Не удалось загрузить результаты", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [scanId, toast]);

  const handlePay = async (email: string) => {
    if (!scanId || paying) return;
    setPaying(true);
    try {
      const result = await createReport(scanId, email);
      toast({ title: "Отчёт готов!", description: "Перенаправляем на страницу отчёта..." });
      navigate(`/tools/site-check/report/${result.report_id}?token=${result.download_token}`);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Не удалось создать отчёт. Попробуйте позже.", variant: "destructive" });
      setPaying(false);
    }
  };

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

  if (!data) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <p className="text-muted-foreground">Результаты не найдены</p>
            <Link to="/tools/site-check" className="text-primary mt-4 inline-block">Запустить новую проверку</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Результат проверки — {data.url} | OwnDev</title>
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4 space-y-8">
          <div>
            <Link to="/tools/site-check" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" />
              Новая проверка
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Результат проверки</h1>
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
                {data.url}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {data.theme && (
              <p className="text-sm text-muted-foreground mt-1">Тематика: {data.theme}</p>
            )}
          </div>

          {data.scores && <ScoreCards scores={data.scores} />}

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Топ-5 критичных проблем
            </h2>
            <div className="space-y-3">
              {(data.issues || []).map((issue: any) => (
                <IssueCardComponent key={issue.id} issue={issue} locked />
              ))}
              {(!data.issues || data.issues.length === 0) && (
                <p className="text-sm text-muted-foreground">Критичных проблем не найдено 🎉</p>
              )}
            </div>
          </div>

          <PaywallCTA issueCount={data.issue_count || 0} onPay={handlePay} loading={paying} />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheckResult;
