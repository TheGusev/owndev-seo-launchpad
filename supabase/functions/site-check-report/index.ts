import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const supabase = getSupabase();

  try {
    // POST /create — create report record (email + scan_id)
    if (req.method === 'POST' && (pathParts.length <= 1 || pathParts[1] === 'create')) {
      const { scan_id, email } = await req.json();
      if (!scan_id || !email) {
        return new Response(JSON.stringify({ error: 'scan_id and email required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Verify scan exists
      const { data: scan } = await supabase.from('scans').select('id, status').eq('id', scan_id).single();
      if (!scan) {
        return new Response(JSON.stringify({ error: 'Scan not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Create report
      const { data: report, error } = await supabase.from('reports').insert({
        scan_id,
        email,
        payment_status: 'pending',
      }).select('id, download_token').single();

      if (error) throw error;

      // In production, this would create a ЮKassa payment and return payment_url
      // For now, return report_id and a placeholder payment_url
      return new Response(JSON.stringify({
        report_id: report.id,
        download_token: report.download_token,
        payment_url: null, // Will be ЮKassa URL after integration
        message: 'Оплата через ЮKassa будет подключена в следующем промте',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // GET /:reportId — get report info
    if (req.method === 'GET' && pathParts[1] && pathParts[1] !== 'download') {
      const reportId = pathParts[1];
      const token = url.searchParams.get('token');

      const { data: report } = await supabase.from('reports')
        .select('*, scans(*)')
        .eq('id', reportId)
        .single();

      if (!report) {
        return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Token check for full data
      if (token && token === report.download_token && report.payment_status === 'paid') {
        return new Response(JSON.stringify({
          report_id: report.id,
          email: report.email,
          payment_status: report.payment_status,
          scan: report.scans,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Without valid token, return limited info
      return new Response(JSON.stringify({
        report_id: report.id,
        payment_status: report.payment_status,
        scan_id: report.scan_id,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
