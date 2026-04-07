import { ToolId } from '@/lib/api/types';

export interface AuditSession {
  id: string;
  url: string;
  toolId: ToolId;
  createdAt: string;
  loading: boolean;
  error: string | null;
  result: any | null;
}

export interface AuditState {
  currentSessionId: string | null;
  sessions: Record<string, AuditSession>;
}

export type AuditAction =
  | { type: 'ADD_SESSION'; payload: AuditSession }
  | { type: 'SET_RESULT'; payload: { id: string; result: any } }
  | { type: 'SET_ERROR'; payload: { id: string; error: string } }
  | { type: 'SET_CURRENT'; payload: string | null };
