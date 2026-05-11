/**
 * Фронтовое зеркало P0-словаря из бэкенда:
 * owndev-backend/src/services/developerPack/p0Dictionary.ts
 *
 * Цель — выводить в PDF/Word PRO-отчёте читаемые расшифровки вместо голых
 * кодов вроде «AILLM_P0_FAQ_BLOCK». Источник истины — бэкенд; фронту
 * приходят коды через result.preflight_rollup.failed_p0_codes и
 * preflight_per_page[*].failed_p0.
 *
 * При расхождении синхронизировать ОБА файла одновременно.
 */

export interface P0Explanation {
  title: string;
  why: string;
  whatToDo: string;
}

export const P0_DICTIONARY: Record<string, P0Explanation> = {
  // SEO P0
  SEO_P0_TITLE_PRESENT: {
    title: 'Отсутствует или пустой тег <title>',
    why: 'Title — основной сигнал для поисковиков и сниппета в выдаче. Без него страница теряет позиции и кликабельность.',
    whatToDo: 'Прописать <title> длиной 50–60 символов, с основным ключевым запросом в начале.',
  },
  SEO_P0_H1_PRESENT: {
    title: 'На странице нет H1 заголовка',
    why: 'H1 определяет основную тему страницы для поисковика и пользователя. Без него ранжирование падает.',
    whatToDo: 'Добавить ровно один H1 в начале основного блока контента. Длина — 30–70 символов, отражать основной запрос.',
  },
  SEO_P0_META_DESC: {
    title: 'Нет или слишком короткий meta description',
    why: 'Meta description формирует сниппет в выдаче — короткий или отсутствующий снижает CTR в 2–3 раза.',
    whatToDo: 'Добавить meta description длиной 120–160 символов с конкретной выгодой и call-to-action.',
  },
  SEO_P0_INDEXABLE: {
    title: 'Страница закрыта от индексации',
    why: 'Robots-meta или X-Robots-Tag запрещают индексацию — страница не попадает в выдачу совсем.',
    whatToDo: 'Убрать noindex из meta robots и проверить заголовок X-Robots-Tag. Только utility-страницы должны быть noindex.',
  },
  SEO_P0_CANONICAL: {
    title: 'Нет self-canonical или canonical указывает на другую страницу',
    why: 'Без canonical поисковики могут считать страницу дублем и отдать вес другому URL.',
    whatToDo: 'Добавить <link rel="canonical" href="<тот же URL>"/> на каждую индексируемую страницу.',
  },

  // DIRECT P0
  DIRECT_P0_PRIMARY_CTA: {
    title: 'Нет основной CTA-кнопки выше первого экрана',
    why: 'Пользователь не должен скроллить, чтобы найти главное действие. Без CTA выше fold конверсия падает на 30–50%.',
    whatToDo: 'Разместить заметную CTA (Заказать / Получить расчёт / Записаться) в верхней зоне страницы.',
  },
  DIRECT_P0_PHONE_CLICKABLE: {
    title: 'Телефон не оформлен ссылкой tel:',
    why: 'На мобильных пользователь не может ткнуть, чтобы позвонить. Теряются звонки от половины аудитории.',
    whatToDo: 'Обернуть телефон в <a href="tel:+7XXXXXXXXXX">. Формат E.164 без пробелов в href.',
  },
  DIRECT_P0_LEAD_FORM: {
    title: 'На странице нет формы заявки',
    why: 'Без формы (или открытого чата / кнопки заказа) страница не собирает лиды — теряется главный канал конверсии.',
    whatToDo: 'Добавить компактную форму (имя + телефон) либо как floating-CTA. Минимум полей, обязательно политика.',
  },

  // SCHEMA P0
  SCHEMA_P0_JSONLD_PRESENT: {
    title: 'Нет JSON-LD разметки на странице',
    why: 'Schema.org JSON-LD — стандартный сигнал для поисковиков и AI-ботов. Без него нет rich snippet и хуже AI-цитируемость.',
    whatToDo: 'Добавить <script type="application/ld+json"> с базовой разметкой Organization + WebSite + WebPage в <head>.',
  },
  SCHEMA_P0_GRAPH_ROOT: {
    title: 'JSON-LD не оформлен через @graph',
    why: 'Без @graph несколько схем на одной странице конфликтуют — поисковик игнорирует часть данных.',
    whatToDo: 'Объединить все блоки JSON-LD в один <script> с { "@context": "https://schema.org", "@graph": [...] }.',
  },
  SCHEMA_P0_REQUIRED_TYPES: {
    title: 'В JSON-LD отсутствуют обязательные типы для этой ниши',
    why: 'Каждый тип проекта требует своего набора схем (LocalBusiness + Service для гео-услуг). Без них rich-результаты не показываются.',
    whatToDo: 'Сверить список required_schemas из контракта страницы и добавить недостающие типы в @graph.',
  },
  SCHEMA_P0_VALID_JSON: {
    title: 'JSON-LD содержит синтаксические ошибки',
    why: 'Невалидный JSON-LD парсеры (Google, Yandex, ChatGPT) полностью игнорируют — вся разметка пропадает зря.',
    whatToDo: 'Прогнать JSON-LD через validator.schema.org или search.google.com/test/rich-results и починить ошибки.',
  },

  // AI / LLM P0
  AILLM_P0_LLMS_TXT: {
    title: 'Нет файла llms.txt в корне сайта',
    why: 'llms.txt — официальный стандарт для AI-агентов (ChatGPT, Perplexity, Claude). Без него сайт реже попадает в AI-ответы.',
    whatToDo: 'Положить /llms.txt в корень с разделами: # Site, # Allow для AI-ботов, # Pages со списком ключевых страниц.',
  },
  AILLM_P0_AI_ROBOTS: {
    title: 'В robots.txt нет правил для AI-ботов',
    why: 'По умолчанию AI-боты (GPTBot, ClaudeBot, PerplexityBot, YandexGPT) могут быть заблокированы wildcard-правилами.',
    whatToDo: 'Добавить в /robots.txt секции «User-agent: GPTBot / PerplexityBot / ClaudeBot» с «Allow: /».',
  },
  AILLM_P0_INTRO_ANSWER: {
    title: 'Нет краткого ответа в первом абзаце страницы',
    why: 'AI-ассистенты ищут прямой ответ в первых 200 словах. Без него сайт не попадает в AI-цитаты.',
    whatToDo: 'Первый параграф каждой ключевой страницы — прямой 40–80-словный ответ на основной запрос.',
  },
  AILLM_P0_FAQ_BLOCK: {
    title: 'Нет блока FAQ для AI-ботов',
    why: 'Без FAQ-секции с микроразметкой FAQPage LLM (ChatGPT/Perplexity/Алиса) не получают структурированные ответы и реже цитируют сайт.',
    whatToDo: 'Добавить FAQ-секцию из 5+ вопросов с микроразметкой schema.org/FAQPage на ключевых страницах услуг и категорий.',
  },

  // V1 Guardrails
  V1_P0_ONE_URL_ONE_ENTITY: {
    title: 'На одну сущность приходится несколько URL',
    why: 'Дубли URL размывают сигналы для поисковика и съедают краулинговый бюджет.',
    whatToDo: 'Один URL = одна сущность. Лишние URL закрыть 301-редиректом или canonical.',
  },
  V1_P0_UTILITY_NOINDEX: {
    title: 'Utility-страницы (кабинет, корзина) индексируются',
    why: 'Эти страницы не имеют поисковой ценности и тянут весь сайт вниз по качеству.',
    whatToDo: 'Личный кабинет, корзина, оформление, фильтры — закрыть от индексации через meta robots noindex.',
  },
  V1_P0_UTILITY_NO_SITEMAP: {
    title: 'Utility-страницы попали в sitemap.xml',
    why: 'Sitemap должен содержать только индексируемые страницы.',
    whatToDo: 'Убрать из sitemap.xml все noindex-страницы (кабинет, корзина, юр. страницы).',
  },
  V1_P0_UTILITY_NO_SEO_LINKING: {
    title: 'На utility-страницы ведёт внутренняя перелинковка из SEO-страниц',
    why: 'Это передаёт ссылочный вес в служебные разделы вместо коммерческих.',
    whatToDo: 'Перенаправить внутренние ссылки с продающих страниц на коммерческие. Ссылки в кабинет — только из меню и футера.',
  },
  V1_P0_CENTRALIZED_ROUTING: {
    title: 'Маршрутизация URL разбросана по разным частям кода',
    why: 'Без централизованного route-config неуправляемо растут дубли и теряются canonical.',
    whatToDo: 'Свести все правила URL и canonical в один route-config модуля, использовать его и на сервере, и на фронте.',
  },
  V1_P0_VERIFICATION_ON_SCALE: {
    title: 'Нет верификационного прогона перед масштабированием',
    why: 'Без чеклиста перед запуском гео-страниц/категорий легко получить thin-content или каннибализацию.',
    whatToDo: 'Перед массовым запуском прогнать проверочный аудит (содержание уникально / canonical централизован / sitemap корректен).',
  },
};

export function explainP0Code(code: string): P0Explanation {
  const known = P0_DICTIONARY[code];
  if (known) return known;
  return {
    title: code,
    why: 'Описание для этого кода ещё не добавлено в P0-словарь.',
    whatToDo: 'Свериться с правилами preflight в backend ruleEngine.ts.',
  };
}
