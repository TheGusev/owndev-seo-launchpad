import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    console.log('YooKassa webhook received:', JSON.stringify(body));

    const event = body.event;
    const payment = body.object;

    if (!payment || !event) {
      return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (event === 'payment.succeeded' && payment.status === 'succeeded') {
      const reportId = payment.metadata?.report_id;
      const scanId = payment.metadata?.scan_id;
      const email = payment.metadata?.email;
      const url = payment.metadata?.url;

      if (!reportId) {
        console.error('No report_id in payment metadata');
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update report status to paid
      const { error: updateError } = await supabase.from('reports').update({
        payment_status: 'paid',
        payment_id: payment.id,
      }).eq('id', reportId);

      if (updateError) {
        console.error('Failed to update report:', updateError);
      }

      // Send Telegram notification
      try {
        const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
        if (telegramToken && chatId) {
          const amount = payment.amount?.value || '1490.00';
          const message = `💰 Оплата получена!\n\nСумма: ${amount} ₽\nEmail: ${email || '—'}\nURL: ${url || '—'}\nReport: ${reportId}\nPayment: ${payment.id}`;
          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
          });
        }
      } catch (tgErr) {
        console.error('Telegram notification error:', tgErr);
      }

      console.log(`Payment succeeded for report ${reportId}, scan ${scanId}`);
    }

    if (event === 'payment.canceled') {
      const reportId = payment.metadata?.report_id;
      if (reportId) {
        await supabase.from('reports').update({
          payment_status: 'canceled',
          payment_id: payment.id,
        }).eq('id', reportId);
        console.log(`Payment canceled for report ${reportId}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
