import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { AuditState, AuditAction, AuditSession } from './types';
import type { ToolId } from '@/lib/api/types';

const initialState: AuditState = {
  currentSessionId: null,
  sessions: {},
};

function auditReducer(state: AuditState, action: AuditAction): AuditState {
  switch (action.type) {
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: { ...state.sessions, [action.payload.id]: action.payload },
      };
    case 'SET_RESULT':
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [action.payload.id]: {
            ...state.sessions[action.payload.id],
            loading: false,
            result: action.payload.result,
            error: null,
          },
        },
      };
    case 'SET_ERROR':
      return {
        ...state,
        sessions: {
          ...state.sessions,
          [action.payload.id]: {
            ...state.sessions[action.payload.id],
            loading: false,
            error: action.payload.error,
          },
        },
      };
    case 'SET_CURRENT':
      return { ...state, currentSessionId: action.payload };
    default:
      return state;
  }
}

const StateContext = createContext<AuditState>(initialState);
const DispatchContext = createContext<React.Dispatch<AuditAction>>(() => {});

export const AuditProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(auditReducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

export function useAuditState() {
  return useContext(StateContext);
}

export function useAuditActions() {
  const dispatch = useContext(DispatchContext);

  const addSession = useCallback((session: AuditSession) => {
    dispatch({ type: 'ADD_SESSION', payload: session });
  }, [dispatch]);

  const updateResult = useCallback((id: string, result: any) => {
    dispatch({ type: 'SET_RESULT', payload: { id, result } });
  }, [dispatch]);

  const setError = useCallback((id: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { id, error } });
  }, [dispatch]);

  const setCurrent = useCallback((id: string | null) => {
    dispatch({ type: 'SET_CURRENT', payload: id });
  }, [dispatch]);

  return { addSession, updateResult, setError, setCurrent };
}

export function useSessionsByTool(toolId: ToolId) {
  const state = useAuditState();
  return useMemo(
    () => Object.values(state.sessions).filter((s) => s.toolId === toolId),
    [state.sessions, toolId]
  );
}
