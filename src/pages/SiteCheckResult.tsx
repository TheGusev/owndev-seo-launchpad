import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScoreCards from "@/components/site-check/ScoreCards";
import IssueCardComponent from "@/components/site-check/IssueCard";
import PaywallCTA from "@/components/site-check/PaywallCTA";
import { createMockScan } from "@/lib/site-check-mock";
import type { Scan } from "@/lib/site-check-types";
import { useMemo } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

const SiteCheckResult = () => {
  const { scanId } = useParams<{ scanId: string }>();

  const scan: Scan = useMemo(() => {
    const stored = sessionStorage.getItem(`scan_${scanId}`);
    if (stored) return JSON.parse(stored);
    return createMockScan("https://example.ru", "page");
  }, [scanId]);

  const previewIssues = scan.issues.filter((i) => i.visible_in_preview).slice(0, 5);

  const handlePay = (email: string) => {
    // Will integrate with ЮKassa in future prompts
    console.log("Payment initiated for:", email);
  };

  return (
    <>
      <Helmet>
        <title>Результат проверки — {scan.url} | OwnDev</title>
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4 space-y-8">
          <div>
            <Link
              to="/tools/site-check"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Новая проверка
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Результат проверки</h1>
              <a
                href={scan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {scan.url}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <ScoreCards scores={scan.scores} />

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Топ-5 критичных проблем
            </h2>
            <div className="space-y-3">
              {previewIssues.map((issue) => (
                <IssueCardComponent key={issue.id} issue={issue} locked />
              ))}
            </div>
          </div>

          <PaywallCTA issueCount={scan.issues.length} onPay={handlePay} />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheckResult;
