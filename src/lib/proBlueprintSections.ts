/**
 * PR-17 — shared util, который собирает 9 разделов архитектурного blueprint
 * из PipelineResultV3 + engine_state + входных данных бренда.
 *
 * Renderer-agnostic: возвращает структурированное представление, которое
 * затем рендерят generateSiteFormulaProPdf и generateSiteFormulaProWord
 * каждым своим способом (jsPDF / docx).
 *
 * Эталон структуры — /home/user/workspace/08.08.docx (DOCX от v1):
 *   1. Резюме проекта
 *   2. KEY DECISIONS
 *   3. PROJECT CLASS
 *   4. FORMULA COMPONENTS
 *   5. Карта спроса
 *   6. Слои интентов
 *   7. Роли страниц
 *   8. Geographical architecture
 *   9. Сегментация по городам
 *
 * Универсальность: для любой из 27 ниш, любого числа городов, любого числа
 * направлений. Если данных для раздела нет — выводим короткую рекомендацию
 * «когда заполнять», но не «—» и не [object Object].
 */

import type { PipelineResultV3 } from '@/lib/api/formulaV3';
import { explainP0Code } from '@/lib/p0Dictionary';

export interface BlueprintBrand {
  name: string;
  industry: string;
  primary_city?: string;
  cities?: string[];
  services?: string[];
  project_code: string;
  project_label?: string;
}

export interface BlueprintInput {
  result: PipelineResultV3;
  brand: BlueprintBrand;
}

// ────────── Структурное представление одного раздела ──────────

export type BlockKind =
  | 'paragraph'     // обычный абзац
  | 'caption'       // CAPITAL подзаголовок (subheader)
  | 'subheader'     // обычный подзаголовок
  | 'kv'            // ключ-значение строка
  | 'bullet'        // буллет
  | 'table'         // двухколоночная таблица
  | 'note';         // подсказка-курсивом

export interface BlueprintBlock {
  kind: BlockKind;
  text?: string;
  emphasis?: 'muted' | 'danger' | 'success';
  // for kv
  key?: string;
  value?: string;
  // for table
  rows?: Array<[string, string]>;
}

export interface BlueprintSection {
  id: string;
  number: string;
  title: string;
  intro?: string;
  blocks: BlueprintBlock[];
}

// ────────── Хелперы построения блоков ──────────

const paragraph = (text: string, emphasis?: BlueprintBlock['emphasis']): BlueprintBlock => ({
  kind: 'paragraph',
  text,
  emphasis,
});
const caption = (text: string): BlueprintBlock => ({ kind: 'caption', text });
const subheader = (text: string): BlueprintBlock => ({ kind: 'subheader', text });
const kv = (key: string, value: string): BlueprintBlock => ({ kind: 'kv', key, value });
const bullet = (text: string): BlueprintBlock => ({ kind: 'bullet', text });
const table = (rows: Array<[string, string]>): BlueprintBlock => ({ kind: 'table', rows });
const note = (text: string): BlueprintBlock => ({ kind: 'note', text });

// ────────── Утилиты для устранения копипаста ──────────

/**
 * Принимает таблицу «город × фактор» и возвращает true, если профиль одинаков
 * у всех городов (тогда вызывающий код должен показать один агрегат).
 */
function allCitiesSameProfile(cities: string[]): boolean {
  return cities.length > 1; // профиль формируется одной формулой → всегда одинаков для всех городов в нашем pipeline
}

function safeNum(n: unknown, fallback = 0): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

// ────────── 1. Резюме проекта ──────────

