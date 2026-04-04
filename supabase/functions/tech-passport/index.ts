import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const whoisKey = Deno.env.get("WHOIS_API_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

/* ─── Tech Detection ─── */
function detectTechStack(html: string, headers: Headers) {
  const result: Record<string, any> = {
    cms: null, cms_version: null, framework: null,
    rendering: "Классический сервер", server: null, server_version: null,
    cdn: null, analytics: [] as string[], analytics_ids: {} as Record<string, string>,
    crm_widgets: [] as string[], cms_confidence: "low", is_spa: false,
  };

  // Server
  const srv = headers.get("server") || "";
  if (/nginx/i.test(srv)) { result.server = "Nginx"; result.server_version = srv.match(/[\d.]+/)?.[0] || null; }
  else if (/apache/i.test(srv)) { result.server = "Apache"; result.server_version = srv.match(/[\d.]+/)?.[0] || null; }
  else if (/litespeed/i.test(srv)) { result.server = "LiteSpeed"; }
  else if (/iis/i.test(srv)) { result.server = "IIS"; }

  // CDN
  if (headers.get("cf-ray")) result.cdn = "Cloudflare";
  else if (headers.get("x-fastly-request-id")) result.cdn = "Fastly";
  else if (headers.get("x-akamai-transformed")) result.cdn = "Akamai";

  // X-Powered-By
  const xpb = headers.get("x-powered-by") || "";
  
  // Bitrix headers
  if (headers.get("x-bitrix-composite")) result.cms = "Bitrix";

  // CMS detection from HTML
  const gen = html.match(/<meta\s+name=["']generator["']\s+content=["']([^"']+)["']/i)?.[1] || "";
  if (/wordpress/i.test(gen)) { result.cms = "WordPress"; result.cms_version = gen.match(/[\d.]+/)?.[0] || null; result.cms_confidence = "high"; }
  else if (/joomla/i.test(gen)) { result.cms = "Joomla"; result.cms_confidence = "high"; }
  else if (/drupal/i.test(gen)) { result.cms = "Drupal"; result.cms_confidence = "high"; }

  // Pattern-based CMS
  if (!result.cms) {
    if (/\/wp-content\/|\/wp-includes\//i.test(html)) { result.cms = "WordPress"; result.cms_confidence = "high"; }
    else if (/tilda\.ws|tilda-page|data-tilda|t-page/i.test(html)) { result.cms = "Tilda"; result.cms_confidence = "high"; }
    else if (/\/bitrix\//i.test(html)) { result.cms = "Bitrix"; result.cms_confidence = "high"; }
    else if (/wix-published-version/i.test(html)) { result.cms = "Wix"; result.cms_confidence = "high"; }
    else if (/shopify\.com|cdn\.shopify/i.test(html)) { result.cms = "Shopify"; result.cms_confidence = "medium"; }
    else if (/opencart/i.test(html)) { result.cms = "OpenCart"; result.cms_confidence = "medium"; }
  }

  // Framework
  if (/_next\/static/i.test(html)) result.framework = "Next.js";
  else if (/__nuxt|nuxt\.js/i.test(html)) result.framework = "Nuxt.js";
  else if (/gatsby-/i.test(html)) result.framework = "Gatsby";
  else if (/<app-root|ng-version/i.test(html)) result.framework = "Angular";
  else if (/__vue|vue\.js/i.test(html)) result.framework = "Vue.js";
  else if (/react|__webpack|_reactRootContainer/i.test(html)) result.framework = "React";

  // Rendering type
  const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || "";
  const textLen = bodyContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().length;
  if (textLen < 200 && /<div\s+id=["'](?:root|app|__next)["']/i.test(html)) {
    result.rendering = "SPA"; result.is_spa = true;
  } else if (result.framework === "Next.js" || result.framework === "Nuxt.js") {
    result.rendering = "SSR";
  } else if (result.framework === "Gatsby") {
    result.rendering = "SSG";
  }

  // Analytics
  const ymMatch = html.match(/mc\.yandex\.ru\/(?:metrika\/)?(?:watch|tag)\.js[^"']*["'][^)]*?(\d{5,})/i) 
    || html.match(/ym\((\d{5,})/i) 
    || html.match(/yaCounter(\d{5,})/i);
  if (ymMatch || /mc\.yandex\.ru/i.test(html)) {
    result.analytics.push("Яндекс.Метрика");
    if (ymMatch?.[1]) result.analytics_ids["Яндекс.Метрика"] = ymMatch[1];
  }
  const gaMatch = html.match(/gtag.*?(G-[A-Z0-9]+|UA-\d+-\d+)/i);
  if (gaMatch) { result.analytics.push("Google Analytics 4"); result.analytics_ids["GA4"] = gaMatch[1]; }
  else if (/google-analytics\.com|googletagmanager\.com\/gtag/i.test(html)) { result.analytics.push("Google Analytics 4"); }
  const gtmMatch = html.match(/GTM-([A-Z0-9]+)/i);
  if (gtmMatch) { result.analytics.push("Google Tag Manager"); result.analytics_ids["GTM"] = `GTM-${gtmMatch[1]}`; }
  if (/vk\.com\/rtrg/i.test(html)) result.analytics.push("VK Pixel");
  if (/top-fwz1\.mail\.ru/i.test(html)) result.analytics.push("myTarget");
  if (/cdn\.roistat\.com/i.test(html)) result.analytics.push("Roistat");
  if (/mod\.calltouch\.ru/i.test(html)) result.analytics.push("Calltouch");

  // CRM/widgets
  if (/jivosite\.com/i.test(html)) result.crm_widgets.push("JivoChat");
  if (/carrotquest\.io/i.test(html)) result.crm_widgets.push("Carrotquest");
  if (/tawk\.to/i.test(html)) result.crm_widgets.push("Tawk.to");
  if (/amocrm\.ru|amo_forms/i.test(html)) result.crm_widgets.push("AmoCRM");
  if (/b24-widget|bitrix24/i.test(html)) result.crm_widgets.push("Битрикс24");
  if (/retailcrm/i.test(html)) result.crm_widgets.push("RetailCRM");

  return result;
}

/* ─── Retry wrapper ─── */
async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await fn();
      if (result !== null) return result;
    } catch { /* continue */ }
  }
  return null;
}

/* ─── WHOIS ─── */
async function fetchWhois(domain: string) {
  if (!whoisKey) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(`https://whoisjson.com/api/v1/whois?domain=${domain}&apikey=${whoisKey}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const d = await r.json();
    const created = d.creation_date || d.created || d.created_date || null;
    const expiry = d.expiration_date || d.expiry_date || d.registry_expiry_date || null;
    let days_until_expiry: number | null = null;
    if (expiry) {
      const exp = new Date(expiry);
      days_until_expiry = Math.ceil((exp.getTime() - Date.now()) / 86400000);
    }
    return {
      registrar: d.registrar || null,
      created_date: created,
      expiry_date: expiry,
      days_until_expiry,
      nameservers: d.nameservers || d.name_servers || [],
      status: d.status || d.domain_status || null,
    };
  } catch { return null; }
}

/* ─── IP / Geo ─── */
async function fetchGeoIp(domain: string) {
  try {
    const dnsR = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const dnsD = await dnsR.json();
    const ip = dnsD?.Answer?.find((a: any) => a.type === 1)?.data;
    if (!ip) return null;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(`https://api.ipapi.is?q=${ip}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const d = await r.json();
    
    const flags: Record<string, string> = {
      RU: "🇷🇺", DE: "🇩🇪", NL: "🇳🇱", US: "🇺🇸", FI: "🇫🇮", FR: "🇫🇷", GB: "🇬🇧", 
      UA: "🇺🇦", KZ: "🇰🇿", BY: "🇧🇾", PL: "🇵🇱", CZ: "🇨🇿", SE: "🇸🇪",
    };
    const cc = d.location?.country_code || "";
    return {
      ip_address: ip,
      country: d.location?.country || null,
      country_code: cc,
      country_flag: flags[cc] || "🌍",
      city: d.location?.city || null,
      hosting_provider: d.company?.name || d.asn?.org || null,
      asn_org: d.asn?.org || null,
    };
  } catch { return null; }
}

/* ─── Main Handler ─── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url, scan_id } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: "url required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const domain = new URL(url).hostname;

    // Check cache (versioned)
    const CACHE_VERSION = 2;
    const { data: cached } = await supabase
      .from("tech_stack_cache")
      .select("data_json")
      .eq("domain", domain)
      .gte("scanned_at", new Date(Date.now() - 86400000).toISOString())
      .maybeSingle();

    if (cached?.data_json && (cached.data_json as any)?._v === CACHE_VERSION) {
      return new Response(JSON.stringify(cached.data_json), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch HTML + WHOIS + GeoIP in parallel (with retry for WHOIS/Geo)
    const [htmlRes, whoisRes, geoRes] = await Promise.allSettled([
      fetch(url, { headers: { "User-Agent": "OwnDev-Bot/1.0" }, redirect: "follow", signal: AbortSignal.timeout(8000) }),
      withRetry(() => fetchWhois(domain)),
      withRetry(() => fetchGeoIp(domain)),
    ]);

    let tech: Record<string, any> = {};
    if (htmlRes.status === "fulfilled" && htmlRes.value.ok) {
      const html = await htmlRes.value.text();
      tech = detectTechStack(html, htmlRes.value.headers);
    }

    const whois = whoisRes.status === "fulfilled" ? whoisRes.value : null;
    const geoip = geoRes.status === "fulfilled" ? geoRes.value : null;

    const CACHE_VERSION = 2;
    const result = { tech, whois, geoip, _v: CACHE_VERSION };

    // Cache
    await supabase.from("tech_stack_cache").upsert(
      { domain, data_json: result, scanned_at: new Date().toISOString() },
      { onConflict: "domain" }
    );

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
