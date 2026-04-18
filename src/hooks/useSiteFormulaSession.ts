import { useState, useCallback, useEffect } from 'react';
import {
  createSession,
  saveAnswers,
  runEngine,
  unlockReport,
  getSession,
  type PreviewPayload,
  type FullReportPayload,
  type SessionData,
} from '@/lib/api/siteFormula';

const STORAGE_KEY = 'owndev_sf_session_id';

export type SessionPhase = 'idle' | 'wizard' | 'running' | 'preview' | 'unlocked' | 'error';

interface UseSiteFormulaSession {
  sessionId: string | null;
  phase: SessionPhase;
  answers: Record<string, string | string[]>;
  previewPayload: PreviewPayload | null;
  fullReportPayload: FullReportPayload | null;
  error: string | null;
  loading: boolean;
  startSession: () => Promise<void>;
  resumeSession: () => Promise<boolean>;
  setAnswer: (questionId: string, value: string | string[]) => void;
  submitAnswers: () => Promise<void>;
  executeEngine: () => Promise<void>;
  unlock: () => Promise<void>;
  resetSession: () => void;
}

export function useSiteFormulaSession(): UseSiteFormulaSession {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [previewPayload, setPreviewPayload] = useState<PreviewPayload | null>(null);
  const [fullReportPayload, setFullReportPayload] = useState<FullReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createSession();
      setSessionId(res.session_id);
      localStorage.setItem(STORAGE_KEY, res.session_id);
      setPhase('wizard');
      setAnswers({});
      setPreviewPayload(null);
      setFullReportPayload(null);
    } catch (err: any) {
      setError(err.message);
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }, []);

  const resumeSession = useCallback(async (): Promise<boolean> => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) return false;
    setLoading(true);
    try {
      const session = await getSession(storedId);
      setSessionId(session.id);
      setAnswers(session.raw_answers || {});
      setPreviewPayload(session.preview_payload);
      setFullReportPayload(session.full_report_payload || null);

      switch (session.status) {
        case 'draft':
        case 'answers_saved':
          setPhase('wizard');
          break;
        case 'preview_ready':
          setPhase('preview');
          break;
        case 'unlocked':
          setPhase('unlocked');
          break;
        default:
          setPhase('wizard');
      }
      return true;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setAnswer = useCallback((questionId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const submitAnswers = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      await saveAnswers(sessionId, answers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId, answers]);

  const executeEngine = useCallback(async () => {
    if (!sessionId) return;
    if (!answers || Object.keys(answers).length === 0) {
      setError('Заполните все шаги перед запуском');
      return;
    }
    setLoading(true);
    setError(null);
    setPhase('running');
    try {
      await saveAnswers(sessionId, answers);
      const res = await runEngine(sessionId);
      setPreviewPayload(res.preview_payload);
      setPhase('preview');
    } catch (err: any) {
      setError(err.message);
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, answers]);

  const unlock = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await unlockReport(sessionId);
      setFullReportPayload(res.full_report_payload);
      setPhase('unlocked');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const resetSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setPhase('idle');
    setAnswers({});
    setPreviewPayload(null);
    setFullReportPayload(null);
    setError(null);
  }, []);

  return {
    sessionId,
    phase,
    answers,
    previewPayload,
    fullReportPayload,
    error,
    loading,
    startSession,
    resumeSession,
    setAnswer,
    submitAnswers,
    executeEngine,
    unlock,
    resetSession,
  };
}