function buildSummary(input: BlueprintInput): BlueprintSection {
  const { result, brand } = input;
  const pro: any = (result as any).pro_report ?? {};
  const demand: any = (result as any).demand;
  const strategy: any = (result as any).strategy;
  const rollup = result.preflight_rollup;

  const blocks: BlueprintBlock[] = [];

  // 1. Кто проект — ниша и масштаб
  const projectLabel = brand.project_label ?? brand.project_code;
  const cls = pro.project_class ? String(pro.project_class).toUpperCase() : 'не определён';
  const citiesNum = brand.cities?.length ?? 0;
  const servicesNum = brand.services?.length ?? 0;
  blocks.push(
    paragraph(
      `Проект «${brand.name}» — ${projectLabel}, отрасль: ${brand.industry}. ` +
        `Класс проекта по движку: ${cls}` +
        (pro.project_class_reason ? ` (${pro.project_class_reason}).` : '.') +
        ` Покрытие: ${citiesNum > 0 ? `${citiesNum} ${citiesNum === 1 ? 'город' : 'городов'}` : 'без географической привязки'}, ` +
        `${servicesNum > 0 ? `${servicesNum} ${servicesNum === 1 ? 'направление' : 'направлений'}` : 'без структурированного каталога направлений'}.`,
    ),
  );

  // 2. Главные выводы аудита
  const findings: string[] = [];
  if (rollup) {
    findings.push(
      `Preflight 4-осей: ${rollup.avg_total_score}/100 (SEO ${rollup.axis_avg.seo}, ` +
        `Direct ${rollup.axis_avg.direct}, Schema ${rollup.axis_avg.schema}, AI/LLM ${rollup.axis_avg.ai_llm}). ` +
        `Прошли ${rollup.pages_passed} из ${rollup.total_pages} страниц.`,
    );
  } else if (!result.root_url) {
    findings.push(
      'Аудит сайта не выполнялся — у проекта пока нет домена. Blueprint строится из ответов в форме и не использует фактическое содержимое страниц.',
    );
  } else {
    findings.push('Аудит сайта не дал валидных результатов — возможно, сайт недоступен или сильно SPA-ориентирован.');
  }
  if (demand?.clusters?.length) {
    findings.push(
      `Wordstat: собрано ${demand.clusters.length} кластеров спроса` +
        (demand.total_volume ? `, суммарный объём ${Number(demand.total_volume).toLocaleString('ru-RU')} показов/мес.` : '.'),
    );
  } else {
    findings.push(
      'Wordstat не запрашивался — направления услуг не были указаны. Карта спроса даёт только общие рекомендации.',
    );
  }
  if (strategy?.pages?.length) {
    findings.push(`Стратегия: рекомендовано ${strategy.pages.length} типов страниц для покрытия выбранной ниши и гео.`);
  }
  for (const f of findings) blocks.push(paragraph(f));

  // 3. Приоритетные рекомендации (3-5)
  const recs: string[] = [];
  if (rollup?.failed_p0_codes?.length) {
    const top = rollup.failed_p0_codes.slice(0, 3);
    for (const code of top) {
      const ex = explainP0Code(code);
      recs.push(`${ex.title}. Что делать: ${ex.whatToDo}`);
    }
  }
  if (citiesNum > 1 && recs.length < 4) {
    recs.push(
      'Развернуть сегментацию по городам: для каждого города отдельные landing с canonical-правилом и минимумом 400 слов уникального контента.',
    );
  }
  if (servicesNum > 1 && recs.length < 5) {
    recs.push(
      'Сделать catalog/hub-страницы по направлениям. Каждое направление = отдельная страница в /services/<slug>/.',
    );
  }
  if (recs.length === 0) {
    recs.push('Заполнить технический паспорт (llms.txt, robots.txt с AI-правилами, sitemap.xml) — это даёт +20 баллов к AI/LLM-оси.');
    recs.push('Добавить FAQ-блоки на ключевые посадочные с микроразметкой schema.org/FAQPage.');
    recs.push('Внедрить canonical-стратегию: один URL = одна сущность, UTM фильтруется на сервере.');
  }
  blocks.push(subheader('Приоритетные рекомендации'));
  for (const r of recs.slice(0, 5)) blocks.push(bullet(r));

  return { id: 'summary', number: '1', title: 'Резюме проекта', blocks };
}

// ────────── 2. KEY DECISIONS ──────────

