import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  service: string;
  message?: string;
}

const serviceLabels: Record<string, string> = {
  landing: "Лендинг",
  corporate: "Корпоративный сайт",
  ecommerce: "Интернет-магазин",
  seo: "SEO-оптимизация",
  saas: "SaaS-платформа",
  consultation: "Консультация"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram credentials');
      throw new Error('Telegram configuration is missing');
    }

    const data: ContactFormData = await req.json();
    console.log('Received form data:', data);

    const now = new Date();
    const moscowTime = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    const serviceLabel = serviceLabels[data.service] || data.service;

    const message = `📬 *НОВАЯ ЗАЯВКА С САЙТА*

👤 *Имя:* ${data.name}
📞 *Телефон:* ${data.phone}
📧 *Email:* ${data.email}
🛠 *Услуга:* ${serviceLabel}

💬 *Сообщение:*
${data.message || 'Не указано'}

⏰ *Время:* ${moscowTime}`;

    console.log('Sending message to Telegram...');

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const telegramResult = await telegramResponse.json();
    console.log('Telegram API response:', telegramResult);

    if (!telegramResult.ok) {
      console.error('Telegram API error:', telegramResult);
      throw new Error(`Telegram API error: ${telegramResult.description}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Form submitted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-to-telegram function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
