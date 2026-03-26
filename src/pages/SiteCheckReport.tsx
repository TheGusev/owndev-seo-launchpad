import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScoreCards from "@/components/site-check/ScoreCards";
import DownloadButtons from "@/components/site-check/DownloadButtons";
import FullReportView from "@/components/site-check/FullReportView";
import { createMockScan, createMockReport } from "@/lib/site-check-mock";
import { useMemo } from "react";
import { CheckCircle2, Mail } from "lucide-react";

const SiteCheckReport = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Mock: in production would fetch from DB by reportId + token
  const { scan, report } = useMemo(() => {
    const s = createMockScan("https://example.ru", "page");
    const r = createMockReport(s.scan_id);
    r.report_id = reportId || r.report_id;
    r.payment_status = "paid";
    r.email = "user@example.ru";
    return { scan: s, report: r };
  }, [reportId]);

  const paid = report.payment_status === "paid";

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

          <DownloadButtons paid={paid} />

          <ScoreCards scores={scan.scores} />

          <FullReportView issues={scan.issues} />

          {report.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-xl border border-border/30 p-4">
              <Mail className="w-4 h-4 shrink-0" />
              Ссылка на отчёт отправлена на {report.email}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheckReport;