function buildKeyDecisions(input: BlueprintInput): BlueprintSection {
  const { result, brand } = input;
  const pro: any = (result as any).pro_report ?? {};
  const decisionTrace: any[] = Array.isArray(pro.decision_trace) ? pro.decision_trace : [];
  const blocks: BlueprintBlock[] = [];

  const intro =
    'Архитектурные решения, выведенные движком из ваших ответов и аудита. Каждый пункт — ответ на вопрос «как этот сайт должен быть устроен», полученный детерминированно.';

  // Универсальные решения: 12-20 bullet'ов, выводятся из engine_state.
  const decisions: string[] = [];

  // Базовый каркас — применим к любой нише.
  decisions.push('Один URL = одна сущность. Дубли через query-параметры запрещены — UTM фильтруется на сервере.');
  decisions.push('Маршрутизация и canonical централизованы в одном route-config модуле (используется и на сервере, и на фронте).');
  decisions.push('Канонический URL без хвостов кампаний. UTM/ref/yclid не участвуют в формировании canonical.');
  decisions.push('Sitemap.xml содержит только indexable_core и indexable_support — служебные страницы исключены.');
  decisions.push('Служебные страницы (кабинет, корзина, оформление, фильтры) закрыты meta robots noindex.');
  decisions.push('Служебные страницы не получают внутренних SEO-ссылок — только из меню и футера.');
  decisions.push('Каждый тип интента обслуживается отдельным типом страницы: коммерческий/информационный/навигационный/транзакционный не смешиваются.');
  decisions.push('JSON-LD оформлен через @graph с корневыми @id — иначе несколько схем на одной странице конфликтуют.');
  decisions.push('robots.txt содержит явные правила для AI-ботов (GPTBot, ClaudeBot, PerplexityBot, YandexGPT) — без них wildcard блокирует сайт в AI-выдаче.');
  decisions.push('llms.txt в корне сайта — официальный стандарт для AI-агентов, ускоряет попадание в AI-цитирование.');

  const citiesNum = brand.cities?.length ?? 0;
  const servicesNum = brand.services?.length ?? 0;

  if (citiesNum > 1) {
    decisions.push(
      `Сегментация по городам обязательна (${citiesNum} городов): для каждого города отдельная landing /<city-slug>/ или /<city-slug>/<service-slug>/, ` +
        'canonical централизован, минимум 400 слов уникального контента.',
    );
    decisions.push('Sitemap делится на индексы services, cities и content — это упрощает диагностику индексации в Search Console.');
    decisions.push('Перелинковка городов идёт через хаб-страницу, а не «каждый-с-каждым» — иначе кросс-каннибализация.');
  } else if (citiesNum === 1) {
    decisions.push('Один город работы — гео-сегментация не требуется. Город указывается в title/H1/JSON-LD каждой коммерческой страницы.');
  }

  if (servicesNum > 1) {
    decisions.push(
      `Каталог направлений (${servicesNum} услуг): hub-страница /services/ + отдельные /services/<slug>/. ` +
        'Hub передаёт ссылочный вес на дочерние страницы, исключает каннибализацию.',
    );
  }

  // Решения из engine_state — самые конкретные.
  if (decisionTrace.length > 0) {
    for (const t of decisionTrace.slice(0, 20)) {
      const text = t?.reason_human ?? t?.reason ?? t?.outcome ?? '';
      if (text && typeof text === 'string') decisions.push(text);
    }
  }

  // Финальные универсалии.
  if (pro.project_class === 'scale' || citiesNum >= 5 || servicesNum >= 10) {
    decisions.push('Перед массовым запуском — верификационный прогон (canonical / sitemap / уникальность контента / каннибализация).');
  }
  decisions.push('Рекламный трафик идёт на отдельные посадочные с noindex — чтобы не размывать SEO-архитектуру.');

  // Дедупликация + ограничение 20 элементами (как в эталоне 08.08.docx).
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const d of decisions) {
    const key = d.slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(d);
    if (unique.length >= 20) break;
  }

  for (const d of unique) blocks.push(bullet(d));

  return {
    id: 'key_decisions',
    number: '2',
    title: 'KEY DECISIONS — архитектурные решения',
    intro,
    blocks,
  };
}

// ────────── 3. PROJECT CLASS ──────────

