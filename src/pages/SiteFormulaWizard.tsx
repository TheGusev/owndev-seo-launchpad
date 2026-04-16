import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSiteFormulaSession } from '@/hooks/useSiteFormulaSession';
import { fetchQuestions, type WizardQuestion } from '@/lib/api/siteFormula';
import WizardProgress from '@/components/site-formula/WizardProgress';
import WizardStepRenderer from '@/components/site-formula/WizardStepRenderer';
import WizardNavigation from '@/components/site-formula/WizardNavigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SiteFormulaWizard() {
  const nav = useNavigate();
  const session = useSiteFormulaSession();
  const [questions, setQuestions] = useState<WizardQuestion[]>([]);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [initDone, setInitDone] = useState(false);

  // Load questions + try resume session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [qData] = await Promise.all([
          fetchQuestions(),
          session.resumeSession(),
        ]);
        if (cancelled) return;
        setQuestions(qData.questions);
        setTotalSteps(qData.total_steps);

        // If no existing session, create one
        if (!session.sessionId) {
          await session.startSession();
        }
      } catch {
        // Questions fetch failed — likely backend not running, show fallback
      } finally {
        if (!cancelled) {
          setQuestionsLoading(false);
          setInitDone(true);
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate to preview when engine finishes
  useEffect(() => {
    if (session.phase === 'preview' && session.sessionId) {
      nav(`/site-formula/preview?session=${session.sessionId}`);
    }
  }, [session.phase, session.sessionId, nav]);

  const stepQuestions = useMemo(
    () => questions.filter((q) => q.step === currentStep),
    [questions, currentStep]
  );

  const isStepValid = useMemo(() => {
    return stepQuestions.every((q) => {
      const val = session.answers[q.id];
      if (q.type === 'multi') return Array.isArray(val) && val.length > 0;
      return val !== undefined && val !== '';
    });
  }, [stepQuestions, session.answers]);

  if (questionsLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <Helmet>
          <title>Site Formula — Wizard | OWNDEV</title>
        </Helmet>
        <Header />
        <main className="min-h-screen bg-background pt-20">
          <div className="container mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
            <p className="text-muted-foreground">Не удалось загрузить вопросы. Попробуйте позже.</p>
            <Button onClick={() => window.location.reload()}>Обновить</Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Site Formula — Шаг {currentStep} | OWNDEV</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        <div className="container mx-auto max-w-2xl px-4 py-10 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">OwnDev Site Formula</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Расскажите о вашем бизнесе — мы построим архитектуру сайта
            </p>
          </div>

          <WizardProgress currentStep={currentStep} totalSteps={totalSteps} />

          <WizardStepRenderer
            questions={stepQuestions}
            answers={session.answers}
            onAnswer={session.setAnswer}
          />

          {session.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {session.error}
            </p>
          )}

          <WizardNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            isStepValid={isStepValid}
            loading={session.loading}
            onBack={() => setCurrentStep((s) => Math.max(1, s - 1))}
            onNext={() => setCurrentStep((s) => Math.min(totalSteps, s + 1))}
            onSubmit={session.executeEngine}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
