import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlueprintSection from '@/components/site-formula/BlueprintSection';
import BlueprintExportButtons from '@/components/site-formula/BlueprintExportButtons';
import { BlueprintSkeleton } from '@/components/site-formula/SiteFormulaSkeletons';
import { getSession, type FullReportPayload } from '@/lib/api/siteFormula';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

const CLASS_LABELS: Record<string, string> = {
  start: 'Start',
  growth: 'Growth',
  scale: 'Scale',
};

export default function SiteFormulaReport() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const sessionId = params.get('session');

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<FullReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) { setError('Нет session ID'); setLoading(false); return; }
    (async () => {
      try {
        const session = await getSession(sessionId);
        if (session.status !== 'unlocked' || !session.full_report_payload) {
          setError('Blueprint ещё не разблокирован');
          return;
        }
        setReport(session.full_report_payload);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  return (
    <>
      <Helmet>
        <title>Site Formula — Blueprint | OWNDEV</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10 space-y-6 sm:space-y-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/site-formula"><ArrowLeft className="h-4 w-4 mr-1" /> Назад</Link>
            </Button>
          </div>

          {loading && <BlueprintSkeleton />}

          {error && (
            <div className="text-center py-10 sm:py-16 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <p className="text-destructive font-medium">{error}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" onClick={() => nav('/site-formula/wizard')} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Пройти wizard заново
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/site-formula">На главную Site Formula</Link>
                </Button>
              </div>
            </div>
          )}

          {report && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      Архитектурный Blueprint
                    </h1>
                    <Badge variant="outline" className="border-primary/30 text-primary font-bold">
                      {CLASS_LABELS[report.project_class] || report.project_class}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Сгенерировано: {new Date(report.metadata.generated_at).toLocaleDateString('ru-RU')} •
                    Rules v{report.metadata.rules_version} • Template v{report.metadata.template_version}
                  </p>
                </div>
                <BlueprintExportButtons report={report} />
              </div>

              {/* Sections */}
              <div className="space-y-3">
                {report.sections.map((section, i) => (
                  <BlueprintSection
                    key={section.id}
                    section={section}
                    defaultOpen={i === 0}
                  />
                ))}
              </div>

              {/* Decision Trace Summary */}
              {report.decision_trace_summary.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 sm:p-5 space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Обоснование решений</h3>
                  <ul className="space-y-1">
                    {report.decision_trace_summary.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground font-mono break-words">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