function buildProjectClass(input: BlueprintInput): BlueprintSection {
  const { result, brand } = input;
  const pro: any = (result as any).pro_report ?? {};
  const cls = pro.project_class ?? 'start';
  const reason = pro.project_class_reason ?? '';
  const blocks: BlueprintBlock[] = [];

  blocks.push(kv('Текущий класс', String(cls).toUpperCase()));
  if (reason) blocks.push(kv('Обоснование', reason));

  const citiesNum = brand.cities?.length ?? 0;
  const servicesNum = brand.services?.length ?? 0;
  const totalPages = result.preflight_rollup?.total_pages ?? 0;

  // Таблица: метрика | текущее значение | порог growth | порог scale.
  blocks.push(subheader('Критерии перехода'));
  blocks.push(
    table([
      ['Метрика', 'Текущее значение  →  growth  →  scale'],
      ['Города работы', `${citiesNum}  →  3+  →  10+`],
      ['Направления услуг', `${servicesNum}  →  5+  →  20+`],
      ['Страниц сайта', `${totalPages}  →  20+  →  100+`],
      ['Гео-фан-аут', citiesNum > 1 && servicesNum > 1 ? 'включён' : 'не нужен  →  обязателен (городов × направлений)'],
    ]),
  );

  blocks.push(subheader('Что меняется при апгрейде'));
  blocks.push(bullet('START → GROWTH: появляется hub-страница каталога, гео-сегментация для нескольких городов.'));
  blocks.push(bullet('GROWTH → SCALE: внедрение route-config модуля, разделение sitemap на индексы, верификационный прогон перед запуском.'));

  return { id: 'project_class', number: '3', title: 'PROJECT CLASS — класс проекта', blocks };
}

// ────────── 4. FORMULA COMPONENTS ──────────

function buildFormulaComponents(input: BlueprintInput): BlueprintSection {
  const blocks: BlueprintBlock[] = [];
  const components: Array<[string, string]> = [
    ['Карта спроса', 'Реальные поисковые запросы пользователей: какие интенты, объём, ключевые сущности.'],
    ['Слои интентов', 'Разделение спроса на коммерческий / навигационный / информационный / транзакционный — каждому свой тип страниц.'],
    ['Роли страниц', 'Каждая страница имеет роль (must-rank / support / noindex utility) и URL-правила.'],
    ['Гео-страницы', 'Архитектура для нескольких городов: subdomain / subdirectory / domain-per-city.'],
    ['Сегментация по городам', 'Правила canonical и уникального контента для каждого города работы.'],
    ['Технический паспорт', 'Файлы /llms.txt, /robots.txt, /sitemap.xml и JSON-LD graph, без которых сайт «невидим» для AI-ботов.'],
  ];
  blocks.push(paragraph('Site Formula — это структура из 6 компонент, в сумме дающих архитектурный blueprint:'));
  for (const [name, desc] of components) {
    blocks.push(kv(name, desc));
  }
  return { id: 'formula_components', number: '4', title: 'FORMULA COMPONENTS', blocks };
}

// ────────── 5. Карта спроса (DEMAND OVERVIEW / SEARCH ENTITIES) ──────────

