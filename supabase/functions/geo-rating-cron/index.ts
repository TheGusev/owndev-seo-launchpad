import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ⚠️ DEPRECATED — replaced by Node API endpoint:
//   POST https://owndev.ru/api/v1/site-check/admin/rescan-geo-rating
//   Headers: X-Admin-Token: $ADMIN_TOKEN
//   Body:    { "mode": "low65" | "score65" | "stale" | "all", "domain"?: "foo.ru" }
// The new flow runs through SiteCheckWorker which writes precise fractional
// scores into geo_rating via INSERT ... ON CONFLICT. This Edge Function used
// to overwrite those values with stale "bucketed" scores (65/80/100 etc.) and
// must NOT be invoked anymore.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function fnUrl(name: string, path = "") {
  return `${SUPABASE_URL}/functions/v1/${name}${path}`;
}

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  };
}

async function pollScan(scanId: string, timeoutMs = 90000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch(fnUrl("site-check-scan", `/status/${scanId}`), {
        headers: headers(),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      if (data.status === "done") return true;
      if (data.status === "error") return false;
    } catch {
      return false;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return false;
}

async function processSite(site: { id: string; domain: string }): Promise<{ domain: string; status: string; error?: string }> {
  try {
    const startResp = await fetch(fnUrl("site-check-scan", "/start"), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ url: `https://${site.domain}`, mode: "page" }),
    });

    if (!startResp.ok) {
      const body = await startResp.json().catch(() => ({}));
      if (startResp.status === 429 && body.last_scan_id) {
        const scanDone = await pollScan(body.last_scan_id);
        if (scanDone) {
          await updateFromScan(site.id, body.last_scan_id);
          return { domain: site.domain, status: "updated_from_cached" };
        }
      }
      return { domain: site.domain, status: "scan_start_failed", error: body.error };
    }

    const startData = await startResp.json();
    const scanId = startData.scan_id;

    if (startData.cached) {
      await updateFromScan(site.id, scanId);
      return { domain: site.domain, status: "updated_from_cache" };
    }

    const done = await pollScan(scanId);
    if (!done) {
      return { domain: site.domain, status: "timeout" };
    }

    await updateFromScan(site.id, scanId);
    return { domain: site.domain, status: "updated" };
  } catch (e) {
    return { domain: site.domain, status: "error", error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Hard deprecation: refuse to run so old buckets don't overwrite fresh data.
  return new Response(
    JSON.stringify({
      error: "GONE",
      message:
        "geo-rating-cron deprecated. Use POST /api/v1/site-check/admin/rescan-geo-rating on owndev backend with X-Admin-Token.",
      replacement: "https://owndev.ru/api/v1/site-check/admin/rescan-geo-rating",
    }),
    {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );

  // eslint-disable-next-line no-unreachable
  try {
    let domain: string | undefined;
    let batchSize = 3;
    let offset = 0;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        domain = body.domain;
        batchSize = body.batch_size ?? 3;
        offset = body.offset ?? 0;
      } catch {
        // empty body is fine, use defaults
      }
    }

    let sites: { id: string; domain: string }[];

    if (domain) {
      // Single domain mode
      const { data, error } = await supabase
        .from("geo_rating")
        .select("id, domain")
        .eq("domain", domain)
        .limit(1);
      if (error || !data?.length) {
        return new Response(JSON.stringify({ error: `Domain "${domain}" not found in geo_rating` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sites = data as { id: string; domain: string }[];
    } else {
      // Batch mode
      const { data, error } = await supabase
        .from("geo_rating")
        .select("id, domain")
        .order("domain")
        .range(offset, offset + batchSize - 1);
      if (error || !data) {
        return new Response(JSON.stringify({ error: "Failed to read geo_rating" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sites = data as { id: string; domain: string }[];
    }

    // Get total count for progress info
    const { count } = await supabase
      .from("geo_rating")
      .select("id", { count: "exact", head: true });

    const results = [];
    for (const site of sites) {
      const result = await processSite(site);
      results.push(result);
    }

    return new Response(JSON.stringify({
      processed: results.length,
      total: count ?? 0,
      offset,
      next_offset: domain ? null : offset + batchSize,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function updateFromScan(geoRatingId: string, scanId: string) {
  const { data: scan } = await supabase
    .from("scans")
    .select("scores, issues, seo_data, llm_judge")
    .eq("id", scanId)
    .maybeSingle();

  if (!scan) return;

  const scores = (scan.scores as any) || {};
  const issues = (scan.issues as any[]) || [];
  const seoData = (scan.seo_data as any) || {};
  const llmJudge = (scan.llm_judge as any) || {};

  const topErrors = issues
    .filter((i: any) => i.severity === "critical" || i.severity === "high")
    .slice(0, 3)
    .map((i: any) => ({ title: i.title, severity: i.severity }));

  const hasLlmsTxt = seoData?.hasLlmsTxt ?? llmJudge?.has_llms_txt ?? false;
  const hasFaqpage = seoData?.has_faqpage ?? (issues.some((i: any) => i.rule_id === "no_faqpage") ? false : true);
  const schemaVal = scores.schema ?? scores.schema_score ?? 0;
  const hasSchema = schemaVal > 30;

  await supabase
    .from("geo_rating")
    .update({
      llm_score: scores.ai ?? scores.ai_score ?? scores.llm_score ?? 0,
      seo_score: scores.seo ?? scores.seo_score ?? 0,
      schema_score: scores.schema ?? scores.schema_score ?? 0,
      direct_score: scores.direct ?? scores.direct_score ?? 0,
      has_llms_txt: hasLlmsTxt,
      has_faqpage: hasFaqpage,
      has_schema: hasSchema,
      errors_count: issues.length,
      top_errors: topErrors,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", geoRatingId);
}
