import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

async function pollScan(scanId: string, timeoutMs = 120000): Promise<boolean> {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { data: sites, error } = await supabase
      .from("geo_rating")
      .select("id, domain")
      .order("domain");

    if (error || !sites) {
      return new Response(JSON.stringify({ error: "Failed to read geo_rating" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { domain: string; status: string; error?: string }[] = [];

    for (const site of sites) {
      try {
        // Start scan
        const startResp = await fetch(fnUrl("site-check-scan", "/start"), {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ url: `https://${site.domain}`, mode: "page" }),
        });

        if (!startResp.ok) {
          const body = await startResp.json().catch(() => ({}));
          // If rate limited with existing scan, try to use that
          if (startResp.status === 429 && body.last_scan_id) {
            const scanDone = await pollScan(body.last_scan_id);
            if (scanDone) {
              await updateFromScan(site.id, body.last_scan_id);
              results.push({ domain: site.domain, status: "updated_from_cached" });
              continue;
            }
          }
          results.push({ domain: site.domain, status: "scan_start_failed", error: body.error });
          continue;
        }

        const startData = await startResp.json();
        const scanId = startData.scan_id;

        if (startData.cached) {
          await updateFromScan(site.id, scanId);
          results.push({ domain: site.domain, status: "updated_from_cache" });
          continue;
        }

        // Poll until done
        const done = await pollScan(scanId);
        if (!done) {
          results.push({ domain: site.domain, status: "timeout" });
          continue;
        }

        await updateFromScan(site.id, scanId);
        results.push({ domain: site.domain, status: "updated" });
      } catch (e) {
        results.push({ domain: site.domain, status: "error", error: String(e) });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
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

  const hasLlmsTxt = llmJudge?.has_llms_txt ?? false;
  const hasFaqpage = seoData?.has_faqpage ?? (issues.some((i: any) => i.rule_id === "no_faqpage") ? false : true);
  const hasSchema = (scores.schema_score ?? 0) > 30;

  await supabase
    .from("geo_rating")
    .update({
      llm_score: scores.ai_score ?? scores.llm_score ?? 0,
      seo_score: scores.seo_score ?? 0,
      schema_score: scores.schema_score ?? 0,
      direct_score: scores.direct_score ?? 0,
      has_llms_txt: hasLlmsTxt,
      has_faqpage: hasFaqpage,
      has_schema: hasSchema,
      errors_count: issues.length,
      top_errors: topErrors,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", geoRatingId);
}