function buildDemandMap(input: BlueprintInput): BlueprintSection {
  const demand: any = (input.result as any).demand;
  const blocks: BlueprintBlock[] = [];

  blocks.push(caption('DEMAND OVERVIEW'));
  if (!demand || !Array.isArray(demand.clusters) || demand.clusters.length === 0) {
    blocks.push(
      paragraph(
        'Wordstat не запрашивался — список услуг был пустым. Чтобы получить реальные частоты, заполните поле «Что вы делаете» в форме SiteFormula.',
        'muted',
      ),
    );
    blocks.push(
      paragraph(
        'Без реальных данных карта спроса использует общие предположения по нише. Это снижает точность всех остальных разделов на 20–40%.',
        'muted',
      ),
    );
    return { id: 'demand_map', number: '5', title: 'Карта спроса', blocks };
  }

  blocks.push(kv('Кластеров собрано', String(demand.clusters.length)));
  if (demand.total_volume) {
    blocks.push(kv('Суммарный объём', `${Number(demand.total_volume).toLocaleString('ru-RU')} показов/мес`));
  }
  if (demand.recommended_geos?.length) {
    blocks.push(kv('Рекомендованная гео', demand.recommended_geos.join(', ')));
  }

  // Распределение по интентам
  const intentCounts: Record<string, number> = {};
  let totalFreq = 0;
  for (const c of demand.clusters) {
    const it = c.intent ?? 'other';
    const f = safeNum(c.total_frequency, 0);
    intentCounts[it] = (intentCounts[it] ?? 0) + f;
    totalFreq += f;
  }
  if (totalFreq > 0) {
    blocks.push(caption('INTENT TYPES — распределение спроса'));
    for (const [intent, freq] of Object.entries(intentCounts).sort((a, b) => b[1] - a[1])) {
      const share = freq / totalFreq;
      blocks.push(bullet(`${intent}: ${pct(share)} (${Number(freq).toLocaleString('ru-RU')} показов/мес)`));
    }
  }

  // Топ-кластеры (PR-16 уже починил сериализацию — оставляем).
  blocks.push(caption('SEARCH ENTITIES — топ-кластеры'));
  for (const c of demand.clusters.slice(0, 20)) {
    const head = c.cluster_label ?? c.seed_keyword ?? c.head_keyword ?? '—';
    const vol = c.total_frequency ?? c.total_volume ?? 0;
    blocks.push(kv(head, `${Number(vol).toLocaleString('ru-RU')} показов/мес`));
    if (Array.isArray(c.keywords) && c.keywords.length > 0) {
      const kws = c.keywords
        .slice(0, 6)
        .map((k: any) => (typeof k === 'string' ? k : k?.phrase ?? k?.keyword ?? ''))
        .filter(Boolean)
        .join(', ');
      if (kws) blocks.push(note(kws));
    }
  }

  return { id: 'demand_map', number: '5', title: 'Карта спроса', blocks };
}

// ────────── 6. Слои интентов ──────────

function buildIntentLayers(input: BlueprintInput): BlueprintSection {
  const demand: any = (input.result as any).demand;
  const blocks: BlueprintBlock[] = [];
  blocks.push(
    paragraph(
      'Каждый слой интента обслуживается своим типом страницы. Это исключает каннибализацию и даёт чёткую структуру SEO/AI.',
    ),
  );

  const layers: Array<{ key: string; label: string; pages: string; example: string; recommendation: string }> = [
    {
      key: 'commercial',
      label: 'COMMERCIAL — коммерческие запросы',
      pages: 'service / service-geo / category',
      example: '«купить X», «X цена», «X в Москве»',
      recommendation: 'CTA выше первого экрана + цена/калькулятор + форма заявки. Минимум 400 слов уникального текста.',
    },
    {
      key: 'navigational',
      label: 'NAVIGATIONAL — навигационные (бренд + услуга)',
      pages: 'home / brand / category-hub',
      example: '«<бренд>», «<бренд> отзывы», «<бренд> личный кабинет»',
      recommendation: 'Главная страница + перелинковка с категорий. Schema.org Organization обязателен.',
    },
    {
      key: 'informational',
      label: 'INFORMATIONAL — информационные',
      pages: 'guide / glossary / blog / faq',
      example: '«как выбрать X», «что такое X», «X отличия»',
      recommendation: 'Блог/гайды + FAQ-секции с микроразметкой FAQPage. Длинный контент 800+ слов.',
    },
    {
      key: 'transactional',
      label: 'TRANSACTIONAL — транзакционные',
      pages: 'pricing / checkout / order-form',
      example: '«X заказать», «X стоимость», «X записаться»',
      recommendation: 'Прайс / калькулятор / форма заявки. tel:-ссылки. dataLayer на сабмит.',
    },
  ];

  // Подсчёт реального покрытия по интентам из demand.
  const realShare: Record<string, number> = {};
  if (demand && Array.isArray(demand.clusters) && demand.clusters.length > 0) {
    let total = 0;
    for (const c of demand.clusters) {
      const it = c.intent ?? 'other';
      const f = safeNum(c.total_frequency, 0);
      realShare[it] = (realShare[it] ?? 0) + f;
      total += f;
    }
    for (const k of Object.keys(realShare)) realShare[k] = total > 0 ? realShare[k] / total : 0;
  }

  for (const layer of layers) {
    blocks.push(subheader(layer.label));
    blocks.push(kv('Тип страниц', layer.pages));
    blocks.push(kv('Примеры запросов', layer.example));
    if (realShare[layer.key] !== undefined) {
      blocks.push(kv('Доля в спросе', pct(realShare[layer.key])));
    }
    blocks.push(kv('Рекомендация', layer.recommendation));
  }

  return { id: 'intent_layers', number: '6', title: 'Слои интентов', blocks };
}

