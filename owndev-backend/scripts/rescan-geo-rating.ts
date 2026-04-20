#!/usr/bin/env tsx
/**
 * Mass rescan of geo_rating domains via the local Node API.
 * Triggers real audits through SiteCheckWorker, which upserts fresh
 * fractional scores back into geo_rating via INSERT ... ON CONFLICT.
 *
 * Usage:
 *   tsx scripts/rescan-geo-rating.ts [--mode=low65|score65|stale|all] [--domain=foo.ru] [--api=http://localhost:3000]
 *
 * Defaults: --mode=low65, --api=http://localhost:3000
 */
import 'dotenv/config';
import postgres from 'postgres';

type Mode = 'low65' | 'score65' | 'stale' | 'all';

interface Args {
  mode: Mode;
  domain?: string;
  api: string;
  concurrency: number;
  timeoutMs: number;
  pollMs: number;
}

function parseArgs(): Args {
  const args: Args = {
    mode: 'low65',
    api: process.env.API_URL || 'http://localhost:3000',
    concurrency: 3,
    timeoutMs: 120_000,
    pollMs: 5_000,
  };
  for (const raw of process.argv.slice(2)) {
    const [k, v] = raw.replace(/^--/, '').split('=');
    if (k === 'mode' && v) args.mode = v as Mode;
    else if (k === 'domain' && v) args.domain = v;
    else if (k === 'api' && v) args.api = v.replace(/\/$/, '');
    else if (k === 'concurrency' && v) args.concurrency = Number(v);
    else if (k === 'timeout' && v) args.timeoutMs = Number(v) * 1000;
  }
  return args;
}

async function fetchDomains(sql: postgres.Sql, args: Args): Promise<string[]> {
  if (args.domain) {
    const rows = await sql<{ domain: string }[]>`
      SELECT domain FROM geo_rating WHERE domain = ${args.domain} LIMIT 1
    `;
    return rows.map((r) => r.domain);
  }

  switch (args.mode) {
    case 'all': {
      const rows = await sql<{ domain: string }[]>`
        SELECT domain FROM geo_rating ORDER BY llm_score ASC
      `;
      return rows.map((r) => r.domain);
    }
    case 'score65': {
      const rows = await sql<{ domain: string }[]>`
        SELECT domain FROM geo_rating WHERE llm_score = 65 ORDER BY domain
      `;
      return rows.map((r) => r.domain);
    }
    case 'stale': {
      const rows = await sql<{ domain: string }[]>`
        SELECT domain FROM geo_rating
        WHERE last_checked_at < NOW() - INTERVAL '24 hours'
           OR (llm_score % 5 = 0 AND seo_score % 5 = 0)
        ORDER BY last_checked_at NULLS FIRST
      `;
      return rows.map((r) => r.domain);
    }
    case 'low65':
    default: {
      const rows = await sql<{ domain: string }[]>`
        SELECT domain FROM geo_rating
        WHERE llm_score <= 65
           OR seo_score <= 65
           OR schema_score <= 65
           OR direct_score <= 65
        ORDER BY llm_score ASC, seo_score ASC
      `;
      return rows.map((r) => r.domain);
    }
  }
}

interface ScanResult {
  domain: string;
  ok: boolean;
  scores?: { llm: number; seo: number; schema: number; direct: number };
  error?: string;
  durationSec: number;
}

async function startScan(api: string, domain: string): Promise<string | null> {
  const resp = await fetch(`${api}/api/v1/site-check/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: `https://${domain}`, mode: 'page', force: true }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(`start ${resp.status}: ${body?.error ?? 'unknown'}`);
  }
  const data = (await resp.json()) as { scan_id?: string };
  return data.scan_id ?? null;
}

async function pollScan(
  api: string,
  scanId: string,
  timeoutMs: number,
  pollMs: number,
): Promise<{ status: string; scores?: any; error?: string }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const resp = await fetch(`${api}/api/v1/site-check/status/${scanId}`);
    if (!resp.ok) throw new Error(`status ${resp.status}`);
    const data = (await resp.json()) as { status: string; scores_preview?: any; error_message?: string };
    if (data.status === 'done') return { status: 'done', scores: data.scores_preview };
    if (data.status === 'error') return { status: 'error', error: data.error_message ?? 'worker error' };
    await new Promise((r) => setTimeout(r, pollMs));
  }
  return { status: 'timeout', error: `timeout after ${timeoutMs / 1000}s` };
}

async function processDomain(domain: string, args: Args): Promise<ScanResult> {
  const t0 = Date.now();
  try {
    const scanId = await startScan(args.api, domain);
    if (!scanId) throw new Error('no scan_id returned');
    const result = await pollScan(args.api, scanId, args.timeoutMs, args.pollMs);
    const durationSec = Math.round((Date.now() - t0) / 1000);
    if (result.status !== 'done') {
      return { domain, ok: false, error: result.error ?? result.status, durationSec };
    }
    const s = result.scores ?? {};
    return {
      domain,
      ok: true,
      scores: {
        llm: Number(s.ai ?? s.llm ?? 0),
        seo: Number(s.seo ?? 0),
        schema: Number(s.schema ?? 0),
        direct: Number(s.direct ?? 0),
      },
      durationSec,
    };
  } catch (e) {
    return {
      domain,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      durationSec: Math.round((Date.now() - t0) / 1000),
    };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const args = parseArgs();
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const sql = postgres(dbUrl, { max: 2 });

  console.log(`[rescan] mode=${args.mode} api=${args.api} concurrency=${args.concurrency}`);
  const domains = await fetchDomains(sql, args);
  if (domains.length === 0) {
    console.log('[rescan] no domains matched the filter — nothing to do.');
    await sql.end();
    return;
  }
  console.log(`[rescan] ${domains.length} domains queued for rescan:\n  ${domains.join(', ')}`);

  const t0 = Date.now();
  let done = 0;
  const results = await runWithConcurrency(domains, args.concurrency, async (domain) => {
    const r = await processDomain(domain, args);
    done++;
    if (r.ok && r.scores) {
      console.log(
        `  ✓ [${done}/${domains.length}] ${r.domain}: llm=${r.scores.llm} seo=${r.scores.seo} schema=${r.scores.schema} direct=${r.scores.direct} (${r.durationSec}s)`,
      );
    } else {
      console.log(`  ✗ [${done}/${domains.length}] ${r.domain}: ${r.error} (${r.durationSec}s)`);
    }
    // brief breath between domains to be gentle on the API
    await new Promise((res) => setTimeout(res, 500));
    return r;
  });

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;
  const totalSec = Math.round((Date.now() - t0) / 1000);
  const avgSec = results.length ? Math.round(results.reduce((s, r) => s + r.durationSec, 0) / results.length) : 0;

  console.log('\n[rescan] summary');
  console.log(`  processed: ${results.length}`);
  console.log(`  success:   ${okCount}`);
  console.log(`  failed:    ${failCount}`);
  console.log(`  total:     ${totalSec}s   avg per domain: ${avgSec}s`);

  if (failCount > 0) {
    console.log('\n[rescan] failures:');
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  - ${r.domain}: ${r.error}`);
    }
  }

  await sql.end();
}

main().catch((e) => {
  console.error('[rescan] fatal:', e);
  process.exit(1);
});