export interface GeoParams {
  hasLlmsTxt: boolean;
  llmsTxtLength: number;
  hasJsonLd: boolean;
  schemaTypes: string[];
  wordCount: number;
  hasH1: boolean;
  hasFaq: boolean;
  hasHreflang: boolean;
  isRuDomain: boolean;
  robotsAllowsAiCrawlers: boolean;
  sitemapExists: boolean;
  loadTimeMs: number;
  hasLists: boolean;
  hasTables: boolean;
  hasAuthorMeta: boolean;
  hasContactPage: boolean;
  hasReviews: boolean;
  hasPricingBlock: boolean;
  pageAge: number | null;
}

export interface GeoSystemScore {
  id: string;
  name: string;
  score: number;
  verdict: string;
  reason: string;
  suggestions: string[];
}

export interface GeoResult {
  avg_score: number;
  systems: GeoSystemScore[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(v)));
}

// Minimum score per engine: even the worst site shows some presence potential
const ENGINE_FLOOR: Record<string, number> = {
  chatgpt: 10,
  perplexity: 8,
  yandex_neiro: 8,
  gemini: 10,
  gigachat: 8,
  alisa: 8,
};

function hasSchema(types: string[], ...names: string[]): boolean {
  return names.some((n) =>
    types.some((t) => t.toLowerCase().includes(n.toLowerCase()))
  );
}

