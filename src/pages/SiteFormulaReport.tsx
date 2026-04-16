import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlueprintSection from '@/components/site-formula/BlueprintSection';
import { getSession, type FullReportPayload } from '@/lib/api/siteFormula';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Download } from 'lucide-react';

const CLASS_LABELS: Record<string, string> = {
  start: 'Start',
  growth: 'Growth',
  scale: 'Scale',
};

export default function SiteFormulaReport() {
  const [params] = useSearchParams();
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
        <div className="container mx-auto max-w-4xl px-4 py-10 space-y-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/site-formula"><ArrowLeft className="h-4 w-4 mr-1" /> Назад</Link>
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="text-center py-12 space-y-4">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" asChild>
                <Link to="/site-formula">На главную Site Formula</Link>
              </Button>
            </div>
          )}

          {report && (
            <>
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Архитектурный Blueprint
                  </h1>
                  <Badge variant="outline" className="border-primary/30 text-primary font-bold">
                    {CLASS_LABELS[report.project_class] || report.project_class}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Сгенерировано: {new Date(report.metadata.generated_at).toLocaleDateString('ru-RU')} •
                  Rules v{report.metadata.rules_version} • Template v{report.metadata.template_version}
                </p>
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
                <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Обоснование решений</h3>
                  <ul className="space-y-1">
                    {report.decision_trace_summary.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground font-mono">{item}</li>
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
