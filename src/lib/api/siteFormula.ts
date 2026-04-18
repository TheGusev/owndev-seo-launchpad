/**
 * API client for OwnDev Site Formula module.
 * Frontend DOES NOT contain business logic — only collects answers and renders server payload.
 */

import { apiUrl, apiHeaders } from './config';

const SF_BASE = '/site-formula';

async function sfRequest<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = apiUrl(`${SF_BASE}${path}`);
  const resp = await fetch(url, {
    ...options,
    headers: { ...apiHeaders(), ...(options?.headers || {}) },
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    throw new Error(body.error || `Ошибка ${resp.status}`);
  }

  return resp.json() as Promise<T>;
}

// ─── Types (mirror of backend payloads) ───

export interface WizardQuestion {
  id: string;
  step: number;
  label: string;
  type: 'single' | 'multi';
  options: Array<{ value: string; label: string }>;
  engine_dimension: string;
}

export interface PreviewPayload {
  project_class: 'start' | 'growth' | 'scale';
  project_class_reason: string;
  key_layers: Array<{ id: string; title: string; description: string }>;
  page_count_estimate: { min: number; max: number };
  primary_risks: string[];
  preview_reasons: string[];
  derived_scores: Record<string, number>;
  flags: Record<string, boolean>;
}

export interface ReportSection {
  id: string;
  title: string;
  order: number;
  content: Record<string, any>;
}

export interface FullReportPayload {
  project_class: 'start' | 'growth' | 'scale';
  sections: ReportSection[];
  decision_trace_summary: string[];
  metadata: { rules_version: string; template_version: string; generated_at: string };
}

export interface SessionData {
  id: string;
  status: string;
  raw_answers: Record<string, any> | null;
  preview_payload: PreviewPayload | null;
  full_report_payload?: FullReportPayload | null;
  rules_version: string;
  template_version: string;
  created_at: string;
  updated_at: string;
}

// ─── API Calls ───

export async function fetchQuestions(): Promise<{ questions: WizardQuestion[]; total_steps: number }> {
  return sfRequest('/questions');
}

export async function createSession(): Promise<{ session_id: string; status: string }> {
  return sfRequest('/sessions', { method: 'POST', body: '{}' });
}

export async function saveAnswers(sessionId: string, answers: Record<string, any>): Promise<{ success: boolean }> {
  return sfRequest(`/sessions/${sessionId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function runEngine(sessionId: string): Promise<{ success: boolean; status: string; preview_payload: PreviewPayload }> {
  return sfRequest(`/sessions/${sessionId}/run`, { method: 'POST', body: '{}' });
}

export async function unlockReport(sessionId: string): Promise<{
  success: boolean;
  status: string;
  full_report_payload: FullReportPayload;
  unlock_token: string;
}> {
  return sfRequest(`/sessions/${sessionId}/unlock`, { method: 'POST', body: '{}' });
}

export async function getSession(sessionId: string): Promise<SessionData> {
  return sfRequest(`/sessions/${sessionId}`);
}

export async function getConfigVersion(): Promise<{ rules_version: string; template_version: string }> {
  return sfRequest('/config-version');
}
