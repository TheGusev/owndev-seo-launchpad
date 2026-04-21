import { useEffect, useRef, useState } from 'react';
import { getAuditPreview, getAuditResult } from '@/lib/api/marketplaceAudit';
import { subscribeMarketplaceAuditEvents } from '@/lib/api/marketplace-audit-events';
import type { PreviewResponse, ResultResponse } from '@/lib/marketplace-audit-types';

interface UseMarketplaceAuditState {
  preview: PreviewResponse | null;
  result: ResultResponse | null;
  loading: boolean;
  error: string | null;
}

const POLL_INTERVAL = 1500;
const MAX_POLLS = 120; // 3 минуты, только для polling fallback
const ERROR_BACKOFF_STEPS = [2000, 4000, 8000]; // exponential, cap 8с

export function useMarketplaceAudit(auditId: string | undefined): UseMarketplaceAuditState {
  const [state, setState] = useState<UseMarketplaceAuditState>({
    preview: null,
    result: null,
    loading: true,
    error: null,
  });

  const stoppedRef = useRef(false);
  const pollTimeoutRef = useRef<number | undefined>(undefined);
  const sseUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!auditId) {
      setState({ preview: null, result: null, loading: false, error: 'Не указан ID аудита' });
      return;
    }
    stoppedRef.current = false;

    // ─── Финальная загрузка результата по событию done ───
    const fetchResult = async () => {
      try {
        const result = await getAuditResult(auditId);
        if (stoppedRef.current) return;
        setState((s) => ({ ...s, result, loading: false, error: null }));
      } catch (e: any) {
        if (stoppedRef.current) return;
        setState((s) => ({ ...s, loading: false, error: e?.message ?? 'Ошибка загрузки результата' }));
      }
    };

    // ─── Polling fallback (используется когда SSE недоступен) ───
    let pollCount = 0;
    let rateLimitBackoff = POLL_INTERVAL;
    let errorStep = 0;

    const poll = async () => {
      if (stoppedRef.current) return;
      pollCount += 1;
      if (pollCount > MAX_POLLS) {
        setState((s) => ({ ...s, loading: false, error: 'Превышено время ожидания. Попробуйте позже.' }));
        return;
      }
      try {
        const preview = await getAuditPreview(auditId);
        if (stoppedRef.current) return;
        setState((s) => ({ ...s, preview, error: null }));
        // Сброс backoff на любом успешном ответе
        rateLimitBackoff = POLL_INTERVAL;
        errorStep = 0;

        if (preview.status === 'done') {
          await fetchResult();
          return;
        }
        if (preview.status === 'error') {
          setState({
            preview,
            result: null,
            loading: false,
            error: preview.error || 'Не удалось выполнить аудит',
          });
          return;
        }
        pollTimeoutRef.current = window.setTimeout(poll, POLL_INTERVAL);
      } catch (e: any) {
        if (stoppedRef.current) return;
        if (e?.code === 'RATE_LIMIT') {
          rateLimitBackoff = Math.min(rateLimitBackoff * 2, 10000);
          pollTimeoutRef.current = window.setTimeout(poll, rateLimitBackoff);
          return;
        }
        // Сетевая ошибка — exponential backoff, не падаем сразу.
        const wait = ERROR_BACKOFF_STEPS[Math.min(errorStep, ERROR_BACKOFF_STEPS.length - 1)];
        errorStep += 1;
        pollTimeoutRef.current = window.setTimeout(poll, wait);
      }
    };

    const startPollingFallback = () => {
      if (stoppedRef.current) return;
      if (pollTimeoutRef.current) return; // уже запущен
      poll();
    };

    // ─── SSE primary ───
    sseUnsubRef.current = subscribeMarketplaceAuditEvents(
      auditId,
      (ev) => {
        if (stoppedRef.current) return;
        if (ev.type === 'progress') {
          setState((s) => ({ ...s, preview: ev.preview, error: null }));
          if (ev.preview.status === 'done') {
            fetchResult();
          } else if (ev.preview.status === 'error') {
            setState({
              preview: ev.preview,
              result: null,
              loading: false,
              error: ev.preview.error || 'Не удалось выполнить аудит',
            });
          }
        } else if (ev.type === 'done') {
          fetchResult();
        } else if (ev.type === 'error') {
          setState((s) => ({
            ...s,
            loading: false,
            error: ev.error || 'Не удалось выполнить аудит',
          }));
        }
      },
      () => {
        // SSE недоступно — переключаемся на polling
        startPollingFallback();
      },
    );

    return () => {
      stoppedRef.current = true;
      if (pollTimeoutRef.current) {
        window.clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = undefined;
      }
      if (sseUnsubRef.current) {
        sseUnsubRef.current();
        sseUnsubRef.current = null;
      }
    };
  }, [auditId]);

  return state;
}