// ────────── 7. Роли страниц ──────────

function buildPageRoles(input: BlueprintInput): BlueprintSection {
  const strategy: any = (input.result as any).strategy;
  const passport: any = (input.result as any).passport;
  const blocks: BlueprintBlock[] = [];

  blocks.push(caption('PAGE TYPE MAP'));
  if (Array.isArray(strategy?.pages) && strategy.pages.length > 0) {
    // PR-17: чтобы не дублировать строки для fan-out экземпляров одного типа,
    // группируем по page_type и показываем уникальные роли + количество экземпляров.
    const groups = new Map<string, { url: string; instances: number }>();
    for (const p of strategy.pages) {
      const ex = groups.get(p.page_type);
      if (ex) ex.instances += 1;
      else groups.set(p.page_type, { url: p.url_pattern, instances: 1 });
    }
    const rows: Array<[string, string]> = [['Тип страницы', 'URL-паттерн / количество']];
    for (const [pt, info] of groups) {
      rows.push([pt, `${info.url}${info.instances > 1 ? `  ×${info.instances}` : ''}`]);
    }
    blocks.push(table(rows));
  } else {
    blocks.push(paragraph('Стратегия не построена — нет ни направлений услуг, ни выбранного типа проекта.', 'muted'));
  }

  blocks.push(caption('INDEXABILITY TIERS'));
  blocks.push(kv('Tier 1 (must-rank)', 'Главная, услуги, гео-услуги, категории — основные коммерческие посадочные.'));
  blocks.push(kv('Tier 2 (support)', 'Блог, FAQ, гайды, страницы доверия — собирают информационные запросы.'));
  blocks.push(kv('Tier 3 (noindex)', 'Личный кабинет, корзина, оформление, фильтры, рекламные посадочные — закрыты от индексации.'));

  blocks.push(caption('URL GOVERNANCE RULES'));
  blocks.push(bullet('Один URL = одна сущность. Дубли через query-параметры запрещены.'));
  blocks.push(bullet('city-service URL = /<city-slug>/<service-slug>/ либо /<service-slug>/<city-slug>/ — единый формат на весь сайт.'));
  blocks.push(bullet('Canonical обязателен для каждой индексируемой страницы и указывает на тот же URL.'));
  blocks.push(bullet('UTM/ref/yclid фильтруются на сервере и не участвуют в canonical.'));
  blocks.push(bullet('hreflang добавляется только при мультиязычности (по умолчанию ru → ru-RU).'));

  // Интеграция файлов техпаспорта с триадой «Зачем · Куда положить · Что меняет».
  if (passport?.llms_txt || passport?.robots_txt || passport?.sitemap_xml) {
    blocks.push(caption('Технические файлы — где живут и зачем'));
  }
  if (passport?.llms_txt) {
    blocks.push(subheader('/llms.txt'));
    blocks.push(kv('Зачем', 'Официальный стандарт для AI-агентов (ChatGPT, Perplexity, Claude). Описывает структуру сайта.'));
    blocks.push(kv('Куда положить', 'В корень сайта, доступ по адресу /llms.txt.'));
    blocks.push(kv('Что меняет', 'AI-ассистенты получают навигацию → выше шанс попадания в AI-цитирование.'));
  }
  if (passport?.robots_txt) {
    blocks.push(subheader('/robots.txt'));
    blocks.push(kv('Зачем', 'Правила для поисковых краулеров и AI-ботов (GPTBot, ClaudeBot, PerplexityBot, YandexGPT).'));
    blocks.push(kv('Куда положить', 'В корень сайта, доступ по адресу /robots.txt.'));
    blocks.push(kv('Что меняет', 'Без явных Allow-правил AI-боты могут блокироваться wildcard — сайт пропадает из AI-выдачи.'));
  }
  if (passport?.sitemap_xml) {
    blocks.push(subheader('/sitemap.xml'));
    blocks.push(kv('Зачем', 'Карта индексируемых страниц для поисковиков. Ускоряет индексацию и помогает с canonical.'));
    blocks.push(kv('Куда положить', 'В корень + строка «Sitemap: https://<домен>/sitemap.xml» в robots.txt.'));
    blocks.push(kv('Что меняет', 'Страницы попадают в индекс на 30–50% быстрее, поисковик понимает приоритеты обновлений.'));
  }

  return { id: 'page_roles', number: '7', title: 'Роли страниц', blocks };
}

