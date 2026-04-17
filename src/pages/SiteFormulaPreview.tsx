import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PreviewCard from '@/components/site-formula/PreviewCard';
import UnlockCTA from '@/components/site-formula/UnlockCTA';
import { getSession, unlockReport, type PreviewPayload, type FullReportPayload } from '@/lib/api/siteFormula';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { PreviewSkeleton } from '@/components/site-formula/SiteFormulaSkeletons';

export default function SiteFormulaPreview() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const sessionId = params.get('session');

  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) { setError('Нет session ID'); setLoading(false); return; }
    (async () => {
      try {
        const session = await getSession(sessionId);
        if (session.status === 'unlocked') {
          nav(`/site-formula/report?session=${sessionId}`, { replace: true });
          return;
        }
        if (!session.preview_payload) {
          setError('Preview ещё не готов. Пройдите wizard.');
          return;
        }
        setPreview(session.preview_payload);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, nav]);

  const handleUnlock = async () => {
    if (!sessionId) return;
    setUnlocking(true);
    try {
      await unlockReport(sessionId);
      nav(`/site-formula/report?session=${sessionId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Site Formula — Результат | OWNDEV</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/site-formula"><ArrowLeft className="h-4 w-4 mr-1" /> Назад</Link>
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-foreground">Результат анализа</h1>

          {loading && <PreviewSkeleton />}

          {error && (
            <div className="text-center py-12 space-y-4">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => nav('/site-formula/wizard')} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Пройти заново
              </Button>
            </div>
          )}

          {preview && (
            <>
              <PreviewCard payload={preview} />
              <UnlockCTA onUnlock={handleUnlock} loading={unlocking} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
