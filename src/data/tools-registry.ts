import { type LucideIcon, Search, Code2, FileCode, Sparkles, Shield, Bot, Swords, ScanSearch, TrendingUp, Link2, BrainCircuit, PenTool, Star, Eye, ClipboardList } from "lucide-react";
import { lazy, type ComponentType } from "react";

export type ToolStatus = "active" | "coming_soon";

export interface ToolDef {
  id: string;
  slug: string;
  name: string;
  shortDesc: string;
  category: string;
  icon: LucideIcon;
  component: React.LazyExoticComponent<ComponentType>;
  gradient: string;
  useCases: string[];
  geoEnabled: boolean;
  status: ToolStatus;
  seoTitle?: string;
  seoDescription?: string;
  seoH1?: string;
}

export const categories = [
  { id: "analysis", name: "Анализ и аудит", icon: Search },
  { id: "generation", name: "Генерация (pSEO)", icon: Sparkles },
  { id: "content", name: "Контент и LLM", icon: Bot },
  { id: "webmaster", name: "Инструменты вебмастера", icon: FileCode },
];

export const tools: ToolDef[] = [
  // ===== FLAGSHIP =====
  {
    id: "site-check", slug: "site-check",
    name: "Проверка сайта",
    shortDesc: "Технический SEO, индексация, конкуренты, ключевые запросы — один отчёт",
    category: "analysis", icon: Search,
    component: lazy(() => import("@/components/site-check/ScanForm")),
    gradient: "bg-gradient-to-br from-primary/20 to-blue-950/40",
    useCases: ["Полная проверка перед запуском", "SEO + Директ аудит", "Анализ конкурентов и ключей"],
    geoEnabled: true, status: "active",
  },
  // ===== ANALYSIS =====
  {
    id: "seo-auditor", slug: "seo-auditor",
    name: "LLM‑Friendly SEO Auditor",
    shortDesc: "Двойной аудит страницы: классический SEO‑скор + LLM‑готовность для AI Overviews",
    category: "analysis", icon: Search,
    component: lazy(() => import("@/components/tools/SEOAuditor")),
    gradient: "bg-gradient-to-br from-blue-950/40 to-indigo-950/40",
    useCases: ["Быстрый аудит перед запуском", "Проверка готовности к AI‑поиску", "Чек‑лист по SEO + LLM"],
    geoEnabled: true, status: "active",
  },
  {
    id: "competitor-analysis", slug: "competitor-analysis",
    name: "Анализ конкурентов",
    shortDesc: "Сравнение SEO-метрик двух страниц: контент, структура, разметка, скорость",
    category: "analysis", icon: Swords,
    component: lazy(() => import("@/components/tools/CompetitorAnalysis")),
    gradient: "bg-gradient-to-br from-orange-950/40 to-red-950/40",
    useCases: ["Сравнение с конкурентом", "Поиск слабых мест", "Анализ контент-стратегии"],
    geoEnabled: true, status: "active",
  },
  {
    id: "indexation-checker", slug: "indexation-checker",
    name: "Проверка индексации",
    shortDesc: "Проверка meta robots, X-Robots-Tag, canonical, статуса — доступна ли страница для поиска",
    category: "analysis", icon: ScanSearch,
    component: lazy(() => import("@/components/tools/IndexationChecker")),
    gradient: "bg-gradient-to-br from-cyan-950/40 to-blue-950/40",
    useCases: ["Проверка после деплоя", "Поиск причин деиндексации", "Аудит noindex/nofollow"],
    geoEnabled: false, status: "active",
  },
  {
    id: "position-monitor", slug: "position-monitor",
    name: "Мониторинг позиций",
    shortDesc: "Ручной трекер позиций: добавляйте данные из GSC и отслеживайте динамику",
    category: "analysis", icon: TrendingUp,
    component: lazy(() => import("@/components/tools/PositionMonitor")),
    gradient: "bg-gradient-to-br from-green-950/40 to-emerald-950/40",
    useCases: ["Отслеживание ТОП-10", "История позиций по ключам", "Контроль после оптимизации"],
    geoEnabled: false, status: "active",
  },
  // ===== GENERATION =====
  {
    id: "pseo-generator", slug: "pseo-generator",
    name: "Генератор GEO-страниц",
    shortDesc: "Создаёт структуру сотен SEO-страниц под города, услуги и кластеры спроса",
    category: "generation", icon: Sparkles,
    component: lazy(() => import("@/components/tools/PSEOGenerator")),
    gradient: "bg-gradient-to-br from-violet-950/40 to-purple-950/40",
    useCases: ["Масштабирование локального SEO", "Создание страниц под города и услуги", "Экспорт в CSV / JSON"],
    geoEnabled: false, status: "active",
    seoTitle: "Генератор GEO-страниц — массовое создание посадочных | OWNDEV",
    seoDescription: "Создайте сотни уникальных SEO-страниц под города и услуги: slug, title, H1, FAQ, Schema — готово к публикации.",
    seoH1: "Генератор GEO-страниц для роста трафика",
  },
  {
    id: "schema-generator", slug: "schema-generator",
    name: "Schema.org генератор",
    shortDesc: "JSON‑LD разметка: LocalBusiness, Organization, Article, Product, FAQ",
    category: "generation", icon: Code2,
    component: lazy(() => import("@/components/tools/SchemaGenerator")),
    gradient: "bg-gradient-to-br from-emerald-950/40 to-teal-950/40",
    useCases: ["Разметка карточки компании", "Генерация FAQ‑схемы", "Подготовка к Rich Results и AI‑цитированию"],
    geoEnabled: false, status: "active",
  },
  {
    id: "semantic-core", slug: "semantic-core",
    name: "Генератор семантического ядра",
    shortDesc: "AI‑генерация кластеров ключевых слов по интентам: инфо, коммерция, транзакция",
    category: "generation", icon: BrainCircuit,
    component: lazy(() => import("@/components/tools/SemanticCoreGenerator")),
    gradient: "bg-gradient-to-br from-amber-950/40 to-yellow-950/40",
    useCases: ["Сбор семантики для нового сайта", "Кластеризация по интентам", "Планирование контент-стратегии"],
    geoEnabled: true, status: "active",
  },
  // ===== CONTENT & LLM =====
  {
    id: "brand-tracker", slug: "brand-tracker",
    name: "AI Brand Tracker",
    shortDesc: "Проверьте, упоминают ли ChatGPT, Perplexity и Яндекс ваш бренд в ответах",
    category: "content", icon: Eye,
    component: lazy(() => import("@/components/tools/BrandTracker")),
    gradient: "bg-gradient-to-br from-cyan-950/40 to-teal-950/40",
    useCases: ["Мониторинг AI-видимости бренда", "Анализ конкурентов в AI-ответах", "Проверка тональности упоминаний"],
    geoEnabled: false, status: "active",
    seoTitle: "AI Brand Tracker — проверка упоминаний бренда в AI | OWNDEV",
    seoDescription: "Проверьте, упоминают ли ChatGPT, Perplexity и Яндекс Нейро ваш бренд. Тональность, позиция, конкуренты — бесплатно.",
    seoH1: "AI Brand Tracker — видит ли AI ваш бренд?",
  },
  {
    id: "ai-text-generator", slug: "ai-text-generator",
    name: "AI Генератор текстов",
    shortDesc: "Генерация SEO‑текстов: meta, intro, FAQ, описание услуг и товаров",
    category: "content", icon: PenTool,
    component: lazy(() => import("@/components/tools/AITextGenerator")),
    gradient: "bg-gradient-to-br from-fuchsia-950/40 to-pink-950/40",
    useCases: ["Генерация мета-тегов", "Написание FAQ для страниц", "Описания услуг и товаров"],
    geoEnabled: false, status: "active",
  },
  {
    id: "llm-prompt-helper", slug: "llm-prompt-helper",
    name: "LLM Prompt Helper",
    shortDesc: "Готовые промты для ChatGPT/Perplexity: генерация контента, улучшение страниц, AI Overviews",
    category: "content", icon: Bot,
    component: lazy(() => import("@/components/tools/LLMPromptHelper")),
    gradient: "bg-gradient-to-br from-pink-950/40 to-rose-950/40",
    useCases: ["Генерация SEO‑контента через LLM", "Улучшение существующих страниц", "Попадание в AI‑обзоры"],
    geoEnabled: false, status: "active",
  },
  {
    id: "anti-duplicate", slug: "anti-duplicate",
    name: "Anti‑Duplicate Checker",
    shortDesc: "Проверка текста на шаблонность и риск деиндексации",
    category: "content", icon: Shield,
    component: lazy(() => import("@/components/tools/AntiDuplicateChecker")),
    gradient: "bg-gradient-to-br from-red-950/40 to-purple-950/40",
    useCases: ["Перед массовой загрузкой контента", "После генерации текстов нейросетью", "Аудит GEO‑страниц"],
    geoEnabled: false, status: "active",
  },
  // ===== WEBMASTER =====
  {
    id: "webmaster-files", slug: "webmaster-files",
    name: "Генератор файлов вебмастера",
    shortDesc: "Sitemap.xml и robots.txt: создание, копирование и скачивание",
    category: "webmaster", icon: FileCode,
    component: lazy(() => import("@/components/tools/SitemapGenerator")),
    gradient: "bg-gradient-to-br from-teal-950/40 to-cyan-950/40",
    useCases: ["Создание sitemap для сайта", "Генерация robots.txt", "Настройка правил краулинга"],
    geoEnabled: false, status: "active",
  },
  {
    id: "internal-links", slug: "internal-links",
    name: "Проверка внутренних ссылок",
    shortDesc: "Поиск битых ссылок, nofollow-меток и анализ внутренней перелинковки",
    category: "webmaster", icon: Link2,
    component: lazy(() => import("@/components/tools/InternalLinksChecker")),
    gradient: "bg-gradient-to-br from-slate-950/40 to-zinc-950/40",
    useCases: ["Поиск битых ссылок", "Аудит перелинковки", "Проверка nofollow на внутренних ссылках"],
    geoEnabled: true, status: "active",
  },
  // ===== GEO pSEO PAGES =====
  {
    id: "geo-audit", slug: "geo-audit",
    name: "GEO-аудит",
    shortDesc: "Бесплатный GEO-аудит сайта. LLM Score + SEO Score в одном отчёте.",
    category: "analysis", icon: Search,
    component: lazy(() => import("@/components/site-check/ScanForm")),
    gradient: "bg-gradient-to-br from-primary/20 to-blue-950/40",
    useCases: ["Проверка AI-готовности сайта", "GEO-оптимизация", "Аудит для нейросетей"],
    geoEnabled: false, status: "active",
    seoTitle: "GEO-аудит сайта онлайн — бесплатно | OWNDEV",
    seoDescription: "Бесплатный GEO-аудит сайта. LLM Score + SEO Score. Проверяем готовность к AI-выдаче ChatGPT, Яндекс Нейро и Perplexity.",
    seoH1: "GEO-аудит сайта онлайн",
  },
  {
    id: "llm-score", slug: "llm-score",
    name: "LLM Score",
    shortDesc: "Узнайте LLM Score вашего сайта — готовность к AI-выдаче ChatGPT и Яндекс Нейро.",
    category: "analysis", icon: BrainCircuit,
    component: lazy(() => import("@/components/site-check/ScanForm")),
    gradient: "bg-gradient-to-br from-violet-950/40 to-indigo-950/40",
    useCases: ["Проверка LLM-готовности", "Оценка AI-видимости", "Мониторинг LLM Score"],
    geoEnabled: false, status: "active",
    seoTitle: "LLM Score сайта — проверить онлайн | OWNDEV",
    seoDescription: "Узнайте LLM Score вашего сайта — готовность к AI-выдаче ChatGPT и Яндекс Нейро. Бесплатно, без регистрации.",
    seoH1: "Проверить LLM Score сайта",
  },
  {
    id: "ai-ready-audit", slug: "ai-ready-audit",
    name: "AI-ready аудит",
    shortDesc: "Проверяем готовность сайта к AI-выдаче. E-E-A-T, Schema, llms.txt — всё в одном отчёте.",
    category: "analysis", icon: Shield,
    component: lazy(() => import("@/components/site-check/ScanForm")),
    gradient: "bg-gradient-to-br from-emerald-950/40 to-cyan-950/40",
    useCases: ["AI-ready проверка", "Аудит для ChatGPT", "Подготовка к AI-выдаче"],
    geoEnabled: false, status: "active",
    seoTitle: "AI-ready аудит сайта — проверка онлайн | OWNDEV",
    seoDescription: "Проверяем готовность сайта к AI-выдаче. E-E-A-T, Schema, llms.txt — всё в одном отчёте. Бесплатно.",
    seoH1: "AI-ready аудит сайта",
  },
  {
    id: "llms-txt-checker", slug: "llms-txt-checker",
    name: "llms.txt Checker",
    shortDesc: "Бесплатная проверка и генерация llms.txt для вашего сайта.",
    category: "webmaster", icon: FileCode,
    component: lazy(() => import("@/components/site-check/ScanForm")),
    gradient: "bg-gradient-to-br from-teal-950/40 to-green-950/40",
    useCases: ["Проверка llms.txt", "Генерация llms.txt", "Настройка для AI-краулеров"],
    geoEnabled: false, status: "active",
    seoTitle: "Проверка llms.txt онлайн | OWNDEV",
    seoDescription: "Бесплатная проверка и генерация llms.txt для вашего сайта. Стандарт для AI-краулеров ChatGPT, Claude и Perplexity.",
    seoH1: "Проверить и сгенерировать llms.txt",
  },
  {
    id: "eeat-audit", slug: "eeat-audit",
    name: "E-E-A-T аудит",
    shortDesc: "Проверяем E-E-A-T сигналы: экспертность, авторитетность, надёжность.",
    category: "analysis", icon: Star,
    component: lazy(() => import("@/components/site-check/ScanForm")),
    gradient: "bg-gradient-to-br from-amber-950/40 to-orange-950/40",
    useCases: ["E-E-A-T проверка", "Аудит авторитетности", "Улучшение доверия"],
    geoEnabled: false, status: "active",
    seoTitle: "E-E-A-T аудит сайта | OWNDEV",
    seoDescription: "Проверяем E-E-A-T сигналы: экспертность, авторитетность, надёжность. Бесплатно онлайн.",
    seoH1: "E-E-A-T аудит сайта онлайн",
  },
];

export const getToolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
export const getToolsByCategory = (categoryId: string) => tools.filter((t) => t.category === categoryId);
export const getGeoEnabledTools = () => tools.filter((t) => t.geoEnabled);
