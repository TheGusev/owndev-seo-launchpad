import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SHOP_ID = '1308372';
const AMOUNT = '1490.00';
const CURRENCY = 'RUB';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const secretKey = Deno.env.get('YUKASSA_SECRET_KEY');
    if (!secretKey) {
      return new Response(JSON.stringify({ error: 'Payment system not configured yet. YUKASSA_SECRET_KEY is missing.' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { scan_id, email, url, return_url } = await req.json();

    if (!scan_id || !email || !url) {
      return new Response(JSON.stringify({ error: 'scan_id, email and url are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify scan exists
    const { data: scan } = await supabase.from('scans').select('id, status, url').eq('id', scan_id).single();
    if (!scan) {
      return new Response(JSON.stringify({ error: 'Scan not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create report record with pending status
    const { data: report, error: reportError } = await supabase.from('reports').insert({
      scan_id,
      email,
      payment_status: 'pending',
    }).select('id, download_token').single();

    if (reportError) throw reportError;

    // Determine return URL
    const finalReturnUrl = return_url || `https://owndev.ru/tools/site-check/result/${scan_id}?payment=success&report_id=${report.id}`;

    // Create YooKassa payment
    const idempotenceKey = crypto.randomUUID();
    const basicAuth = btoa(`${SHOP_ID}:${secretKey}`);

    const ykResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`,
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify({
        amount: { value: AMOUNT, currency: CURRENCY },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: finalReturnUrl,
        },
        description: `Полный GEO-аудит сайта ${url}`,
        metadata: {
          report_id: report.id,
          scan_id,
          email,
          url,
        },
        receipt: {
          customer: { email },
          items: [{
            description: 'Полный GEO-аудит сайта',
            quantity: '1.00',
            amount: { value: AMOUNT, currency: CURRENCY },
            vat_code: 1,
            payment_mode: 'full_payment',
            payment_subject: 'service',
          }],
        },
      }),
    });

    if (!ykResponse.ok) {
      const errBody = await ykResponse.text();
      console.error('YooKassa error:', ykResponse.status, errBody);
      // Clean up the report record
      await supabase.from('reports').delete().eq('id', report.id);
      return new Response(JSON.stringify({ error: 'Payment creation failed', details: errBody }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payment = await ykResponse.json();

    // Update report with payment_id
    await supabase.from('reports').update({ payment_id: payment.id }).eq('id', report.id);

    return new Response(JSON.stringify({
      payment_url: payment.confirmation?.confirmation_url,
      payment_id: payment.id,
      report_id: report.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
