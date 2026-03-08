import { type LucideIcon, Search, Code2, Calculator, FileCode, Sparkles, Shield, Bot } from "lucide-react";
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
}

export const categories = [
  { id: "analysis", name: "Анализ и аудит", icon: Search },
  { id: "generation", name: "Генерация (pSEO)", icon: Sparkles },
  { id: "content", name: "Контент и LLM", icon: Bot },
  { id: "webmaster", name: "Инструменты вебмастера", icon: FileCode },
];

export const tools: ToolDef[] = [
  // Analysis
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
  // Generation
  {
    id: "pseo-generator", slug: "pseo-generator",
    name: "pSEO Generator",
    shortDesc: "Генерация структуры GEO‑страниц: slug, title, h1, meta, шаблон текста",
    category: "generation", icon: Sparkles,
    component: lazy(() => import("@/components/tools/PSEOGenerator")),
    gradient: "bg-gradient-to-br from-violet-950/40 to-purple-950/40",
    useCases: ["Старт нового pSEO‑проекта", "Разработка структуры для копирайтеров", "Подготовка импорта в CMS"],
    geoEnabled: true, status: "active",
  },
  {
    id: "schema-generator", slug: "schema-generator",
    name: "Schema.org генератор",
    shortDesc: "JSON‑LD разметка: LocalBusiness, Organization, Article, Product, FAQ",
    category: "generation", icon: Code2,
    component: lazy(() => import("@/components/tools/SchemaGenerator")),
    gradient: "bg-gradient-to-br from-emerald-950/40 to-teal-950/40",
    useCases: ["Разметка карточки компании", "Генерация FAQ‑схемы", "Подготовка к Rich Results и AI‑цитированию"],
    geoEnabled: true, status: "active",
  },
  {
    id: "roi-calculator", slug: "roi-calculator",
    name: "ROI Calculator",
    shortDesc: "Расчёт окупаемости: заявки, продажи, выручка, прибыль, ROI",
    category: "generation", icon: Calculator,
    component: lazy(() => import("@/components/tools/ROICalculatorTool")),
    gradient: "bg-gradient-to-br from-lime-950/40 to-green-950/40",
    useCases: ["Оценка бюджета проекта", "Прогноз трафика по регионам", "Презентация ROI клиенту"],
    geoEnabled: true, status: "active",
  },
  // Content & LLM
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
  // Webmaster
  {
    id: "sitemap-generator", slug: "sitemap-generator",
    name: "Генератор sitemap.xml",
    shortDesc: "Создание карты сайта из списка URL с копированием и скачиванием",
    category: "webmaster", icon: FileCode,
    component: lazy(() => import("@/components/tools/SitemapGenerator")),
    gradient: "bg-gradient-to-br from-teal-950/40 to-cyan-950/40",
    useCases: ["Создание sitemap для нового сайта", "Разбивка на части для больших сайтов", "GEO‑sitemap"],
    geoEnabled: false, status: "active",
  },
];

export const getToolBySlug = (slug: string) => tools.find((t) => t.slug === slug);
export const getToolsByCategory = (categoryId: string) => tools.filter((t) => t.category === categoryId);
export const getGeoEnabledTools = () => tools.filter((t) => t.geoEnabled);
