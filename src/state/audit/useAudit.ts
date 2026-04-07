import { useCallback } from 'react';
import { useAuditState, useAuditActions, useSessionsByTool } from './store';
import type { ToolId } from '@/lib/api/types';
import { logEvent } from '@/lib/analytics/logger';

export function useAudit<T = any>(toolId: ToolId) {
  const state = useAuditState();
  const { addSession, updateResult, setError, setCurrent } = useAuditActions();
  const history = useSessionsByTool(toolId);

  const run = useCallback(
    async (url: string, apiFn: () => Promise<T>): Promise<T> => {
      const sessionId = crypto.randomUUID();
      addSession({
        id: sessionId,
        url,
        toolId,
        createdAt: new Date().toISOString(),
        loading: true,
        error: null,
        result: null,
      });
      setCurrent(sessionId);
      try {
        const result = await apiFn();
        updateResult(sessionId, result);
        return result;
      } catch (e: any) {
        const msg = e?.message || 'Unknown error';
        setError(sessionId, msg);
        throw e;
      }
    },
    [toolId, addSession, updateResult, setError, setCurrent]
  );

  const current = state.currentSessionId
    ? state.sessions[state.currentSessionId]
    : null;

  return { run, current, history };
}