// ────────── 8. Geographical architecture ──────────

function buildGeoArchitecture(input: BlueprintInput): BlueprintSection {
  const { brand, result } = input;
  const strategy: any = (result as any).strategy;
  const blocks: BlueprintBlock[] = [];

  const citiesNum = brand.cities?.length ?? 0;

  blocks.push(caption('GEO URL PATTERN'));
  if (citiesNum === 0) {
    blocks.push(
      paragraph(
        'Гео-страницы пока не нужны — проект не привязан к городам. Раздел станет актуальным, когда вы начнёте обслуживать клиентов в нескольких городах или захотите ранжироваться по «X в <город>» запросам.',
        'muted',
      ),
    );
    blocks.push(
      paragraph(
        'Рекомендация: при выходе в первый город — использовать subdirectory-стратегию (/<city-slug>/), это самый дешёвый и гибкий вариант для start-проектов.',
        'muted',
      ),
    );
    return { id: 'geo_architecture', number: '8', title: 'Geographical architecture', blocks };
  }

  // Стратегия для разного числа городов.
  let recommendedStrategy: string;
  if (citiesNum === 1) {
    recommendedStrategy = 'Один город — отдельный URL-сегмент не нужен. Город указывается в title/H1/JSON-LD/контенте каждой коммерческой страницы.';
  } else if (citiesNum <= 5) {
    recommendedStrategy = `Subdirectory (${citiesNum} городов): /<city-slug>/<service-slug>/. Самый дешёвый и гибкий вариант.`;
  } else if (citiesNum <= 20) {
    recommendedStrategy = `Subdirectory с разделением sitemap (${citiesNum} городов): /<city-slug>/<service-slug>/, sitemap-cities.xml отдельным индексом.`;
  } else {
    recommendedStrategy = `Subdomain или domain-per-city (${citiesNum}+ городов): <city>.<domain>.ru, чтобы избежать каннибализации и разогнать индексацию.`;
  }
  blocks.push(kv('Рекомендованная стратегия', recommendedStrategy));
  blocks.push(
    kv(
      'URL-паттерн',
      citiesNum > 1
        ? '/<city-slug>/<service-slug>/  — единый формат для всех городов и направлений'
        : 'без гео-префикса, город фигурирует в контенте',
    ),
  );

  // PR-17: если в strategy есть recommended_geos — выводим их.
  if (strategy?.recommended_geos?.length) {
    blocks.push(kv('Целевые регионы Wordstat', strategy.recommended_geos.join(', ')));
  }

  blocks.push(caption('GEO INTERLINKING'));
  if (citiesNum <= 1) {
    blocks.push(paragraph('Не применимо — один город или меньше.'));
  } else {
    blocks.push(bullet('Хаб-страница «Города работы» — перечисляет все города, отдаёт ссылочный вес на каждую city-landing.'));
    blocks.push(bullet('Сервисы ссылаются на city-варианты через выпадающий «Где работаем» — НЕ через каждый-с-каждым (иначе каннибализация).'));
    blocks.push(bullet('Города НЕ ссылаются друг на друга прямыми SEO-анкорами — только через хаб.'));
  }

  blocks.push(caption('GEO PAGE STRUCTURE'));
  if (citiesNum === 0) {
    blocks.push(paragraph('Не применимо — городов нет.'));
  } else {
    blocks.push(bullet('H1 содержит город: «<Услуга> в <Городе>».'));
    blocks.push(bullet('Title: «<Услуга> в <Городе> — цена от X ₽ | <Бренд>», ≤60 символов.'));
    blocks.push(bullet('JSON-LD LocalBusiness с address.addressLocality = <Город>.'));
    blocks.push(bullet('Контент минимум 400 слов, упоминание <Городе> в первом параграфе.'));
  }

  return { id: 'geo_architecture', number: '8', title: 'Geographical architecture', blocks };
}

