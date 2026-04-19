import { useEffect, useRef, useState } from 'react';
import { getAuditPreview, getAuditResult } from '@/lib/api/marketplaceAudit';
import type { PreviewResponse, ResultResponse } from '@/lib/marketplace-audit-types';

interface UseMarketplaceAuditState {
  preview: PreviewResponse | null;
  result: ResultResponse | null;
  loading: boolean;
  error: string | null;
}

const POLL_INTERVAL = 1500;
const MAX_POLLS = 120; // 3 минуты

export function useMarketplaceAudit(auditId: string | undefined): UseMarketplaceAuditState {
  const [state, setState] = useState<UseMarketplaceAuditState>({
    preview: null,
    result: null,
    loading: true,
    error: null,
  });
  const pollCountRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!auditId) {
      setState({ preview: null, result: null, loading: false, error: 'Не указан ID аудита' });
      return;
    }
    stoppedRef.current = false;
    pollCountRef.current = 0;

    let timeoutId: number | undefined;
    let backoff = POLL_INTERVAL;

    const poll = async () => {
      if (stoppedRef.current) return;
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLLS) {
        setState((s) => ({ ...s, loading: false, error: 'Превышено время ожидания. Попробуйте позже.' }));
        return;
      }
      try {
        const preview = await getAuditPreview(auditId);
        setState((s) => ({ ...s, preview, error: null }));
        backoff = POLL_INTERVAL;

        if (preview.status === 'done') {
          const result = await getAuditResult(auditId);
          setState({ preview, result, loading: false, error: null });
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
        timeoutId = window.setTimeout(poll, backoff);
      } catch (e: any) {
        if (e?.code === 'RATE_LIMIT') {
          backoff = Math.min(backoff * 2, 10000);
          timeoutId = window.setTimeout(poll, backoff);
          return;
        }
        setState((s) => ({ ...s, loading: false, error: e?.message ?? 'Ошибка загрузки' }));
      }
    };

    poll();

    return () => {
      stoppedRef.current = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [auditId]);

  return state;
}