function verdictLabel(score: number): string {
  if (score >= 80) return "Отлично";
  if (score >= 60) return "Хорошо";
  if (score >= 40) return "Удовлетворительно";
  if (score >= 20) return "Слабо";
  return "Критично";
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared building blocks (return { delta, label } tuples for reason building)
// ─────────────────────────────────────────────────────────────────────────────

interface Signal {
  delta: number;
  label: string;
}

function sigLlmsTxt(p: GeoParams, base: number): Signal {
  if (!p.hasLlmsTxt) return { delta: 0, label: "" };
  // bonus grows with file richness, capped
  const richness = Math.min(p.llmsTxtLength / 2000, 1); // 2000 chars = full bonus
  const delta = Math.round(base * (0.7 + 0.3 * richness));
  return { delta, label: `llms.txt найден (+${delta})` };
}

function sigJsonLd(p: GeoParams, base: number): Signal {
  if (!p.hasJsonLd) return { delta: 0, label: "" };
  return { delta: base, label: `JSON-LD разметка (+${base})` };
}

function sigSchemaOrg(p: GeoParams, base: number): Signal {
  if (p.schemaTypes.length === 0) return { delta: 0, label: "" };
  const delta = Math.min(base, Math.round(base * (0.5 + 0.1 * p.schemaTypes.length)));
  const list = p.schemaTypes.slice(0, 3).join(", ");
  return { delta, label: `Schema.org типы: ${list} (+${delta})` };
}

function sigFaq(p: GeoParams, base: number): Signal {
  if (!p.hasFaq) return { delta: 0, label: "" };
  const hasFaqSchema = hasSchema(p.schemaTypes, "FAQPage");
  const delta = hasFaqSchema ? base : Math.round(base * 0.6);
  const detail = hasFaqSchema ? "FAQPage schema" : "FAQ-секция (без schema)";
  return { delta, label: `${detail} (+${delta})` };
}

function sigWordCount(p: GeoParams, base: number): Signal {
  if (p.wordCount >= 800) return { delta: base, label: `Объём контента ${p.wordCount} слов (+${base})` };
  if (p.wordCount >= 400) {
    const d = Math.round(base * 0.6);
    return { delta: d, label: `Контент ${p.wordCount} слов (+${d})` };
  }
  if (p.wordCount >= 150) {
    const d = Math.round(base * 0.3);
    return { delta: d, label: `Мало контента: ${p.wordCount} слов (+${d})` };
  }
  return { delta: 0, label: `Слишком мало контента: ${p.wordCount} слов (+0)` };
}

function sigH1(p: GeoParams, base: number): Signal {
  if (!p.hasH1) return { delta: 0, label: "" };
  return { delta: base, label: `H1 присутствует (+${base})` };
}

function sigHreflang(p: GeoParams, base: number): Signal {
  if (!p.hasHreflang) return { delta: 0, label: "" };
  return { delta: base, label: `hreflang теги (+${base})` };
}

function sigRuDomain(p: GeoParams, base: number): Signal {
  if (!p.isRuDomain) return { delta: 0, label: "" };
  return { delta: base, label: `.ru/.рф домен (+${base})` };
}

function sigRobots(p: GeoParams, base: number): Signal {
  if (!p.robotsAllowsAiCrawlers) return { delta: 0, label: "" };
  return { delta: base, label: `AI-краулеры разрешены в robots.txt (+${base})` };
}

function sigSitemap(p: GeoParams, base: number): Signal {
  if (!p.sitemapExists) return { delta: 0, label: "" };
  return { delta: base, label: `sitemap.xml найден (+${base})` };
}

function sigSpeed(p: GeoParams, fastBase: number, slowPenalty: number): Signal {
  if (p.loadTimeMs <= 1500) return { delta: fastBase, label: `Быстрая загрузка ${p.loadTimeMs}ms (+${fastBase})` };
  if (p.loadTimeMs <= 3000) return { delta: Math.round(fastBase * 0.4), label: `Загрузка ${p.loadTimeMs}ms (+${Math.round(fastBase * 0.4)})` };
  if (p.loadTimeMs <= 5000) return { delta: -Math.round(slowPenalty * 0.4), label: `Медленная загрузка ${p.loadTimeMs}ms (-${Math.round(slowPenalty * 0.4)})` };
  return { delta: -slowPenalty, label: `Очень медленная загрузка ${p.loadTimeMs}ms (-${slowPenalty})` };
}

function sigLists(p: GeoParams, base: number): Signal {
  if (!p.hasLists) return { delta: 0, label: "" };
  return { delta: base, label: `Списки ul/ol (+${base})` };
}

function sigTables(p: GeoParams, base: number): Signal {
  if (!p.hasTables) return { delta: 0, label: "" };
  return { delta: base, label: `Таблицы (+${base})` };
}

function sigAuthor(p: GeoParams, base: number): Signal {
  if (!p.hasAuthorMeta) return { delta: 0, label: "" };
  return { delta: base, label: `Автор указан (+${base})` };
}

function sigContact(p: GeoParams, base: number): Signal {
  if (!p.hasContactPage) return { delta: 0, label: "" };
  return { delta: base, label: `Страница контактов (+${base})` };
}

function sigReviews(p: GeoParams, base: number): Signal {
  if (!p.hasReviews) return { delta: 0, label: "" };
  return { delta: base, label: `Отзывы на странице (+${base})` };
}

function sigPageAge(p: GeoParams, base: number): Signal {
  if (p.pageAge === null) return { delta: 0, label: "" };
  if (p.pageAge >= 365) return { delta: base, label: `Домен старше года (+${base})` };
  if (p.pageAge >= 180) {
    const d = Math.round(base * 0.6);
    return { delta: d, label: `Домен 6+ мес (+${d})` };
  }
  if (p.pageAge >= 30) {
    const d = Math.round(base * 0.3);
    return { delta: d, label: `Домен 1+ мес (+${d})` };
  }
  return { delta: 0, label: `Домен моложе месяца (+0)` };
}

// Combine signals → score + reason string
function buildScore(
  base: number,
  signals: Signal[]
): { score: number; reasonParts: string[] } {
  let score = base;
  const reasonParts: string[] = [];
  for (const s of signals) {
    if (s.delta !== 0) {
      score += s.delta;
      if (s.label) reasonParts.push(s.label);
    }
  }
  return { score: clamp(score), reasonParts };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-engine calculators
// ─────────────────────────────────────────────────────────────────────────────

function calcChatGPT(p: GeoParams): GeoSystemScore {
  // ChatGPT / OpenAI: E-E-A-T, Schema.org, structured content, llms.txt
  // BASE + all signals = ~100 for a perfect site; bare site lands ~20-28
  const BASE = 20;

  const signals: Signal[] = [
    sigLlmsTxt(p, 12),
    sigJsonLd(p, 6),
    sigSchemaOrg(p, 9),
    sigFaq(p, 7),
    sigWordCount(p, 7),
    sigH1(p, 4),
    sigAuthor(p, 6),
    sigContact(p, 4),
    sigRobots(p, 5),
    sigSitemap(p, 3),
    sigLists(p, 3),
    sigTables(p, 2),
    sigReviews(p, 4),
    sigPageAge(p, 4),
    sigSpeed(p, 3, 5),
  ];

  // E-E-A-T bonus: author + contact + reviews together
  const eeatBonus =
    (p.hasAuthorMeta ? 1 : 0) + (p.hasContactPage ? 1 : 0) + (p.hasReviews ? 1 : 0);
  if (eeatBonus === 3) signals.push({ delta: 5, label: "Полный E-E-A-T сигнал (+5)" });

  // Organization schema bonus
  if (hasSchema(p.schemaTypes, "Organization", "LocalBusiness")) {
    signals.push({ delta: 4, label: "Organization/LocalBusiness schema (+4)" });
  }

  const { score, reasonParts } = buildScore(BASE, signals);

  const suggestions: string[] = [];
  if (!p.hasLlmsTxt) suggestions.push("Создайте /llms.txt с описанием сайта и ключевых страниц");
  if (!p.hasJsonLd) suggestions.push("Добавьте JSON-LD разметку Schema.org");
  if (!p.hasAuthorMeta) suggestions.push("Укажите автора контента (meta author или Person schema)");
  if (!p.hasFaq) suggestions.push("Добавьте FAQ-раздел с FAQPage schema");
  if (!p.robotsAllowsAiCrawlers) suggestions.push("Разрешите GPTBot и OAI-SearchBot в robots.txt");
  if (p.wordCount < 800) suggestions.push(`Увеличьте объём контента до 800+ слов (сейчас ${p.wordCount})`);
  if (!p.hasContactPage) suggestions.push("Добавьте страницу контактов");
  if (!hasSchema(p.schemaTypes, "Organization")) suggestions.push("Добавьте Organization schema с логотипом и контактами");

  return {
    id: "chatgpt",
    name: "ChatGPT",
    score,
    verdict: verdictLabel(score),
    reason: reasonParts.join(", ") || "Базовый балл без значимых сигналов",
    suggestions,
  };
}

function calcPerplexity(p: GeoParams): GeoSystemScore {
  // Perplexity: цитируемость, источники, llms.txt, структура, свежесть
  const BASE = 18;

  const signals: Signal[] = [
    sigLlmsTxt(p, 13),      // Perplexity активно читает llms.txt
    sigRobots(p, 7),         // PerplexityBot должен быть разрешён
    sigWordCount(p, 6),
    sigH1(p, 3),
    sigLists(p, 5),          // цитируемые списки фактов
    sigTables(p, 4),         // структурированные данные
    sigJsonLd(p, 5),
    sigSchemaOrg(p, 6),
    sigFaq(p, 6),
    sigSitemap(p, 3),
    sigAuthor(p, 5),         // источник с автором более цитируем
    sigPageAge(p, 6),        // свежесть важна
    sigSpeed(p, 4, 5),
    sigContact(p, 2),
    sigHreflang(p, 2),
  ];

  // Article/BlogPosting schema бонус — цитируемые статьи
  if (hasSchema(p.schemaTypes, "Article", "BlogPosting", "NewsArticle")) {
    signals.push({ delta: 6, label: "Article/BlogPosting schema (+6)" });
  }

  // Penalty: нет robots разрешения — Perplexity не сможет индексировать
  if (!p.robotsAllowsAiCrawlers) {
    signals.push({ delta: -6, label: "PerplexityBot заблокирован в robots.txt (-6)" });
  }

  const { score, reasonParts } = buildScore(BASE, signals);

  const suggestions: string[] = [];
  if (!p.hasLlmsTxt) suggestions.push("Добавьте /llms.txt — Perplexity активно использует этот файл");
  if (!p.robotsAllowsAiCrawlers) suggestions.push("Разрешите PerplexityBot в robots.txt");
  if (!p.hasLists) suggestions.push("Структурируйте факты в виде списков — это повышает цитируемость");
  if (!p.hasTables) suggestions.push("Добавьте сравнительные таблицы — Perplexity часто цитирует их");
  if (!p.hasAuthorMeta) suggestions.push("Укажите автора и дату публикации для повышения авторитетности");
  if (!hasSchema(p.schemaTypes, "Article", "BlogPosting")) {
    suggestions.push("Добавьте Article или BlogPosting schema с datePublished");
  }
  if (p.wordCount < 600) suggestions.push(`Расширьте контент до 600+ слов (сейчас ${p.wordCount})`);

  return {
    id: "perplexity",
    name: "Perplexity",
    score,
    verdict: verdictLabel(score),
    reason: reasonParts.join(", ") || "Базовый балл без значимых сигналов",
    suggestions,
  };
}

function calcYandexNeiro(p: GeoParams): GeoSystemScore {
  // Яндекс Нейро: рунет-сигналы, .ru домен, ru-hreflang, FAQ, Schema
  const BASE = 16;

  const signals: Signal[] = [
    sigRuDomain(p, 11),       // сильный сигнал для Яндекса
    sigHreflang(p, 7),        // ru-hreflang особенно важен
    sigFaq(p, 10),            // Яндекс Нейро любит FAQ-структуру
    sigJsonLd(p, 6),
    sigSchemaOrg(p, 8),
    sigWordCount(p, 6),
    sigH1(p, 4),
    sigLists(p, 4),
    sigSitemap(p, 3),
    sigContact(p, 4),
    sigAuthor(p, 4),
    sigReviews(p, 5),
    sigLlmsTxt(p, 6),
    sigSpeed(p, 4, 5),
    sigPageAge(p, 5),
  ];

  // Organization или LocalBusiness на ru-домене
  if (p.isRuDomain && hasSchema(p.schemaTypes, "Organization", "LocalBusiness")) {
    signals.push({ delta: 5, label: "Organization schema на .ru домене (+5)" });
  }

  // BreadcrumbList — важен для Яндекса
  if (hasSchema(p.schemaTypes, "BreadcrumbList")) {
    signals.push({ delta: 4, label: "BreadcrumbList schema (+4)" });
  }

  // Penalty: не .ru домен для русскоязычного контента
  if (!p.isRuDomain) {
    signals.push({ delta: -5, label: "Не .ru/.рф домен (-5)" });
  }

  const { score, reasonParts } = buildScore(BASE, signals);

  const suggestions: string[] = [];
  if (!p.isRuDomain) suggestions.push("Для Яндекс Нейро предпочтительнее .ru или .рф домен");
  if (!p.hasHreflang) suggestions.push("Добавьте hreflang=\"ru\" теги");
  if (!p.hasFaq) suggestions.push("Добавьте FAQ-раздел с FAQPage schema — Яндекс Нейро часто берёт ответы оттуда");
  if (!p.hasJsonLd) suggestions.push("Добавьте JSON-LD Schema.org разметку");
  if (!p.hasReviews) suggestions.push("Добавьте отзывы с Review schema — важно для Яндекс Нейро");
  if (!hasSchema(p.schemaTypes, "BreadcrumbList")) {
    suggestions.push("Добавьте BreadcrumbList schema для лучшей навигационной структуры");
  }
  if (p.loadTimeMs > 3000) suggestions.push(`Ускорьте загрузку страницы (сейчас ${p.loadTimeMs}ms, цель <2000ms)`);

  return {
    id: "yandex_neiro",
    name: "Яндекс Нейро",
    score,
    verdict: verdictLabel(score),
    reason: reasonParts.join(", ") || "Базовый балл без значимых сигналов",
    suggestions,
  };
}

function calcGemini(p: GeoParams): GeoSystemScore {
  // Gemini (Google): Core Web Vitals, Schema.org, авторитет, OG/структура
  const BASE = 18;

  const signals: Signal[] = [
    sigSpeed(p, 8, 7),       // Gemini/Google очень ценит скорость
    sigJsonLd(p, 6),
    sigSchemaOrg(p, 9),
    sigH1(p, 4),
    sigWordCount(p, 6),
    sigFaq(p, 6),
    sigAuthor(p, 6),         // E-A-T / E-E-A-T
    sigLlmsTxt(p, 7),
    sigSitemap(p, 4),
    sigHreflang(p, 4),
    sigLists(p, 3),
    sigTables(p, 3),
    sigContact(p, 4),
    sigReviews(p, 4),
    sigPageAge(p, 5),
    sigRobots(p, 4),
  ];

  // HowTo / Step-by-step schema — Google Featured Snippets
  if (hasSchema(p.schemaTypes, "HowTo", "Step")) {
    signals.push({ delta: 5, label: "HowTo schema (+5)" });
  }

  // VideoObject schema
  if (hasSchema(p.schemaTypes, "VideoObject")) {
    signals.push({ delta: 4, label: "VideoObject schema (+4)" });
  }

  // SiteLinksSearchBox / WebSite schema
  if (hasSchema(p.schemaTypes, "WebSite", "SearchAction")) {
    signals.push({ delta: 3, label: "WebSite/SearchAction schema (+3)" });
  }

  // Критически медленная загрузка — дополнительный штраф для Gemini (только >8s)
  if (p.loadTimeMs > 8000) {
    signals.push({ delta: -6, label: `Критическая скорость ${p.loadTimeMs}ms (-6)` });
  }

  const { score, reasonParts } = buildScore(BASE, signals);

  const suggestions: string[] = [];
  if (p.loadTimeMs > 2500) suggestions.push(`Улучшите Core Web Vitals: загрузка ${p.loadTimeMs}ms (цель <1500ms)`);
  if (!p.hasJsonLd) suggestions.push("Добавьте JSON-LD разметку — Google Gemini активно использует Schema.org");
  if (!p.hasAuthorMeta) suggestions.push("Укажите автора для соответствия E-E-A-T критериям Google");
  if (!hasSchema(p.schemaTypes, "HowTo")) suggestions.push("Рассмотрите HowTo schema для инструкционного контента");
  if (!p.hasFaq) suggestions.push("Добавьте FAQPage schema для появления в Featured Snippets");
  if (!p.sitemapExists) suggestions.push("Создайте и зарегистрируйте sitemap.xml в Google Search Console");
  if (!hasSchema(p.schemaTypes, "WebSite")) suggestions.push("Добавьте WebSite schema с SearchAction");

  return {
    id: "gemini",
    name: "Gemini",
    score,
    verdict: verdictLabel(score),
    reason: reasonParts.join(", ") || "Базовый балл без значимых сигналов",
    suggestions,
  };
}

function calcGigaChat(p: GeoParams): GeoSystemScore {
  // GigaChat (Сбер): российские домены, русский контент, E-E-A-T, llms.txt
  const BASE = 17;

  const signals: Signal[] = [
    sigRuDomain(p, 12),       // GigaChat фокусируется на рунете
    sigLlmsTxt(p, 10),
    sigJsonLd(p, 5),
    sigSchemaOrg(p, 7),
    sigFaq(p, 7),
    sigWordCount(p, 5),
    sigH1(p, 4),
    sigAuthor(p, 6),
    sigContact(p, 5),
    sigReviews(p, 6),
    sigLists(p, 4),
    sigSitemap(p, 3),
    sigRobots(p, 4),
    sigSpeed(p, 3, 4),
    sigPageAge(p, 4),
    sigHreflang(p, 5),
  ];

  // Pricing / коммерческий контент — GigaChat используется в бизнес-контексте
  if (p.hasPricingBlock) {
    signals.push({ delta: 5, label: "Блок цен (коммерческий сигнал) (+5)" });
  }

  // Для не-.ru доменов — штраф
  if (!p.isRuDomain) {
    signals.push({ delta: -7, label: "Не российский домен (-7)" });
  }

  const { score, reasonParts } = buildScore(BASE, signals);

  const suggestions: string[] = [];
  if (!p.isRuDomain) suggestions.push("Для GigaChat критичен российский домен (.ru/.рф)");
  if (!p.hasLlmsTxt) suggestions.push("Создайте /llms.txt — GigaChat обрабатывает этот файл при индексации");
  if (!p.hasAuthorMeta) suggestions.push("Добавьте информацию об авторе или организации");
  if (!p.hasContactPage) suggestions.push("Добавьте страницу контактов с реквизитами организации");
  if (!p.hasReviews) suggestions.push("Разместите верифицированные отзывы клиентов");
  if (!p.hasFaq) suggestions.push("Структурируйте частые вопросы в виде FAQ с Schema.org разметкой");
  if (!p.hasPricingBlock && p.hasPricingBlock !== undefined) {
    suggestions.push("Для коммерческих страниц добавьте блок с ценами");
  }

  return {
    id: "gigachat",
    name: "GigaChat",
    score,
    verdict: verdictLabel(score),
    reason: reasonParts.join(", ") || "Базовый балл без значимых сигналов",
    suggestions,
  };
}

function calcAlisa(p: GeoParams): GeoSystemScore {
  // Яндекс Алиса: FAQ, списки, голосовые паттерны, быстрая загрузка, краткость
  const BASE = 17;

  const signals: Signal[] = [
    sigFaq(p, 12),            // Алиса берёт ответы из FAQ-структур
    sigLists(p, 8),           // списки = готовые ответы для голоса
    sigH1(p, 5),              // чёткий заголовок = понятный топик
    sigSpeed(p, 8, 8),        // критично для голосового ответа
    sigRuDomain(p, 9),
    sigJsonLd(p, 4),
    sigSchemaOrg(p, 6),
    sigWordCount(p, 4),       // не так важен объём — важна структура
    sigContact(p, 3),
    sigSitemap(p, 3),
    sigLlmsTxt(p, 5),
    sigHreflang(p, 3),
    sigTables(p, 3),
    sigPageAge(p, 4),
  ];

  // HowTo = пошаговые инструкции — идеально для голоса
  if (hasSchema(p.schemaTypes, "HowTo")) {
    signals.push({ delta: 7, label: "HowTo schema (голосовые инструкции) (+7)" });
  }

  // Критически медленная загрузка = Алиса не будет использовать источник (только >8s)
  if (p.loadTimeMs > 8000) {
    signals.push({ delta: -8, label: `Критически медленная загрузка ${p.loadTimeMs}ms (-8)` });
  }

  // Слишком длинный контент без структуры — штраф для голосовых
  if (p.wordCount > 2000 && !p.hasLists && !p.hasFaq) {
    signals.push({ delta: -5, label: "Длинный неструктурированный текст (-5)" });
  }

  const { score, reasonParts } = buildScore(BASE, signals);

  const suggestions: string[] = [];
  if (!p.hasFaq) suggestions.push("Добавьте FAQ с короткими, прямыми ответами — именно их зачитывает Алиса");
  if (!p.hasLists) suggestions.push("Используйте маркированные и нумерованные списки для структурирования информации");
  if (p.loadTimeMs > 2000) suggestions.push(`Ускорьте загрузку до <2000ms (сейчас ${p.loadTimeMs}ms) — Алиса игнорирует медленные сайты`);
  if (!p.isRuDomain) suggestions.push("Для Яндекс Алисы необходим .ru/.рф домен");
  if (!hasSchema(p.schemaTypes, "HowTo")) {
    suggestions.push("Добавьте HowTo schema для пошаговых инструкций");
  }
  if (!p.hasH1) suggestions.push("Добавьте чёткий H1 — Алиса использует его для определения темы страницы");
  if (!p.hasJsonLd) suggestions.push("Добавьте JSON-LD Schema.org разметку");

  return {
    id: "alisa",
    name: "Яндекс Алиса",
    score,
    verdict: verdictLabel(score),
    reason: reasonParts.join(", ") || "Базовый балл без значимых сигналов",
    suggestions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export function calcGeoScore(params: GeoParams): GeoResult {
  const systems: GeoSystemScore[] = [
    calcChatGPT(params),
    calcPerplexity(params),
    calcYandexNeiro(params),
    calcGemini(params),
    calcGigaChat(params),
    calcAlisa(params),
  ];

  // Apply per-engine floor so even an unoptimised site gets a baseline score
  for (const s of systems) {
    const floor = ENGINE_FLOOR[s.id] ?? 5;
    if (s.score < floor) s.score = floor;
  }

  const avg_score = clamp(
    Math.round(systems.reduce((sum, s) => sum + s.score, 0) / systems.length)
  );

  return { avg_score, systems };
}
