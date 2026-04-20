import type { FastifyInstance } from 'fastify';
import { logger } from '../../utils/logger.js';

export async function aliceRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/alice/webhook — обработчик запросов Алисы
  app.post('/webhook', async (req, reply) => {
    const body = req.body as any;
    const command: string = (body?.request?.command || '').toLowerCase().trim();
    const isNewSession: boolean = body?.session?.new === true;

    const respond = (text: string, endSession: boolean, buttons?: { title: string; url?: string; hide?: boolean }[]) => {
      const response: any = { text, end_session: endSession };
      if (buttons?.length) response.buttons = buttons;
      return reply.send({ version: '1.0', response });
    };

    if (isNewSession || !command) {
      return respond(
        'Привет! Я помогу проверить ваш сайт на готовность к AI-поиску. Назовите домен сайта, например: owndev точка ру',
        false,
      );
    }

    if (['выход', 'стоп', 'хватит', 'закрыть', 'выйти'].includes(command)) {
      return respond('До свидания! Проверить сайт подробнее можно на owndev.ru', true);
    }

    // Извлекаем домен из команды (поддержка: "домен точка ру" → "домен.ру")
    const normalized = command.replace(/\s+точка\s+/g, '.').replace(/\s+/g, '');
    const domainMatch = normalized.match(/([a-zA-Zа-яёА-ЯЁ0-9-]+\.[a-zA-Zа-яёА-ЯЁ]{2,})/);

    if (!domainMatch) {
      return respond(
        'Не расслышала домен. Назовите адрес сайта, например: гугл точка ком или owndev точка ру',
        false,
      );
    }

    const domain = domainMatch[1];
    const url = `https://${domain}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const [siteResp, robotsResp, llmsResp] = await Promise.allSettled([
        fetch(url, { method: 'HEAD', signal: controller.signal }),
        fetch(`${url}/robots.txt`, { signal: controller.signal }),
        fetch(`${url}/llms.txt`, { signal: controller.signal }),
      ]);
      clearTimeout(timeout);

      const isAccessible = siteResp.status === 'fulfilled' && (siteResp.value as Response).ok;
      const robotsTxt = robotsResp.status === 'fulfilled' && (robotsResp.value as Response).ok
        ? await (robotsResp.value as Response).text()
        : '';
      const hasLlmsTxt = llmsResp.status === 'fulfilled' && (llmsResp.value as Response).ok;
      const hasGptBot = robotsTxt.toLowerCase().includes('gptbot');
      // Проверяем только глобальную блокировку всего сайта (Disallow: /) для * агента
      // партичные Disallow: /private/ не должны давать false positive
      const isGloballyBlocked = /user-agent:\s*\*[\s\S]*?disallow:\s*\/(?:\s|$)/i.test(robotsTxt);
      const isAiBlocked = isGloballyBlocked && !hasGptBot;

      let score = 0;
      if (isAccessible) score += 40;
      if (hasLlmsTxt) score += 30;
      if (!isAiBlocked) score += 20;
      if (hasGptBot) score += 10;

      const verdict = score >= 70 ? 'хорошая' : score >= 40 ? 'средняя' : 'низкая';
      const mainProblem = !hasLlmsTxt
        ? 'Нет файла llms.txt — AI не знает о вашем сайте'
        : isAiBlocked
        ? 'AI-краулеры заблокированы в robots.txt'
        : 'Требуется улучшение контента для AI';

      const text = `Проверил ${domain}. ` +
        `AI-готовность: ${verdict}, ${score} из 100. ` +
        `${mainProblem}. ` +
        `Полный отчёт на owndev.ru`;

      return respond(text, true, [
        { title: 'Полный отчёт', url: `https://owndev.ru/tools/site-check?url=${encodeURIComponent(url)}` },
        { title: 'Проверить другой сайт', hide: true },
      ]);
    } catch (e) {
      logger.warn('ALICE', `Quick audit failed for ${domain}: ${(e as Error).message}`);
      return respond(
        `Не удалось проверить ${domain}. Попробуйте позже или зайдите на owndev.ru для полного аудита`,
        false,
      );
    }
  });
}