/**
 * Site Check scan & report API.
 * Migrated from src/lib/site-check-api.ts — uses the unified request() client.
 */

import { supabase } from "@/integrations/supabase/client";
import { request } from "./client";

export async function getFullScan(scanId: string) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', scanId)
    .maybeSingle();
  if (error || !data) throw new Error('Scan not found');
  return data;
}

export async function startScan(url: string, mode: 'page' | 'site') {
  return request<{ scan_id: string; status: string; cached?: boolean }>(
    'site-check-scan',
    '/start',
    {
      method: 'POST',
      body: JSON.stringify({ url, mode }),
    }
  );
}

export async function getScanStatus(scanId: string) {
  return request<{ status: string; progress_pct: number; scores_preview: any }>(
    'site-check-scan',
    `/status/${scanId}`
  );
}

export async function getScanPreview(scanId: string) {
  return request('site-check-scan', `/preview/${scanId}`);
}

export async function createReport(scanId: string, email: string) {
  return request<{ report_id: string; download_token: string; payment_url: string | null }>(
    'site-check-report',
    '/create',
    {
      method: 'POST',
      body: JSON.stringify({ scan_id: scanId, email }),
    }
  );
}

export async function getReport(reportId: string, token?: string) {
  const params = token ? `?token=${token}` : '';
  return request('site-check-report', `/${reportId}${params}`);
}