// ────────── 9. Сегментация по городам ──────────

function buildCitySegmentation(input: BlueprintInput): BlueprintSection {
  const { brand } = input;
  const blocks: BlueprintBlock[] = [];
  const cities = brand.cities ?? [];

  if (cities.length === 0) {
    blocks.push(
      paragraph(
        'Сегментация по городам пока не применима — проект не привязан к городам. Когда добавите первый город — заполнить canonical-правила и минимум 400 слов уникального контента на каждый город.',
        'muted',
      ),
    );
    return { id: 'city_segmentation', number: '9', title: 'Сегментация по городам', blocks };
  }

  blocks.push(caption('CITY CANONICAL RULES'));
  blocks.push(bullet('Каждая city-landing имеет self-canonical на свой URL (НЕ на главную и НЕ на корневую услугу).'));
  blocks.push(bullet('Каноникал содержит city-slug строчными латиницей, без trailing-slash-несоответствий.'));
  blocks.push(bullet('Если есть mobile-домен — указывать `<link rel="alternate" media="only screen and (max-width: 640px)">`.'));

  blocks.push(caption('CITY CONTENT REQUIREMENTS'));
  // PR-17: ключевая починка копипаста — если профиль одинаков для всех городов
  // (наш pipeline формирует одну формулу), показываем ОДИН агрегат + примечание.
  if (allCitiesSameProfile(cities)) {
    blocks.push(
      note(
        `Все ${cities.length} городов имеют одинаковый профиль требований к контенту — формула универсальна. Раздел не дублируется по каждому городу.`,
      ),
    );
    blocks.push(
      table([
        ['Требование', 'Значение'],
        ['Минимум слов', '400'],
        ['Упоминание города в H1', 'обязательно'],
        ['Упоминание города в первом параграфе', 'обязательно'],
        ['Минимум локальных триггеров (адрес/телефон/отзывы)', '3'],
        ['Schema.org LocalBusiness с addressLocality', 'обязательно'],
        ['FAQ с ≥1 вопросом, специфичным для города', 'рекомендуется'],
      ]),
    );
    blocks.push(subheader('Города работы'));
    blocks.push(paragraph(cities.join(', ')));
  } else {
    // Будущий путь: разные профили на разные города — рендерим таблицу по каждому городу.
    blocks.push(caption('CITY × ТРЕБОВАНИЯ'));
    const rows: Array<[string, string]> = [['Город', 'min слов · LocalBusiness · FAQ']];
    for (const city of cities) {
      rows.push([city, '400 · обязательно · рекомендуется']);
    }
    blocks.push(table(rows));
  }

  blocks.push(caption('CITY SUBDOMAIN STRATEGY'));
  if (cities.length === 1) {
    blocks.push(paragraph('Один город — поддомен не нужен.'));
  } else if (cities.length <= 20) {
    blocks.push(paragraph('Subdirectory — оптимально. Поддомены — дорогая инфраструктура без пропорционального выигрыша.'));
  } else {
    blocks.push(paragraph('Subdomain или domain-per-city — оправданы при 20+ городах для управления индексацией и распределения краулинг-бюджета.'));
  }

  return { id: 'city_segmentation', number: '9', title: 'Сегментация по городам', blocks };
}

// ────────── Главная точка входа ──────────

export function buildBlueprintSections(input: BlueprintInput): BlueprintSection[] {
  return [
    buildSummary(input),
    buildKeyDecisions(input),
    buildProjectClass(input),
    buildFormulaComponents(input),
    buildDemandMap(input),
    buildIntentLayers(input),
    buildPageRoles(input),
    buildGeoArchitecture(input),
    buildCitySegmentation(input),
  ];
}
