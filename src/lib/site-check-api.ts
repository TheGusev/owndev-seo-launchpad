import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

function fnUrl(name: string, path = '') {
  return `https://${PROJECT_ID}.supabase.co/functions/v1/${name}${path}`;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

export async function startScan(url: string, mode: 'page' | 'site') {
  const resp = await fetch(fnUrl('site-check-scan', '/start'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ url, mode }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{ scan_id: string; status: string }>;
}

export async function getScanStatus(scanId: string) {
  const resp = await fetch(fnUrl('site-check-scan', `/status/${scanId}`), { headers: headers() });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{ status: string; progress_pct: number; scores_preview: any }>;
}

export async function getScanPreview(scanId: string) {
  const resp = await fetch(fnUrl('site-check-scan', `/preview/${scanId}`), { headers: headers() });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}

export async function createReport(scanId: string, email: string) {
  const resp = await fetch(fnUrl('site-check-report', '/create'), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ scan_id: scanId, email }),
  });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json() as Promise<{ report_id: string; download_token: string; payment_url: string | null }>;
}

export async function getReport(reportId: string, token?: string) {
  const params = token ? `?token=${token}` : '';
  const resp = await fetch(fnUrl('site-check-report', `/${reportId}${params}`), { headers: headers() });
  if (!resp.ok) throw new Error(await resp.text());
  return resp.json();
}
